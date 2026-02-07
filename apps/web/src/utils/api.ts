/**
 * Get the API base URL
 * Uses NEXT_PUBLIC_API_URL if set, otherwise detects from current hostname
 */
export function getApiUrl(): string {
  // Check environment variable first
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // If running in browser, use current hostname with port 4000
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Always use the current hostname (works for localhost, IP addresses, and domains)
    return `http://${hostname}:4000`;
  }

  // Default fallback
  return 'http://localhost:4000';
}
