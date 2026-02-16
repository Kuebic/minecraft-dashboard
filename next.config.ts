import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mc-heads.net',
        pathname: '/avatar/**',
      },
    ],
  },
  // Use empty turbopack config to silence warning
  turbopack: {},
};

export default nextConfig;
