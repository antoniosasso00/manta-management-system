/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    // !! WARN !!
    // Pericolosamente permetti di buildare anche se ci sono errori TypeScript
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: Questo permette builds di produzione con errori ESLint
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
}

module.exports = nextConfig