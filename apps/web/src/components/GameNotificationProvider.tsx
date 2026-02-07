'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameDetectedNotification } from './GameDetectedNotification';
import { getApiUrl } from '@/utils/api';

interface GameNotificationContextType {
  gameDetected: boolean;
  gameId: string | null;
  dismissNotification: () => void;
}

const GameNotificationContext = createContext<GameNotificationContextType>({
  gameDetected: false,
  gameId: null,
  dismissNotification: () => {},
});

export function useGameNotification() {
  return useContext(GameNotificationContext);
}

export function GameNotificationProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameDetected, setGameDetected] = useState(false);
  const [gameId, setGameId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const apiUrl = getApiUrl();
    const newSocket = io(apiUrl, {
      auth: { token },
    });

    newSocket.on('connect', () => {
      console.log('Connected for game notifications');
    });

    newSocket.on('GAME_STARTED', (event: any) => {
      console.log('Game detected via notification:', event);
      setGameDetected(true);
      setGameId(event.gameId);
      setDismissed(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const dismissNotification = () => {
    setDismissed(true);
    setGameDetected(false);
  };

  return (
    <GameNotificationContext.Provider
      value={{
        gameDetected: gameDetected && !dismissed,
        gameId,
        dismissNotification,
      }}
    >
      {children}
      {gameDetected && !dismissed && gameId && (
        <GameDetectedNotification
          gameId={gameId}
          onAccept={() => {
            setDismissed(true);
            setGameDetected(false);
          }}
          onDismiss={dismissNotification}
        />
      )}
    </GameNotificationContext.Provider>
  );
}
