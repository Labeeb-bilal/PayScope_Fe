import type { NextConfig } from 'next';
import { parseApiUrl } from './src/lib/env';

parseApiUrl(process.env.NEXT_PUBLIC_API_URL);

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  images: { unoptimized: true },
  experimental: { optimizePackageImports: ['@mantine/core', '@mantine/hooks', '@tabler/icons-react'] },
};

export default nextConfig;
