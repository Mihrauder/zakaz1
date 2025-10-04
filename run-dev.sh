#!/bin/bash

echo "🚀 Запуск в dev режиме..."

# Останавливаем все
pm2 stop all || true
pm2 delete all || true

# Запускаем в dev режиме
echo "Запускаем в dev режиме..."
pm2 start "npm run dev" --name zakaz-site

echo "✅ Dev сервер запущен!"
echo "🌐 Сайт: https://bafservice.com"
pm2 status
