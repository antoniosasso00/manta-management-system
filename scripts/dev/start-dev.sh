#!/bin/bash

# Script per avviare il server di sviluppo in modo stabile
set -e

echo "🚀 Avvio Manta Management System - Server di Sviluppo"
echo "=================================================="

# Pulisce processi precedenti
echo "📝 Pulizia processi precedenti..."
pkill -f "next dev" 2>/dev/null || true
sleep 2

# Pulisce cache Next.js
echo "🧹 Pulizia cache Next.js..."
rm -rf .next

# Verifica porta disponibile
PORT=3001
if ss -tlnp | grep -q ":${PORT}"; then
    echo "⚠️  Porta ${PORT} occupata. Cercando porta libera..."
    PORT=3002
    if ss -tlnp | grep -q ":${PORT}"; then
        PORT=3003
    fi
fi

echo "🌐 Avvio server sulla porta ${PORT}..."
echo "📱 URL: http://localhost:${PORT}"
echo "📱 Network: http://$(hostname -I | awk '{print $1}'):${PORT}"
echo ""
echo "💡 Per arrestare: Ctrl+C"
echo "📋 Per testare sincronizzazione: http://localhost:${PORT}/admin/sync"
echo ""

# Avvia server con gestione errori
npm run dev -- --port ${PORT} --turbo 2>&1 | while read line; do
    echo "[$(date '+%H:%M:%S')] $line"
done