/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  
  // Disable static generation completely
  staticPageGenerationTimeout: 1,
  
  // Skip type checking and linting during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Environment variables available at build time
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
    NEXT_PUBLIC_REALTIME_URL: process.env.NEXT_PUBLIC_REALTIME_URL || 'ws://localhost:4100',
  },
  
  // Image optimization (if using external images)
  images: {
    unoptimized: true,
    domains: ['localhost', 'web-production-a5a7cc.up.railway.app', 'invitation-production-9f75.up.railway.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.up.railway.app',
      },
    ],
  },
  
  // Disable static export for all pages
  trailingSlash: true,
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/health',
        destination: '/api/health',
        permanent: true,
      },
      {
        source: '/ready',
        destination: '/api/ready',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
