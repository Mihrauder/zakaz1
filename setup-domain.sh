#!/bin/bash

# Скрипт настройки домена bafservice.com
# Использование: ./setup-domain.sh

set -e

echo "🌐 Настраиваем домен bafservice.com..."

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

# Проверяем, что Nginx установлен
if ! command -v nginx &> /dev/null; then
    warn "Nginx не установлен. Устанавливаем..."
    sudo apt update
    sudo apt install nginx -y
fi

# Создаем конфигурацию для домена
log "Создаем конфигурацию Nginx для bafservice.com..."
sudo tee /etc/nginx/sites-available/bafservice.com > /dev/null <<EOF
server {
    listen 80;
    server_name bafservice.com www.bafservice.com;

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
log "Активируем сайт..."
sudo ln -sf /etc/nginx/sites-available/bafservice.com /etc/nginx/sites-enabled/

# Удаляем дефолтную конфигурацию если есть
sudo rm -f /etc/nginx/sites-enabled/default

# Проверяем конфигурацию
log "Проверяем конфигурацию Nginx..."
sudo nginx -t

# Перезапускаем Nginx
log "Перезапускаем Nginx..."
sudo systemctl reload nginx

# Проверяем статус
log "Статус Nginx:"
sudo systemctl status nginx --no-pager

log "✅ Домен bafservice.com настроен!"
log "🌐 Сайт должен быть доступен по адресу: http://bafservice.com"
log "📝 Не забудьте настроить DNS записи для домена:"
log "   A запись: bafservice.com -> IP_СЕРВЕРА"
log "   CNAME запись: www.bafservice.com -> bafservice.com"
