#!/bin/bash

# Быстрое исправление ошибки TypeScript
echo "🔧 Исправляем ошибку TypeScript..."

# Устанавливаем все зависимости (включая devDependencies)
npm install

# Собираем приложение
npm run build

# Перезапускаем PM2
pm2 restart zakaz-site

echo "✅ Исправление завершено!"
