import type { NextConfig } from "next";
import path from 'node:path';

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.resolve(__dirname, '../..'),
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const internalApiUrl = process.env.INTERNAL_API_URL
      || (process.env.NODE_ENV === "production"
        ? "http://bff-api:3000"
        : "http://localhost:3000")

    return [
      {
        source: "/api/:path*",
        destination: `${internalApiUrl}/api/:path*`,
      },
    ]
  },
};

export default nextConfig;
