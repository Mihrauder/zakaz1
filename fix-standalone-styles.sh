#!/bin/bash

# Скрипт исправления стилей для standalone режима
# Использование: ./fix-standalone-styles.sh

set -e

echo "🎨 Исправляем стили для standalone режима..."

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
pm2 delete zakaz-site || true

# Очищаем кэш
log "Очищаем кэш..."
rm -rf .next
rm -rf out

# Пересобираем приложение
log "Пересобираем приложение..."
npm run build

# Проверяем, что standalone директория создана
if [ -d ".next/standalone" ]; then
    log "✅ Standalone директория создана"
    
    # Копируем статические файлы
    log "Копируем статические файлы..."
    cp -r public .next/standalone/
    cp -r .next/static .next/standalone/.next/
    
    # Создаем символические ссылки
    cd .next/standalone
    ln -sf ../.next/static .next/static
    cd ../..
    
    log "✅ Статические файлы скопированы"
else
    warn "Standalone директория не найдена"
    exit 1
fi

# Запускаем приложение через PM2
log "Запускаем приложение через PM2..."
pm2 start deploy/pm2/ecosystem.config.cjs

# Показываем статус
log "Статус приложения:"
pm2 status

log "✅ Стили исправлены для standalone режима!"
log "🌐 Проверьте сайт: https://bafservice.com"
log "📊 Логи: pm2 logs zakaz-site"
