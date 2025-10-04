#!/bin/bash

echo "🚀 Быстрое исправление..."

# Останавливаем все
pm2 stop all || true
pm2 delete all || true

# Очищаем
rm -rf .next out

# Собираем
npm run build

# Копируем статику
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

# Запускаем
pm2 start deploy/pm2/ecosystem.config.cjs

echo "✅ Готово!"
pm2 status
