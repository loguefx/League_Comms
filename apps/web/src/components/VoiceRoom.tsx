'use client';

import { useEffect, useState } from 'react';
import { useVoice } from '../hooks/useVoice';

interface VoiceRoomProps {
  roomKey: string;
}

export function VoiceRoom({ roomKey }: VoiceRoomProps) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { participants, isConnected, error, toggleMute, leave } = useVoice(roomKey, token);

  useEffect(() => {
    const fetchToken = async () => {
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:4000/voice/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ roomKey }),
        });

        if (!response.ok) {
          throw new Error('Failed to get voice token');
        }

        const data = await response.json();
        setToken(data.token);
      } catch (err) {
        console.error('Error fetching voice token:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [roomKey]);

  if (loading) {
    return <div>Connecting to voice room...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Voice Room</h3>
      <div className="mb-4">
        <p className={isConnected ? 'text-green-500' : 'text-red-500'}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </p>
        <p className="text-sm text-gray-500">Participants: {participants.length}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={toggleMute}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Toggle Mute
        </button>
        <button
          onClick={leave}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Leave
        </button>
      </div>
    </div>
  );
}
