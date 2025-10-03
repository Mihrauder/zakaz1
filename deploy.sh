#!/bin/bash

# Скрипт деплоя для Ubuntu
# Использование: ./deploy.sh

set -e

echo "🚀 Начинаем деплой приложения..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверяем, что мы в правильной директории
if [ ! -f "package.json" ]; then
    error "package.json не найден! Запустите скрипт из корня проекта."
    exit 1
fi

# Обновляем систему
log "Обновляем систему..."
sudo apt update && sudo apt upgrade -y

# Устанавливаем Node.js 20.x если не установлен
if ! command -v node &> /dev/null; then
    log "Устанавливаем Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    log "Node.js уже установлен: $(node --version)"
fi

# Устанавливаем PM2 глобально если не установлен
if ! command -v pm2 &> /dev/null; then
    log "Устанавливаем PM2..."
    sudo npm install -g pm2
else
    log "PM2 уже установлен: $(pm2 --version)"
fi

# Устанавливаем зависимости
log "Устанавливаем зависимости..."
npm ci

# Собираем приложение
log "Собираем приложение..."
npm run build

# Останавливаем существующие процессы PM2
log "Останавливаем существующие процессы..."
pm2 stop all || true
pm2 delete all || true

# Запускаем приложение через PM2
log "Запускаем приложение через PM2..."
pm2 start deploy/pm2/ecosystem.config.cjs

# Сохраняем конфигурацию PM2
pm2 save

# Настраиваем автозапуск PM2
pm2 startup
log "Выполните команду, которую показал PM2 для настройки автозапуска"

# Настраиваем Nginx (опционально)
if command -v nginx &> /dev/null; then
    log "Nginx найден. Создаем конфигурацию..."
    sudo tee /etc/nginx/sites-available/zakaz > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    # Активируем сайт
    sudo ln -sf /etc/nginx/sites-available/zakaz /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Перезапускаем Nginx
    sudo nginx -t && sudo systemctl reload nginx
    log "Nginx настроен и перезапущен"
else
    warn "Nginx не установлен. Установите его для проксирования: sudo apt install nginx"
fi

# Показываем статус
log "Статус приложения:"
pm2 status

log "✅ Деплой завершен!"
log "Приложение доступно по адресу: http://localhost:3000"
log ""
log "📋 Следующие шаги:"
log "1. Настройте DNS: bafservice.com -> IP_СЕРВЕРА"
log "2. Настройте HTTPS: ./setup-https.sh"
log "3. Настройте Telegram webhook: ./setup-telegram-webhook.sh"
log ""
log "Для просмотра логов: pm2 logs"
log "Для перезапуска: pm2 restart all"
