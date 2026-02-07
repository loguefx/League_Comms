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
      <body className="bg-[#0D121E] text-white min-h-screen">
        <nav className="bg-[#161C2A] border-b border-[#283D4D] sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent hover:from-blue-400 hover:to-purple-500 transition">
                League Voice Companion
              </Link>
              <div className="flex gap-6 items-center">
                <Link href="/match-history" className="text-[#B4BEC8] hover:text-white transition font-medium">
                  Match History
                </Link>
                <Link href="/champions" className="text-[#B4BEC8] hover:text-white transition font-medium">
                  Champions
                </Link>
                <Link href="/game/live" className="text-[#B4BEC8] hover:text-white transition font-medium">
                  Live Game
                </Link>
                <Link href="/settings" className="text-[#B4BEC8] hover:text-white transition font-medium">
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
