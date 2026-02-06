'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface GameDetectedNotificationProps {
  gameId: string;
  onAccept: () => void;
  onDismiss: () => void;
}

export function GameDetectedNotification({
  gameId,
  onAccept,
  onDismiss,
}: GameDetectedNotificationProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Auto-hide after 10 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!visible) return null;

  const handleAccept = () => {
    setVisible(false);
    router.push('/game/live');
    onAccept();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-blue-500 p-6 max-w-md z-50 animate-slide-up">
      <div className="flex items-start gap-4">
        <div className="text-4xl">🎮</div>
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-2">Match Detected!</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            A League game has been detected. View the ban phase and lobby?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleAccept}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-semibold"
            >
              View Lobby
            </button>
            <button
              onClick={() => {
                setVisible(false);
                onDismiss();
              }}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Dismiss
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            onDismiss();
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
