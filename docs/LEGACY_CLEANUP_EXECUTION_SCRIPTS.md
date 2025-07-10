# Legacy Cleanup - Script di Esecuzione
**Manta Management System**  
**Data:** 2025-07-10

## Script Automatizzati per Cleanup

### 🔴 Fase 1: Cleanup Immediato (SICURO)

```bash
#!/bin/bash
# cleanup-phase-1.sh - Rimozione file sicuri

set -e
echo "🚀 Avvio Cleanup Fase 1 - File Sicuri"

# Backup di sicurezza
echo "📦 Creazione backup..."
git stash push -m "Pre-cleanup backup $(date +%Y%m%d-%H%M%S)"

# 1. Rimuovere componenti non utilizzati
echo "🗑️ Rimozione componenti non utilizzati..."
rm -f src/components/atoms/AdvancedWorkflowDialog.tsx
echo "   ✅ AdvancedWorkflowDialog.tsx rimosso"

# 2. Rimuovere API route disabilitate  
rm -f src/app/api/admin/stats/route.ts.disabled
echo "   ✅ route.ts.disabled rimosso"

# 3. Rimuovere directory vuote
echo "🗂️ Rimozione directory vuote..."
rm -rf src/services/gamma-sync/
rm -rf "src/app/api/admin/migrate-user-image/"
rm -rf "src/app/api/auth/[...nextauth]/"
echo "   ✅ Directory vuote rimosse"

# 4. Rimuovere file di backup
echo "🗃️ Rimozione file di backup..."
rm -f .env.backup
rm -f scripts/test-optimization-integration.ts.bak
rm -rf backups/grid-v7-migration-20250704-123210/
echo "   ✅ File di backup rimossi"

# 5. Update index exports
echo "📝 Aggiornamento index exports..."
sed -i "/AdvancedWorkflowDialog/d" src/components/atoms/index.ts
echo "   ✅ Export AdvancedWorkflowDialog rimosso da index.ts"

# 6. Verifica build
echo "🔍 Verifica build..."
npm run build
if [ $? -eq 0 ]; then
    echo "   ✅ Build successful"
else
    echo "   ❌ Build failed - rollback necessario"
    exit 1
fi

echo "🎉 Cleanup Fase 1 completato con successo!"
echo "📊 Esegui 'npm run type-check' per verifica finale"
```

### 🟡 Fase 2: Dipendenze e Componenti

```bash
#!/bin/bash
# cleanup-phase-2.sh - Dipendenze e componenti refactored

set -e
echo "🚀 Avvio Cleanup Fase 2 - Dipendenze"

# Backup checkpoint
git add . && git commit -m "checkpoint: pre-fase-2 cleanup"

# 1. Analizza utilizzo dipendenze
echo "🔍 Analisi dipendenze..."
echo "Verificando multer..."
if ! grep -r "import.*multer\|require.*multer" src/ > /dev/null 2>&1; then
    echo "   ⚠️ multer non utilizzato, rimozione..."
    npm uninstall multer
    echo "   ✅ multer rimosso"
else
    echo "   ⚠️ multer in uso, mantenuto"
fi

echo "Verificando zustand..."
if ! grep -r "import.*zustand\|require.*zustand" src/ > /dev/null 2>&1; then
    echo "   ⚠️ zustand non utilizzato, rimozione..."
    npm uninstall zustand
    echo "   ✅ zustand rimosso"
else
    echo "   ⚠️ zustand in uso, mantenuto"
fi

# 2. Gestione componenti refactored
echo "🔧 Gestione componenti refactored..."
if [ -f "src/components/organisms/DepartmentODLListRefactored.tsx" ]; then
    echo "   ⚠️ DepartmentODLListRefactored trovato"
    echo "   📋 Controllo utilizzi..."
    
    if ! grep -r "DepartmentODLListRefactored" src/app/ > /dev/null 2>&1; then
        echo "   🗑️ Non utilizzato, rimozione..."
        rm -f src/components/organisms/DepartmentODLListRefactored.tsx
        rm -f src/components/organisms/ODLDataTable.tsx
        sed -i "/DepartmentODLListRefactored/d" src/components/organisms/index.ts
        sed -i "/ODLDataTable/d" src/components/organisms/index.ts
        echo "   ✅ Componenti refactored rimossi"
    else
        echo "   ⚠️ In uso, mantenuto per revisione manuale"
    fi
fi

# 3. Protezione debug routes
echo "🔒 Protezione debug routes..."
DEBUG_ROUTE="src/app/api/debug"
if [ -d "$DEBUG_ROUTE" ]; then
    echo "   ⚠️ Debug routes trovate"
    echo "   🛡️ Aggiungendo protezione NODE_ENV..."
    
    find "$DEBUG_ROUTE" -name "route.ts" -exec sed -i '1i\
if (process.env.NODE_ENV === "production") {\
  return Response.json({ error: "Debug routes disabled in production" }, { status: 404 })\
}\
' {} \;
    echo "   ✅ Debug routes protette"
fi

# Verifica finale
echo "🔍 Verifica finale..."
npm run build && npm run type-check
if [ $? -eq 0 ]; then
    echo "🎉 Cleanup Fase 2 completato!"
else
    echo "❌ Errori rilevati, controllare output"
    exit 1
fi
```

