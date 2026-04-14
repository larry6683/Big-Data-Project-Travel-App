import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add this line to ensure Turbopack correctly resolves and transpiles the library
  transpilePackages: ['react-datepicker'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.kiwi.com',
        port: '',
        pathname: '/airlines/**',
      },
    ],
  },
};

export default nextConfig;