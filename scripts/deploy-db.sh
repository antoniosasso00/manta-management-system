#!/bin/bash

# Script di migrazione database per produzione Netlify
# Questo script deve essere eseguito DOPO aver configurato DATABASE_URL

echo "🚀 Migrazione Database per Produzione"
echo "======================================"

# Verifica che DATABASE_URL sia settata
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERRORE: DATABASE_URL non configurata"
    echo "Configura DATABASE_URL nelle variabili d'ambiente Netlify"
    exit 1
fi

echo "✅ DATABASE_URL configurata"

# Genera client Prisma
echo "📦 Generando client Prisma..."
npm run db:generate

# Esegui migrazioni
echo "🔄 Eseguendo migrazioni database..."
npm run db:migrate:deploy

# Seed del database (opzionale per produzione)
if [ "$SEED_DATABASE" = "true" ]; then
    echo "🌱 Seeding database..."
    npm run db:seed-complete
fi

echo "✅ Migrazione completata con successo!"
echo "Il database è pronto per la produzione"