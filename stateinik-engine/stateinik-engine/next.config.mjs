/** @type {import('next').NextConfig} */

// Image host allow-list is env-driven so adopters point it at their own
// object storage / CDN without editing this file. Set IMAGE_REMOTE_PATTERNS
// to a comma-separated list of "https://host/path/**" entries.
function parseRemotePatterns() {
  const raw = process.env.IMAGE_REMOTE_PATTERNS?.trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      try {
        const url = new URL(entry);
        return {
          protocol: url.protocol.replace(':', '') || 'https',
          hostname: url.hostname,
          pathname: url.pathname && url.pathname !== '/' ? url.pathname : '/**',
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: parseRemotePatterns(),
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
      },
    ];
  },
};

export default nextConfig;
