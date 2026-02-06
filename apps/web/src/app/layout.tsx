import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { GameNotificationProvider } from '@/components/GameNotificationProvider';

export const metadata: Metadata = {
  title: 'League Voice Companion',
  description: 'League of Legends companion app with live lobby detection and voice rooms',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-xl font-bold">
                League Voice Companion
              </Link>
              <div className="flex gap-4">
                <Link href="/match-history" className="hover:text-blue-600">
                  Match History
                </Link>
                <Link href="/analytics" className="hover:text-blue-600">
                  Analytics
                </Link>
                <Link href="/game/live" className="hover:text-blue-600">
                  Live Game
                </Link>
                <Link href="/settings" className="hover:text-blue-600">
                  Settings
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <GameNotificationProvider>
          {children}
        </GameNotificationProvider>
      </body>
    </html>
  );
}
