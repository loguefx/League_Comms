'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AnalyticsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/champions');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0D121E] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-[#B4BEC8]">Redirecting to Champions...</p>
      </div>
    </div>
  );
}
