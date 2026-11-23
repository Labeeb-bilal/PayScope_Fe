import type { NextConfig } from 'next';

// Static export: the Express API serves these files in production (one deployable, same origin).
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: { optimizePackageImports: ['@mantine/core', '@mantine/hooks', '@tabler/icons-react'] },
};

export default nextConfig;
