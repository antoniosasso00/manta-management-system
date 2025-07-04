#!/bin/bash

# Script per migrazione automatica Material-UI Grid v7 syntax
# Converte la sintassi legacy <Grid item xs={...}> alla nuova sintassi <Grid size={{...}}>

echo "🚀 Iniziando migrazione Material-UI Grid v7 syntax..."

# Trova tutti i file TypeScript/TSX
FILES=$(find src -name "*.tsx" -o -name "*.ts" | grep -v node_modules)
TOTAL_FILES=0
MODIFIED_FILES=0

# Conta i file totali
for file in $FILES; do
    if grep -q "Grid.*item.*xs=" "$file"; then
        ((TOTAL_FILES++))
    fi
done

echo "📊 Trovati $TOTAL_FILES file con sintassi Grid legacy"

# Backup directory
BACKUP_DIR="backups/grid-v7-migration-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "💾 Creando backup in $BACKUP_DIR..."

# Processa ogni file
for file in $FILES; do
    if grep -q "Grid.*item.*xs=" "$file"; then
        echo "🔧 Processando: $file"
        
        # Crea backup
        cp "$file" "$BACKUP_DIR/"
        
        # Pattern di migrazione più comuni:
        
        # 1. <Grid item xs={12}>
        sed -i.tmp 's/<Grid[[:space:]]\+item[[:space:]]\+xs={\([0-9]\+\)}>/<Grid size={{ xs: \1 }}>/g' "$file"
        
        # 2. <Grid item xs={12} sm={6}>
        sed -i.tmp 's/<Grid[[:space:]]\+item[[:space:]]\+xs={\([0-9]\+\)}[[:space:]]\+sm={\([0-9]\+\)}>/<Grid size={{ xs: \1, sm: \2 }}>/g' "$file"
        
        # 3. <Grid item xs={12} md={6}>
        sed -i.tmp 's/<Grid[[:space:]]\+item[[:space:]]\+xs={\([0-9]\+\)}[[:space:]]\+md={\([0-9]\+\)}>/<Grid size={{ xs: \1, md: \2 }}>/g' "$file"
        
        # 4. <Grid item xs={12} sm={6} md={4}>
        sed -i.tmp 's/<Grid[[:space:]]\+item[[:space:]]\+xs={\([0-9]\+\)}[[:space:]]\+sm={\([0-9]\+\)}[[:space:]]\+md={\([0-9]\+\)}>/<Grid size={{ xs: \1, sm: \2, md: \3 }}>/g' "$file"
        
        # 5. <Grid item xs={12} sm={6} md={4} lg={3}>
        sed -i.tmp 's/<Grid[[:space:]]\+item[[:space:]]\+xs={\([0-9]\+\)}[[:space:]]\+sm={\([0-9]\+\)}[[:space:]]\+md={\([0-9]\+\)}[[:space:]]\+lg={\([0-9]\+\)}>/<Grid size={{ xs: \1, sm: \2, md: \3, lg: \4 }}>/g' "$file"
        
        # 6. <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
        sed -i.tmp 's/<Grid[[:space:]]\+item[[:space:]]\+xs={\([0-9]\+\)}[[:space:]]\+sm={\([0-9]\+\)}[[:space:]]\+md={\([0-9]\+\)}[[:space:]]\+lg={\([0-9]\+\)}[[:space:]]\+xl={\([0-9]\+\)}>/<Grid size={{ xs: \1, sm: \2, md: \3, lg: \4, xl: \5 }}>/g' "$file"
        
        # Rimuovi file temporaneo
        rm -f "$file.tmp"
        
        # Conta come modificato se c'è stata una modifica
        if ! diff -q "$BACKUP_DIR/$(basename "$file")" "$file" > /dev/null 2>&1; then
            ((MODIFIED_FILES++))
            echo "✅ Modificato: $file"
        else
            echo "ℹ️  Nessuna modifica necessaria: $file"
        fi
    fi
done

echo ""
echo "📊 RISULTATI MIGRAZIONE:"
echo "   File analizzati: $TOTAL_FILES"
echo "   File modificati: $MODIFIED_FILES"
echo "   Backup salvato in: $BACKUP_DIR"
echo ""

# Verifica che non ci siano ancora sintassi legacy
REMAINING=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "Grid.*item.*xs=" 2>/dev/null | wc -l)

if [ "$REMAINING" -eq 0 ]; then
    echo "🎉 MIGRAZIONE COMPLETATA! Nessuna sintassi legacy rimanente."
else
    echo "⚠️  Attenzione: $REMAINING file potrebbero richiedere migrazione manuale"
    echo "   File da verificare:"
    find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "Grid.*item.*xs=" 2>/dev/null | head -5
fi

echo ""
echo "🔍 PROSSIMI STEP:"
echo "   1. Esegui: npm run lint"
echo "   2. Esegui: npx tsc --noEmit"
echo "   3. Testa l'applicazione: npm run dev"
echo "   4. Se tutto funziona, rimuovi backup: rm -rf $BACKUP_DIR"
echo ""
echo "🚀 Migrazione Grid v7 completata!"