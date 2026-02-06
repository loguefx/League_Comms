/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@league-voice/shared', '@league-voice/ui', '@league-voice/riot'],
};

module.exports = nextConfig;
