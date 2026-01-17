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
      "globallink.runasp.net",
    ],
  },
  // Disable source maps in production to reduce bundle size
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Enable SWC minification for better performance
  swcMinify: true,
  // Optimize for modern browsers
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      'lucide-react',
      'framer-motion',
    ],
  },
  // Enable compression
  compress: true,
  // Optimize fonts
  optimizeFonts: true,
  // Enable React strict mode for better performance
  reactStrictMode: true,
}

export default nextConfig

