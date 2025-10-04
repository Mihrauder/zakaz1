#!/bin/bash

echo "🏭 Production сборка..."

# Останавливаем все
pm2 stop all || true
pm2 delete all || true

# Очищаем кэш
rm -rf .next

# Устанавливаем переменные окружения
export NODE_ENV=production

# Собираем
echo "Собираем production..."
npm run build

# Проверяем результат
if [ -d ".next" ]; then
    echo "✅ Сборка успешна"
    
    # Копируем статику для standalone
    if [ -d ".next/standalone" ]; then
        echo "Копируем статику..."
        cp -r public .next/standalone/
        cp -r .next/static .next/standalone/.next/
        
        # Создаем символические ссылки
        cd .next/standalone
        ln -sf ../.next/static .next/static
        cd ../..
    fi
    
    # Запускаем production
    echo "Запускаем production..."
    pm2 start deploy/pm2/ecosystem.config.cjs
    
    echo "✅ Production готов!"
    pm2 status
else
    echo "❌ Сборка не удалась"
    exit 1
fi
