#!/bin/bash
# Deploy script per Neon database e Netlify

set -e

echo "🚀 MES Aerospazio - Deploy su Neon + Netlify"
echo "=============================================="

# Verifica presenza variabili ambiente
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL non trovata. Configura prima le variabili ambiente."
    echo "Esempio: export DATABASE_URL='postgresql://user:pass@host/db?sslmode=require'"
    exit 1
fi

echo "🔍 Verifica connessione database..."
npx prisma db push --accept-data-loss

echo "📊 Genera client Prisma..."
npx prisma generate

echo "🌱 Esegui seed database..."
npm run db:seed-complete

echo "🏗️ Build applicazione..."
npm run build

echo "✅ Deploy completato con successo!"
echo "📝 Prossimi passi:"
echo "   1. Configura variabili ambiente su Netlify"
echo "   2. Deploya tramite git push o Netlify CLI"
echo "   3. Verifica funzionamento su https://your-app.netlify.app"