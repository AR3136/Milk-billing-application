import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 1. Enable compression
  compress: true,

  // 2. React strict mode for better performance & bug finding
  reactStrictMode: true,

  // 3. Image optimization cache parameters
  images: {
    minimumCacheTTL: 60,
    formats: ['image/webp'],
  },
};

export default nextConfig;
