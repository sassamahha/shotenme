// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'images-na.ssl-images-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'books.google.com',
      },
      {
        protocol: 'https',
        hostname: 'cover.openbd.jp',
      },
    ],
  },

  // ★ここを追加
  async rewrites() {
    return [
      {
        source: '/@:handle',
        destination: '/u/:handle',
      },
    ];
  },
};

export default nextConfig;
