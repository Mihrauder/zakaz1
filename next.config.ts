import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  // Отключаем статическую генерацию
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
  // Принудительно делаем все страницы динамическими
  generateStaticParams: false,
};

export default nextConfig;
