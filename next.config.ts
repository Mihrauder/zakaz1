import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
  // Убеждаемся, что статические файлы включаются
  experimental: {
    outputFileTracingRoot: undefined,
  },
  // Включаем статические файлы в standalone
  distDir: '.next',
};

export default nextConfig;
