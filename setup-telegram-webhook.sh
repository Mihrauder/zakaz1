#!/bin/bash

# Скрипт настройки Telegram webhook
# Использование: ./setup-telegram-webhook.sh

set -e

echo "🤖 Настраиваем Telegram webhook..."

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

# Проверяем переменные окружения
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    error "TELEGRAM_BOT_TOKEN не установлен!"
    error "Загрузите переменные окружения: source .env"
    exit 1
fi

# Проверяем, что HTTPS настроен
log "Проверяем HTTPS..."
if ! curl -s -I https://bafservice.com | grep -q "200 OK"; then
    warn "HTTPS не настроен! Сначала запустите: ./setup-https.sh"
    exit 1
fi

# Настраиваем webhook
WEBHOOK_URL="https://bafservice.com/api/telegram/webhook"
log "Настраиваем webhook: $WEBHOOK_URL"

# Используем встроенный скрипт
node scripts/setup-webhook.js "$WEBHOOK_URL"

log "✅ Telegram webhook настроен!"
log "🔗 Webhook URL: $WEBHOOK_URL"
log "📱 Теперь бот будет получать сообщения через webhook"

# Показываем информацию о webhook
log "Информация о webhook:"
npm run webhook:info
