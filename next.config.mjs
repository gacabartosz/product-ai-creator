/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/product-ai-creator',
  assetPrefix: '/product-ai-creator',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bartoszgaca.pl',
        pathname: '/product-ai-creator/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
