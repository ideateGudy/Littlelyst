import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  env: {
    API_URL: process.env.API_URL || "http://localhost:5000",
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: process.env.API_URL
          ? `${process.env.API_URL}/api/:path*`
          : "http://localhost:5000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
