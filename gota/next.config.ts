import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: []
  },
  experimental: {
    optimizeCss: true,
    optimisticClientCache: true,
  }
};

export default nextConfig;
