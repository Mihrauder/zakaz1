#!/bin/bash

# Скрипт исправления финальных проблем
# Использование: ./fix-final-issues.sh

set -e

echo "🔧 Исправляем финальные проблемы..."

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

# Создаем директории для базы данных
log "Создаем директории для базы данных..."
mkdir -p data
mkdir -p logs

# Устанавливаем правильные права доступа
chmod 755 data
chmod 755 logs

# Пересобираем приложение
log "Пересобираем приложение..."
npm run build

# Копируем статические файлы
log "Копируем статические файлы..."
if [ -d ".next/standalone" ]; then
    cp -r public .next/standalone/
    cp -r .next/static .next/standalone/.next/
    log "Статические файлы скопированы"
fi

# Запускаем приложение через standalone сервер
log "Запускаем приложение через standalone сервер..."
pm2 start deploy/pm2/ecosystem.config.cjs

# Сохраняем конфигурацию
pm2 save

# Показываем статус
log "Статус приложения:"
pm2 status

log "✅ Все проблемы исправлены!"
log "🌐 Сайт доступен по адресу: https://bafservice.com"
log "📊 Логи: pm2 logs zakaz-site"
