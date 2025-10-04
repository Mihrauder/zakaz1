import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
  experimental: {
    outputFileTracingRoot: undefined,
  },
};

export default nextConfig;
