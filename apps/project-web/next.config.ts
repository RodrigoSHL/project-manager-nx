import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
