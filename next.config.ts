import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations
  experimental: {
    // Optimize CSS imports
    optimizeCss: true,
  },
  
  // Server Components external packages
  serverExternalPackages: ["prisma", "bcryptjs"],

  // Compiler optimizations
  compiler: {
    // Remove console.logs in production
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"]
    } : false,
  },

  // Security headers
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-inline needed for MUI
              "style-src 'self' 'unsafe-inline'", // unsafe-inline needed for MUI
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "base-uri 'self'",
            ].join('; '),
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // XSS Protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permission Policy (limit browser features)
          {
            key: 'Permissions-Policy',
            value: [
              'camera=(self)',
              'microphone=()',
              'geolocation=()',
              'gyroscope=()',
              'magnetometer=()',
              'payment=()',
              'usb=()',
              'fullscreen=(self)',
            ].join(', '),
          },
          // Strict Transport Security (HTTPS only)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Cross-Origin Embedder Policy
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
          // Cross-Origin Opener Policy  
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          // Cross-Origin Resource Policy
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          // Cache control for static assets
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Special headers for API routes
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      {
        // Headers for static files
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Image optimization for QR codes and logos
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: [], // Add external domains if needed
    dangerouslyAllowSVG: true, // For QR codes
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Note: i18n configuration removed - not supported in App Router
  // Internationalization will be handled via app-dir conventions if needed

  // Environment variables validation
  env: {
    // Expose only safe environment variables to client
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
  },

  // Note: Webpack config disabled when using Turbopack
  // Turbopack handles bundling automatically

  // Output configuration for production
  output: process.env.NETLIFY ? 'export' : process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Power Pack features (if using Next.js Pro)
  poweredByHeader: false, // Remove X-Powered-By header

  // Compression
  compress: true,

  // Static optimization
  trailingSlash: false,

  // Redirects for legacy URLs
  async redirects() {
    return [
      // Add any legacy redirects here
      {
        source: '/dashboard',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // Rewrites for API versioning
  async rewrites() {
    return [
      // API versioning support
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*',
      },
    ];
  },

  // TypeScript strict mode
  typescript: {
    // Enable strict mode checks
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Enable ESLint during builds
    ignoreDuringBuilds: false,
    dirs: ['src'], // Only check src directory
  },

  // Logging configuration
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
};

export default nextConfig;
