#!/bin/bash

# Zatrzymanie skryptu w przypadku napotkania wpadki
set -e

# Konfiguracja logowania
LOG_DIR="logs/pull"
LOG_FILE="$LOG_DIR/pull-$(date '+%Y-%m-%d-%H-%M-%S').log"
mkdir -p "$LOG_DIR"

# Przekierowanie całego wyjścia do terminala i pliku logu
exec > >(tee -a "$LOG_FILE") 2>&1

echo "--------------------------------------------------------"
echo "📅 Rozpoczęcie: $(date '+%Y-%m-%d %H:%M:%S')"
echo "🚀 Rozpoczynam zaciąganie zmian i wdrażanie aplikacji Next.js..."

echo "[1/4] 📥 Pobieranie najnowszych zmian i synchronizacja (branch: develop)..."
git fetch origin develop
git reset --hard origin/develop

echo "[2/4] 📦 Instalacja i aktualizacja zależności (NPM)..."
npm install

echo "[3/4] 🎨 Kompilacja produkcyjna (Next.js Build)..."
npm run build

echo "[4/4] 🔄 Oświeżenie instancji pod zarządem PM2..."
# Jeśli ecosystem.config.cjs nie istnieje, stwórz go z przykładu
if [ ! -f "ecosystem.config.cjs" ]; then
    cp ecosystem.config.example.cjs ecosystem.config.cjs
    echo "⚠️ Utworzono ecosystem.config.cjs z przykładu. Sprawdź go!"
fi

pm2 startOrRestart ecosystem.config.cjs --update-env
pm2 save

# Pobieranie tagu do wersji
TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
DATE=$(date '+%Y-%m-%d %H:%M:%S')
V="${TAG:-no-tag} - $DATE"

# Generowanie pliku wersji
echo "$V" > VERSION.txt

echo "========================================="
echo "✅ Aktualizacja zakończona sukcesem! Aplikacja działa w nowej wersji."
echo "📅 Zakończenie: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="