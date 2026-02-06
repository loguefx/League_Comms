import { useState, useEffect } from 'react';
import { Room, RoomEvent, RemoteParticipant, LocalParticipant } from 'livekit-client';

export function useVoice(roomKey: string | null, token: string | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<(RemoteParticipant | LocalParticipant)[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!roomKey || !token) {
      return;
    }

    const connect = async () => {
      try {
        const { Room } = await import('livekit-client');
        const newRoom = new Room();
        
        const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'http://localhost:7880';
        await newRoom.connect(livekitUrl, token);

        setRoom(newRoom);
        setIsConnected(true);
        setParticipants(Array.from(newRoom.participants.values()));

        newRoom.on(RoomEvent.ParticipantConnected, () => {
          setParticipants(Array.from(newRoom.participants.values()));
        });

        newRoom.on(RoomEvent.ParticipantDisconnected, () => {
          setParticipants(Array.from(newRoom.participants.values()));
        });

        newRoom.on(RoomEvent.Disconnected, () => {
          setIsConnected(false);
          setRoom(null);
        });
      } catch (err) {
        setError(err as Error);
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [roomKey, token]);

  const toggleMute = async () => {
    if (room?.localParticipant) {
      await room.localParticipant.setMicrophoneEnabled(
        !room.localParticipant.isMicrophoneEnabled
      );
    }
  };

  const leave = async () => {
    if (room) {
      await room.disconnect();
      setRoom(null);
      setIsConnected(false);
    }
  };

  return {
    room,
    participants,
    isConnected,
    error,
    toggleMute,
    leave,
  };
}
