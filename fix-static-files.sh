#!/bin/bash

# Скрипт исправления статических файлов
# Использование: ./fix-static-files.sh

set -e

echo "🎨 Исправляем статические файлы..."

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

# Устанавливаем зависимости
log "Устанавливаем зависимости..."
npm install

# Пересобираем приложение
log "Пересобираем приложение..."
npm run build

# Копируем статические файлы в standalone директорию
log "Копируем статические файлы..."
if [ -d ".next/standalone" ]; then
    # Копируем public директорию
    cp -r public .next/standalone/
    
    # Копируем .next/static директорию
    cp -r .next/static .next/standalone/.next/
    
    log "Статические файлы скопированы"
else
    warn "Standalone директория не найдена"
fi

# Запускаем приложение
log "Запускаем приложение..."
pm2 start zakaz-site

log "✅ Статические файлы исправлены!"
log "🌐 Проверьте сайт: https://bafservice.com"
