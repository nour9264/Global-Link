/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Enable Next.js image optimization for better performance
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    // Allow loading images from the API host (e.g. ngrok host). If your API host changes,
    // add its hostname here or use `remotePatterns` for more flexible matching.
    domains: [
      "unceriferous-eda-nonseasonally.ngrok-free.dev",
    ],
  },
  productionBrowserSourceMaps: true, // Enable source maps for debugging
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

export default nextConfig
