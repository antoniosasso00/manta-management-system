# TODO Analysis Report - MES Aerospazio

**Data Generazione**: 2025-01-07  
**Versione Sistema**: Next.js 15.3.4  
**Analisi**: Completa del codebase per identificare TODO, FIXME, mockups e codice placeholder

---

## Executive Summary

Il sistema MES Aerospazio presenta una base solida con la maggior parte delle funzionalità core operative. Sono stati identificati **23 elementi critici** che richiedono attenzione, suddivisi in 4 livelli di priorità. I problemi più critici riguardano sicurezza (autenticazione mock) e funzionalità di supporto (email, foto profilo), mentre la logica di business principale è funzionale.

---

## 🔴 PRIORITÀ CRITICA - Blocca Funzionalità Core

### 1. Sistema Autenticazione Mock
- **File**: `src/lib/auth.ts`
- **Righe**: 23-34
- **Problema**: Funzioni placeholder per compatibilità edge runtime
- **Impatto**: Vulnerabilità di sicurezza - autenticazione potenzialmente non funzionale in produzione
- **Azione**: Implementare funzioni reali di autenticazione per edge runtime

### 2. Servizio Email Non Implementato
- **File**: `src/lib/email.ts`
- **Problemi**:
  - SendGrid: righe 107-112
  - Resend: righe 119-124
  - SMTP: righe 131-135
- **Impatto**: Reset password completamente non funzionale
- **Azione**: Implementare almeno un provider email (raccomandato: Resend)

### 3. Campo Immagine Utente Mancante
- **File**: `src/app/api/user/photo/route.ts`
- **Righe**: 65, 72, 107, 114, 149, 160-161
- **Problema**: API upload foto esiste ma campo `image` mancante nel modello User
- **Impatto**: Funzionalità foto profilo completamente non funzionale
- **Azione**: Aggiungere campo `image` al modello User in schema Prisma

### 4. Integrazione Metriche Temporali Incompleta
- **File**: `src/domains/production/services/TimeMetricsService.ts`
- **Righe**: 134-139
- **Problema**: Manca integrazione partId per statistiche temporali
- **Impatto**: Analytics di performance incompleti
- **Azione**: Implementare aggiornamento statistiche a livello Part

---

## 🟡 ALTA PRIORITÀ - Funzionalità Importanti Mancanti

### 1. Pagine Gestione Reparti
- **File**: `src/config/navigationConfig.ts`
- **Problemi**:
  - Pagine CAPO_REPARTO: righe 440-441
  - Gestione turni CAPO_TURNO: righe 444-445
- **Impatto**: Capi reparto e capi turno senza funzionalità dedicate
- **Stima Effort**: 3-5 giorni per implementazione completa

### 2. Funzionalità Import/Export
- **Files Multipli**:
  - Gestione Tools: `src/app/(dashboard)/admin/tools/page.tsx` (righe 203-210)
  - Config Parti Autoclave: `src/app/(dashboard)/admin/departments/autoclavi/part-config/page.tsx` (righe 190-196)
- **Problema**: Bottoni UI presenti ma mostrano alert "in sviluppo"
- **Impatto**: Nessuna capacità di gestione dati in bulk
- **Stima Effort**: 2-3 giorni per implementazione CSV

### 3. Interfacce Specifiche Reparti (Mockup)
- **Files**:
  - `src/app/(dashboard)/admin/departments/controllo-numerico/page.tsx`
  - `src/app/(dashboard)/admin/departments/cleanroom/page.tsx`
  - `src/app/(dashboard)/admin/departments/ndi/page.tsx`
- **Problema**: Schemi database esistono ma interfacce di gestione sono mockup
- **Impatto**: Funzionalità avanzate di ottimizzazione reparti non disponibili
- **Stima Effort**: 5-7 giorni per implementazione completa

---

## 🟠 MEDIA PRIORITÀ - Miglioramenti Sistema

