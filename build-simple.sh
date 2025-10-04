#!/bin/bash

echo "🔨 Простая сборка..."

# Останавливаем все
pm2 stop all || true
pm2 delete all || true

# Очищаем
rm -rf .next

# Собираем
echo "Собираем..."
npm run build

# Проверяем результат
if [ -d ".next" ]; then
    echo "✅ Сборка успешна"
    
    # Копируем статику
    if [ -d ".next/standalone" ]; then
        echo "Копируем статику..."
        cp -r public .next/standalone/
        cp -r .next/static .next/standalone/.next/
    fi
    
    # Запускаем
    echo "Запускаем..."
    pm2 start deploy/pm2/ecosystem.config.cjs
    
    echo "✅ Готово!"
    pm2 status
else
    echo "❌ Сборка не удалась"
    exit 1
fi
