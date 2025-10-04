#!/bin/bash

# Скрипт исправления стилей для export режима
# Использование: ./fix-export-styles.sh

set -e

echo "🎨 Исправляем стили для export режима..."

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

# Останавливаем приложение
log "Останавливаем приложение..."
pm2 stop zakaz-site || true

# Очищаем кэш
log "Очищаем кэш..."
rm -rf .next
rm -rf out

# Пересобираем приложение
log "Пересобираем приложение..."
npm run build

# Проверяем, что out директория создана
if [ -d "out" ]; then
    log "✅ Export директория создана"
    
    # Копируем статические файлы
    log "Копируем статические файлы..."
    cp -r public/* out/
    
    # Создаем простой сервер для статических файлов
    log "Создаем простой сервер..."
    cat > server.js << 'EOF'
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Обслуживаем статические файлы
app.use(express.static(path.join(__dirname, 'out')));

// Все остальные запросы отправляем на index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'out', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
EOF

    log "✅ Статический сервер создан"
else
    warn "Export директория не найдена"
    exit 1
fi

# Запускаем приложение
log "Запускаем приложение..."
pm2 start server.js --name zakaz-site

# Показываем статус
log "Статус приложения:"
pm2 status

log "✅ Стили исправлены для export режима!"
log "🌐 Проверьте сайт: https://bafservice.com"
log "📊 Логи: pm2 logs zakaz-site"