### 1. Miglioramenti Servizio Workflow
- **File**: `src/domains/production/services/WorkflowService.ts`
- **Problemi**:
  - Aggiornamento metriche reparto: righe 558-559
  - Integrazione sistema notifiche: righe 447-449
- **Impatto**: Workflow core funziona ma manca tracking performance e notifiche automatiche
- **Stima Effort**: 2-3 giorni

### 2. Gestione Cleanup File
- **File**: `src/app/api/user/photo/route.ts`
- **Problemi**:
  - Cleanup file vecchi: riga 78
  - Rimozione background file: riga 119
- **Impatto**: Spazio storage crescerà indefinitamente
- **Stima Effort**: 1 giorno per job cleanup background

### 3. Limitazioni Servizio PDF Export
- **File**: `src/services/PDFExportService.ts`
- **Problemi**:
  - Fallback QR code placeholder: righe 86-88
  - Implementazione QR semplificata: righe 120-122
  - Rendering QR placeholder: righe 129-133
- **Impatto**: Codici QR potrebbero non renderizzare correttamente nei PDF
- **Stima Effort**: 1-2 giorni

---

## 🟢 BASSA PRIORITÀ - Miglioramenti UX

### 1. Dati Mock e Placeholder Sviluppo
- **Files Multipli**: Vari componenti con dati mock per sviluppo
- **Impatto**: Nessun impatto funzionale, solo convenienza sviluppo/test
- **Azione**: Sostituire gradualmente con dati reali

### 2. Testi Placeholder UI
- **Files Multipli**: Placeholder per search, form, layout temporanei
- **Impatto**: Solo miglioramenti UX minori
- **Azione**: Migliorare testi e placeholder durante iterazioni UX

---

## Piano d'Azione Raccomandato

### 🚨 **IMMEDIATO** (Questo Sprint)
1. **Fissare funzioni mock autenticazione** - Rischio sicurezza
2. **Aggiungere campo image al modello User** - Funzionalità foto rotte
3. **Implementare almeno un provider email** (Resend raccomandato)

### 📅 **BREVE TERMINE** (Prossimo Sprint)
1. **Completare pagine gestione reparti** per CAPO_REPARTO e CAPO_TURNO
2. **Implementare import/export CSV** per tools e configurazioni
3. **Fissare integrazione metriche temporali** per analytics complete

### 📈 **MEDIO TERMINE** (Sprint Successivi)
1. **Completare tutti i mockup specifici reparti**
2. **Implementare sistema notifiche** per workflow
3. **Aggiungere job cleanup file** per gestione storage

### 🔮 **LUNGO TERMINE** (Release Future)
1. **Migliorare generazione PDF** con QR code perfetti
2. **Analytics avanzati** e dashboard metriche
3. **Ottimizzazioni performance** generale

---

## Metriche Riassuntive

| Categoria | Numero Items | Giorni Stima | Priorità Business |
|-----------|--------------|--------------|-------------------|
| Critici | 4 | 3-4 | Blocca produzione |
| Alta | 6 | 10-15 | Funzionalità chiave |
| Media | 8 | 6-8 | Miglioramenti |
| Bassa | 5+ | 2-3 | Polish UX |

**Totale Debito Tecnico Stimato**: 21-30 giorni sviluppatore  
**Rischio Produzione**: MEDIO (problemi critici non bloccano business logic core)  
**Raccomandazione**: Prioritizzare immediato + breve termine per produzione stabile

---

## Note Tecniche

### Architettura Generale
- **Core business logic** funziona correttamente
- **Pattern DDD e Atomic Design** ben implementati
- **Sicurezza** necessita attenzione (auth mock)
- **Database** schema completo e ottimizzato

### Qualità Codebase
- **Struttura**: Eccellente organizzazione Domini/Servizi
- **Type Safety**: TypeScript strict + Zod validation
- **Testing**: Presenza di test e2e/integration
- **Documentazione**: CLAUDE.md completo e aggiornato

---

**Generato da**: Claude Code Analysis  
**Metodologia**: Analisi statica completa codebase + pattern recognition TODO/FIXME/mock