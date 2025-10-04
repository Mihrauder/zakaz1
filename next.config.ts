import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
  // Отключаем статическую оптимизацию для export режима
  distDir: '.next',
};

export default nextConfig;
