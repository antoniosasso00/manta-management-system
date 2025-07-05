# TODO: Post-Cleanup Issues

## Repository Cleanup Summary (2025-07-05)

La struttura della repository è stata riorganizzata secondo le best practice:

### ✅ Completato
- Creata struttura `__tests__/` per tutti i test
- Spostati script in `scripts/` con sottocartelle organizzate
- Consolidate configurazioni Next.js (mantenuto solo `next.config.ts`)
- Spostata documentazione in `docs/` mantenendo solo essenziali in root
- Rimossi file di log e aggiunti pattern a `.gitignore`
- Rimosse cartelle vuote da `src/app/`

### ⚠️ Issues da Risolvere

#### TypeScript Errors (29)
1. **Grid v7 Migration**: Molti componenti usano ancora sintassi deprecata `<Grid item>` invece di `<Grid size>`
2. **Service Layer**: Errori di tipo nei service layer, principalmente:
   - `PDFExportService.ts`: proprietà mancanti e tipi undefined
   - Repository schemas Zod con tipi incompatibili
3. **Touch Target Audit**: Tipi string/number mismatch

#### ESLint Warnings (85)
1. **Unused imports**: Molte importazioni non utilizzate
2. **Missing dependencies**: useEffect hooks con dipendenze mancanti
3. **Unescaped entities**: Apostrofi e virgolette non escaped in JSX
4. **TypeScript any**: Uso eccessivo di `any` type

### 📋 Azioni Consigliate

1. **Fix immediati** (blocking):
   ```bash
   # Migrazione Grid v7
   find src -name "*.tsx" -exec grep -l "Grid item" {} \; | xargs sed -i 's/<Grid item/<Grid size/g'
   
   # Fix TypeScript errors
   npm run type-check
   ```

2. **Fix graduali** (non-blocking):
   - Rimuovere importazioni non utilizzate
   - Aggiungere dipendenze mancanti a useEffect
   - Sostituire `any` con tipi appropriati

3. **Pre-commit check**:
   ```bash
   npm run lint && npm run type-check
   ```

### 📁 Nuova Struttura Directory

```
manta-management-system/
├── __tests__/
│   ├── api/
│   ├── integration/
│   ├── fixtures/
│   └── e2e/
├── scripts/
│   ├── dev/
│   ├── deploy/
│   └── maintenance/
├── docs/
│   ├── setup/
│   ├── api/
│   └── development/
├── src/
├── prisma/
└── [files in root]
```