#!/bin/bash

echo "🔍 Проверяем сборку..."

# Останавливаем приложение
pm2 stop zakaz-site || true

# Проверяем, что создалось после сборки
echo "Содержимое .next директории:"
ls -la .next/

echo ""
echo "Содержимое .next/standalone (если есть):"
if [ -d ".next/standalone" ]; then
    ls -la .next/standalone/
else
    echo "❌ .next/standalone не существует!"
fi

echo ""
echo "Ищем server.js:"
find .next -name "server.js" 2>/dev/null || echo "❌ server.js не найден"

echo ""
echo "Проверяем package.json scripts:"
grep -A 5 -B 5 "start" package.json