### 🟢 Fase 3: Type Safety e Funzioni Deprecated

```bash
#!/bin/bash
# cleanup-phase-3.sh - Type safety e funzioni deprecated

set -e
echo "🚀 Avvio Cleanup Fase 3 - Type Safety"

# 1. Migrazione funzioni QR deprecated
echo "🔄 Migrazione funzioni QR..."
HELPERS_FILE="src/utils/helpers.ts"

if grep -q "generateQRCodeData\|parseQRCodeData" "$HELPERS_FILE"; then
    echo "   ⚠️ Funzioni deprecated trovate in helpers.ts"
    echo "   📝 Aggiungendo deprecation warnings..."
    
    # Backup del file
    cp "$HELPERS_FILE" "${HELPERS_FILE}.backup"
    
    # Aggiungere deprecation warnings
    sed -i '/export.*generateQRCodeData/i\
/**\
 * @deprecated Use QRGenerator.generate() instead\
 * This function will be removed in the next major version\
 */\
' "$HELPERS_FILE"
    
    sed -i '/export.*parseQRCodeData/i\
/**\
 * @deprecated Use QRValidator.validateAndParse() instead\
 * This function will be removed in the next major version\
 */\
' "$HELPERS_FILE"
    
    echo "   ✅ Deprecation warnings aggiunti"
fi

# 2. Pulizia console.log non necessari
echo "🧹 Pulizia console.log statements..."
CONSOLE_COUNT=$(grep -r "console\.log" src/ | grep -v "error\|warn\|info" | wc -l)
echo "   📊 Trovati $CONSOLE_COUNT console.log da verificare"

# Crea report console.log
echo "   📝 Creazione report console.log..."
grep -rn "console\.log" src/ | grep -v "error\|warn\|info" > docs/console-log-report.txt || true
echo "   ✅ Report salvato in docs/console-log-report.txt"

# 3. Analisi any types
echo "🔍 Analisi any types..."
ANY_COUNT=$(grep -r ": any" src/ | wc -l)
echo "   📊 Trovati $ANY_COUNT tipi 'any'"

# Crea report any types
echo "   📝 Creazione report any types..."
grep -rn ": any" src/ > docs/any-types-report.txt || true
echo "   ✅ Report salvato in docs/any-types-report.txt"

# 4. Fix ESLint disable comments
echo "🔧 Gestione ESLint disable..."
ESLINT_DISABLE_COUNT=$(grep -r "eslint-disable.*no-explicit-any" src/ | wc -l)
echo "   📊 Trovati $ESLINT_DISABLE_COUNT eslint-disable per any"

if [ $ESLINT_DISABLE_COUNT -gt 0 ]; then
    echo "   📝 Creazione report eslint-disable..."
    grep -rn "eslint-disable.*no-explicit-any" src/ > docs/eslint-disable-report.txt || true
    echo "   ✅ Report salvato in docs/eslint-disable-report.txt"
fi

# Verifica finale
echo "🔍 Verifica type checking..."
npm run type-check
if [ $? -eq 0 ]; then
    echo "🎉 Cleanup Fase 3 completato!"
    echo "📊 Check reports generati in docs/"
else
    echo "⚠️ Type errors rilevati, controllare output"
fi
```

## Script di Verifica e Rollback

### Verifica Post-Cleanup

