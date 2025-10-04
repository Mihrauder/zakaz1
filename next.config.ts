import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
  // Отключаем пререндеринг
  experimental: {
    esmExternals: false,
  },
  // Принудительно делаем все страницы динамическими
  generateStaticParams: false,
};

export default nextConfig;
