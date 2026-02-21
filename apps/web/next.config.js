/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  
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
  trailingSlash: false,
  
  // Webpack configuration to fix chunk caching issues
  webpack: (config, { isServer }) => {
    // Force new chunk names to avoid cached chunks
    config.cache = false;
    
    if (isServer) {
      // Disable chunking for server-side to isolate the issue
      config.optimization = {
        ...config.optimization,
        splitChunks: false,
        minimize: false,
      };
    }
    
    return config;
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data: https:",
              "font-src 'self'",
              "connect-src 'self' https: wss:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; ')
          },
        ],
      },
    ];
  },
  
  // Rewrites - proxy API requests to internal API server
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
      {
        source: '/health',
        destination: 'http://localhost:4000/health',
      },
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/ready',
        destination: '/api/ready',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
