import type { NextConfig } from "next";

const apiProxyUrl = process.env.API_PROXY_URL ?? "https://zury-jm0l.onrender.com";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@zury/shared"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyUrl}/api/:path*`,
      },
      {
        source: "/health",
        destination: `${apiProxyUrl}/health`,
      },
    ];
  },
};

export default nextConfig;
