#!/bin/bash

# Скрипт настройки HTTPS с Let's Encrypt для Telegram webhook
# Использование: ./setup-https.sh

set -e

echo "🔒 Настраиваем HTTPS для bafservice.com..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверяем, что домен указывает на сервер
log "Проверяем DNS..."
DOMAIN_IP=$(dig +short bafservice.com)
SERVER_IP=$(curl -s ifconfig.me)

if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
    warn "DNS может быть не настроен правильно:"
    warn "Домен bafservice.com указывает на: $DOMAIN_IP"
    warn "IP сервера: $SERVER_IP"
    warn "Продолжаем, но убедитесь, что DNS настроен правильно"
fi

# Устанавливаем Certbot если не установлен
if ! command -v certbot &> /dev/null; then
    log "Устанавливаем Certbot..."
    sudo apt update
    sudo apt install snapd -y
    sudo snap install core; sudo snap refresh core
    sudo snap install --classic certbot
    sudo ln -sf /snap/bin/certbot /usr/bin/certbot
else
    log "Certbot уже установлен"
fi

# Останавливаем Nginx для получения сертификата
log "Останавливаем Nginx для получения сертификата..."
sudo systemctl stop nginx

# Получаем SSL сертификат
log "Получаем SSL сертификат для bafservice.com..."
sudo certbot certonly --standalone -d bafservice.com -d www.bafservice.com --non-interactive --agree-tos --email admin@bafservice.com

# Создаем конфигурацию Nginx с HTTPS
log "Создаем конфигурацию Nginx с HTTPS..."
sudo tee /etc/nginx/sites-available/bafservice.com > /dev/null <<EOF
server {
    listen 80;
    server_name bafservice.com www.bafservice.com;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name bafservice.com www.bafservice.com;

    ssl_certificate /etc/letsencrypt/live/bafservice.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bafservice.com/privkey.pem;
    
    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

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
sudo rm -f /etc/nginx/sites-enabled/default

# Проверяем конфигурацию
log "Проверяем конфигурацию Nginx..."
sudo nginx -t

# Запускаем Nginx
log "Запускаем Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Настраиваем автообновление сертификатов
log "Настраиваем автообновление сертификатов..."
sudo tee /etc/cron.d/certbot > /dev/null <<EOF
0 12 * * * root certbot renew --quiet --post-hook "systemctl reload nginx"
EOF

log "✅ HTTPS настроен!"
log "🌐 Сайт доступен по адресу: https://bafservice.com"
log "🔒 SSL сертификат автоматически обновляется"
