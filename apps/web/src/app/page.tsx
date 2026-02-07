import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0D121E] via-[#161C2A] to-[#0D121E]">
      <div className="container mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            League Voice Companion
          </h1>
          <p className="text-xl text-[#B4BEC8] mb-2">Your ultimate League of Legends companion</p>
          <p className="text-lg text-[#78828C]">Live game detection • Voice comms • Match analytics</p>
        </div>
        
        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          <Link
            href="/match-history"
            className="group relative bg-[#161C2A] border border-[#283D4D] rounded-xl p-6 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Match History</h2>
            </div>
            <p className="text-[#B4BEC8] text-sm leading-relaxed">View detailed match history with comprehensive stats and analysis</p>
            <div className="mt-4 text-blue-400 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
              View History <span>→</span>
            </div>
          </Link>

          <Link
            href="/analytics"
            className="group relative bg-[#161C2A] border border-[#283D4D] rounded-xl p-6 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Analytics</h2>
            </div>
            <p className="text-[#B4BEC8] text-sm leading-relaxed">Champion win rates, pick rates, and meta analysis by rank</p>
            <div className="mt-4 text-purple-400 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
              View Analytics <span>→</span>
            </div>
          </Link>

          <Link
            href="/game/live"
            className="group relative bg-[#161C2A] border border-[#283D4D] rounded-xl p-6 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Live Game</h2>
            </div>
            <p className="text-[#B4BEC8] text-sm leading-relaxed">Real-time lobby detection with teammate stats and voice comms</p>
            <div className="mt-4 text-green-400 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
              View Live <span>→</span>
            </div>
          </Link>

          <Link
            href="/settings"
            className="group relative bg-[#161C2A] border border-[#283D4D] rounded-xl p-6 hover:border-pink-500/50 hover:shadow-lg hover:shadow-pink-500/10 transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-pink-500/10 rounded-lg group-hover:bg-pink-500/20 transition">
                <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Settings</h2>
            </div>
            <p className="text-[#B4BEC8] text-sm leading-relaxed">Configure audio devices, Riot account, and preferences</p>
            <div className="mt-4 text-pink-400 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
              Configure <span>→</span>
            </div>
          </Link>
        </div>

        {/* Quick Stats Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-[#161C2A] border border-[#283D4D] rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">Auto-Detect</div>
                <p className="text-[#B4BEC8] text-sm">Automatically detects when you join a match</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">Voice Comms</div>
                <p className="text-[#B4BEC8] text-sm">Join voice rooms with your teammates</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">Live Stats</div>
                <p className="text-[#B4BEC8] text-sm">See teammate stats before the game starts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
