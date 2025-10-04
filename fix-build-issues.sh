#!/bin/bash

# Скрипт исправления проблем сборки
# Использование: ./fix-build-issues.sh

set -e

echo "🔧 Исправляем проблемы сборки..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Останавливаем приложение
log "Останавливаем приложение..."
pm2 stop zakaz-site || true

# Очищаем кэш и node_modules
log "Очищаем кэш..."
rm -rf .next
rm -rf node_modules
rm -rf package-lock.json

# Устанавливаем зависимости заново
log "Устанавливаем зависимости..."
npm install

# Создаем простую конфигурацию Tailwind
log "Создаем конфигурацию Tailwind..."
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}
EOF

# Создаем простую PostCSS конфигурацию
log "Создаем PostCSS конфигурацию..."
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
}
EOF

# Собираем приложение
log "Собираем приложение..."
npm run build

# Копируем статические файлы
log "Копируем статические файлы..."
if [ -d ".next/standalone" ]; then
    cp -r public .next/standalone/
    cp -r .next/static .next/standalone/.next/
    log "Статические файлы скопированы"
fi

# Запускаем приложение
log "Запускаем приложение..."
pm2 start zakaz-site

log "✅ Проблемы сборки исправлены!"
log "🌐 Проверьте сайт: https://bafservice.com"
