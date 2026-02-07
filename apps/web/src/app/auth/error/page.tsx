'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthError() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState('An unknown error occurred');

  useEffect(() => {
    const error = searchParams.get('message');
    if (error) {
      setMessage(decodeURIComponent(error));
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#0D121E] flex items-center justify-center">
      <div className="bg-[#161C2A] border border-[#283D4D] rounded-xl p-8 max-w-md w-full">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4 text-white">Authentication Error</h1>
          <p className="text-[#B4BEC8] mb-6">{message}</p>
          
          <div className="space-y-3">
            <Link
              href="/settings"
              className="block w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
            >
              Try Again
            </Link>
            <button
              onClick={() => router.push('/')}
              className="block w-full px-4 py-3 bg-[#0D121E] border border-[#283D4D] text-[#B4BEC8] rounded-lg hover:bg-[#1A202C] transition"
            >
              Go Home
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-[#283D4D]">
            <p className="text-sm text-[#78828C] mb-2">Common issues:</p>
            <ul className="text-sm text-[#78828C] text-left space-y-1">
              <li>• Redirect URI not registered in Riot Developer Portal</li>
              <li>• Client ID or Secret incorrect</li>
              <li>• Network connectivity issues</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