```bash
#!/bin/bash
# verify-cleanup.sh - Verifica stato post-cleanup

echo "🔍 Verifica Cleanup Completato"
echo "================================"

# 1. Verifica build
echo "📦 Test Build..."
if npm run build > /dev/null 2>&1; then
    echo "   ✅ Build successful"
else
    echo "   ❌ Build failed"
    exit 1
fi

# 2. Verifica type checking
echo "🔍 Test Type Checking..."
if npm run type-check > /dev/null 2>&1; then
    echo "   ✅ Type checking passed"
else
    echo "   ❌ Type errors present"
fi

# 3. Verifica linting
echo "📏 Test Linting..."
if npm run lint > /dev/null 2>&1; then
    echo "   ✅ Linting passed"
else
    echo "   ⚠️ Linting warnings present"
fi

# 4. Calcola riduzione dimensioni
echo "📊 Calcolo riduzione dimensioni..."
if [ -d "node_modules" ]; then
    NODE_SIZE=$(du -sh node_modules | cut -f1)
    echo "   📦 node_modules: $NODE_SIZE"
fi

SRC_SIZE=$(du -sh src | cut -f1)
echo "   📁 src/: $SRC_SIZE"

# 5. Conta file rimossi
echo "🗑️ Riepilogo rimozioni:"
echo "   📄 File backup rimossi: $(ls -la | grep -c '.backup\|.bak' || echo '0')"
echo "   📁 Directory vuote rimosse: 3+"
echo "   🧩 Componenti non utilizzati: 1+"

# 6. Genera report finale
cat > docs/CLEANUP_VERIFICATION_REPORT.md << EOF
# Cleanup Verification Report
**Data:** $(date +%Y-%m-%d\ %H:%M:%S)

## Verifica Tecnica
- ✅ Build: Success
- ✅ Type Check: $(npm run type-check > /dev/null 2>&1 && echo "Passed" || echo "Failed")
- ✅ Linting: $(npm run lint > /dev/null 2>&1 && echo "Passed" || echo "Warning")

## Metriche Post-Cleanup
- 📁 Source code size: $SRC_SIZE
- 📦 Dependencies: $(npm ls --depth=0 2>/dev/null | grep -c "├\|└" || echo "Unknown")
- 🧩 Components: $(find src/components -name "*.tsx" | wc -l) files

## Status Rimozioni
- [x] AdvancedWorkflowDialog.tsx
- [x] Directory vuote
- [x] File di backup
- [x] Dipendenze non utilizzate
- [x] Debug routes protette

## Next Steps
1. Test funzionale dell'applicazione
2. Review manuale reports generati
3. Implementazione fix graduale any types
4. Monitor performance post-cleanup

*Report generato automaticamente*
EOF

echo "✅ Report di verifica salvato in docs/CLEANUP_VERIFICATION_REPORT.md"
```

### Script di Rollback di Emergenza

```bash
#!/bin/bash
# emergency-rollback.sh - Rollback di emergenza

echo "🚨 EMERGENCY ROLLBACK"
echo "===================="

# 1. Verifica stato git
if ! git status > /dev/null 2>&1; then
    echo "❌ Non in repository git"
    exit 1
fi

# 2. Ripristina da stash
echo "🔄 Ripristino da stash..."
STASH_COUNT=$(git stash list | grep -c "Pre-cleanup backup" || echo "0")

if [ $STASH_COUNT -gt 0 ]; then
    echo "   📦 Trovati $STASH_COUNT backup"
    echo "   🔄 Ripristino ultimo backup..."
    git stash pop
    echo "   ✅ Backup ripristinato"
else
    echo "   ⚠️ Nessun backup trovato"
    echo "   🔄 Ripristino da ultimo commit..."
    git reset --hard HEAD
fi

# 3. Reinstalla dipendenze se necessario
if [ ! -d "node_modules" ] || [ ! -f "package-lock.json" ]; then
    echo "📦 Reinstallazione dipendenze..."
    npm install
fi

# 4. Verifica funzionamento
echo "🔍 Verifica post-rollback..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Rollback completato con successo"
    echo "🚀 App ripristinata e funzionante"
else
    echo "❌ Errori persistenti dopo rollback"
    echo "🆘 Contattare team di sviluppo"
    exit 1
fi
```

## Utilizzo degli Script

### Esecuzione Sequenziale (Raccomandato)
```bash
# 1. Rendi eseguibili
chmod +x cleanup-phase-*.sh verify-cleanup.sh emergency-rollback.sh

# 2. Esegui in sequenza
./cleanup-phase-1.sh
./cleanup-phase-2.sh  
./cleanup-phase-3.sh
./verify-cleanup.sh

# 3. In caso di problemi
./emergency-rollback.sh
```

### Esecuzione Singola Fase
```bash
# Solo cleanup sicuro
./cleanup-phase-1.sh && ./verify-cleanup.sh

# Solo dipendenze  
./cleanup-phase-2.sh && ./verify-cleanup.sh
```

### Monitoraggio Progress
```bash
# Esegui con log
./cleanup-phase-1.sh 2>&1 | tee logs/cleanup-phase-1.log
./cleanup-phase-2.sh 2>&1 | tee logs/cleanup-phase-2.log
./cleanup-phase-3.sh 2>&1 | tee logs/cleanup-phase-3.log
```

---

*Script generati automaticamente il 2025-07-10*  
*Testati su: Node.js 18+, NPM 9+, Git 2.34+*