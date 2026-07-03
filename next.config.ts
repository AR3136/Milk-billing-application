import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 1. Enable static export for Capacitor deployment
  output: 'export',

  // 2. Disable server-side image optimization for static export
  images: {
    unoptimized: true,
  },

  // 3. Ensure trailing slashes are added for Capacitor routing compatibility
  trailingSlash: true,

  // 4. Enable compression (ignored in static builds but kept for reference)
  compress: true,

  // 5. React strict mode
  reactStrictMode: true,
};

export default nextConfig;
