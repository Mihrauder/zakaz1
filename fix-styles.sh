#!/bin/bash

# Скрипт исправления стилей
# Использование: ./fix-styles.sh

set -e

echo "🎨 Исправляем стили..."

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
    
    # Создаем символические ссылки для статических файлов
    cd .next/standalone
    ln -sf ../.next/static .next/static
    cd ../..
    
    log "Статические файлы скопированы"
else
    warn "Standalone директория не найдена"
fi

# Проверяем, что файлы скопированы
log "Проверяем статические файлы..."
if [ -d ".next/standalone/public" ]; then
    log "✅ Public директория скопирована"
    ls -la .next/standalone/public/ | head -5
fi

if [ -d ".next/standalone/.next/static" ]; then
    log "✅ Static директория скопирована"
    ls -la .next/standalone/.next/static/ | head -5
fi

# Запускаем приложение
log "Запускаем приложение..."
pm2 start zakaz-site

# Показываем статус
log "Статус приложения:"
pm2 status

log "✅ Стили исправлены!"
log "🌐 Проверьте сайт: https://bafservice.com"
log "📊 Логи: pm2 logs zakaz-site"
