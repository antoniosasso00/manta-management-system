# Requisiti di Sistema - MES Aerospazio

## 1. Panoramica del Progetto

### 1.1 Descrizione
Sistema MES (Manufacturing Execution System) per il monitoraggio e la gestione del flusso produttivo di una PMI operante nel settore aerospazio e difesa, specializzata nella produzione di componenti aeronautici in materiale composito (fibra di carbonio).

### 1.2 Obiettivi Principali
- Controllo completo del flusso produttivo
- Ottimizzazione dei processi produttivi per reparto
- Rispetto delle scadenze cliente
- Tracciabilità completa degli Ordini di Lavoro (ODL)
- Interfaccia user-friendly per il rilevamento dati in produzione
- Integrazione con MES Gamma TeamSystem

### 1.3 Stakeholders
- **Dirigenti**: Visione strategica e KPI aziendali
- **Responsabili Produzione**: Pianificazione e allocazione risorse
- **Capi Reparto**: Gestione operativa quotidiana
- **Operatori**: Esecuzione attività produttive

## 2. Requisiti Funzionali

### 2.1 Gestione Utenti e Autenticazione
- **RF001**: Login con username e password
- **RF002**: Ruoli utente differenziati (Operatore, Capo Reparto, Responsabile, Dirigente, Admin)
- **RF003**: Tracciamento completo delle azioni utente (audit log)
- **RF004**: Gestione sessioni con timeout di sicurezza
- **RF005**: Possibilità futura di integrazione con Active Directory

### 2.2 Tracciamento ODL tramite QR Code
- **RF006**: Generazione automatica QR code univoci per ODL
- **RF007**: Scansione QR per registrare eventi (ingresso/uscita reparto)
- **RF008**: Registrazione automatica timestamp per ogni evento
- **RF009**: Interfaccia semplificata per operatori (solo scansione)
- **RF010**: Supporto dispositivi mobili e postazioni fisse (gate/tablet)

### 2.3 Gestione Reparto Laminazione (Clean Room)
- **RF011**: Tracciamento ingresso/uscita operatori e ODL
- **RF012**: Monitoraggio tempi reali di laminazione
- **RF013**: Allocazione risorse basata su carico di lavoro
- **RF014**: Gestione turni (6-14, 14-22)
- **RF015**: Dashboard real-time stato laminazioni

### 2.4 Gestione Cicli di Cura (Autoclavi)
- **RF016**: Sistema di ottimizzazione batch multi-ODL
- **RF017**: Algoritmo di nesting 2D per posizionamento attrezzi
- **RF018**: Considerazione vincoli (cicli compatibili, linee vuoto, dimensioni)
- **RF019**: Visualizzazione grafica posizionamento su piano autoclave
- **RF020**: Registrazione manuale/QR inizio e fine ciclo
- **RF021**: Gestione 3 autoclavi con diverse capacità

### 2.5 Allocazione Risorse e Scheduling
- **RF022**: Assegnazione automatica ODL a operatori
- **RF023**: Bilanciamento carico di lavoro per turno
- **RF024**: Visualizzazione planning settimanale/mensile
- **RF025**: Gestione priorità e urgenze
- **RF026**: Ricalcolo dinamico in base a ritardi/anticipi

### 2.6 Integrazione MES Gamma
- **RF027**: Import automatico file export da percorso predefinito
- **RF028**: Sincronizzazione ODL, Part Number, Descrizioni
- **RF029**: Scheduling sincronizzazione configurabile
- **RF030**: Log errori e report sincronizzazione
- **RF031**: Mappatura dati Gamma → sistema interno

### 2.7 Reporting e Dashboard
- **RF032**: Report tempi produzione per Part Number
- **RF033**: Report scostamenti tempi commerciali vs effettivi
- **RF034**: Report efficienza batch autoclavi
- **RF035**: Statistiche per risorsa e reparto
- **RF036**: Analisi storiche (settimanale, mensile, trimestrale, annuale)
- **RF037**: Export report in PDF/Excel

### 2.8 Notifiche e Alert
- **RF038**: Alert per scostamenti tempi significativi
- **RF039**: Notifiche in-app real-time
- **RF040**: Integrazione Telegram per notifiche urgenti
- **RF041**: Configurazione soglie alert per ruolo
- **RF042**: Dashboard alert e anomalie

## 3. Requisiti Non Funzionali

### 3.1 Performance
- **RNF001**: Tempo risposta scansione QR < 1 secondo
- **RNF002**: Caricamento dashboard < 3 secondi
- **RNF003**: Supporto 5-6 utenti simultanei (MVP)
- **RNF004**: Scalabilità a 50+ utenti futuri
- **RNF005**: Ottimizzazione batch autoclavi < 30 secondi

### 3.2 Usabilità
- **RNF006**: Interfaccia solo in italiano
- **RNF007**: UI minimale e moderna (Material-UI)
- **RNF008**: Zero competenze informatiche per operatori
- **RNF009**: Responsive design per tablet/mobile
- **RNF010**: Feedback visivo immediato per ogni azione

### 3.3 Sicurezza
- **RNF011**: Accesso solo da rete aziendale/VPN
- **RNF012**: HTTPS per tutte le comunicazioni
- **RNF013**: Backup automatici giornalieri
- **RNF014**: Crittografia password database
- **RNF015**: Protezione dati sensibili produzione

### 3.4 Affidabilità
- **RNF016**: Disponibilità 99% durante orario produttivo
- **RNF017**: Recovery da errori senza perdita dati
- **RNF018**: Sincronizzazione Gamma resiliente a errori
- **RNF019**: Funzionamento offline gate con sincronizzazione differita

### 3.5 Manutenibilità
- **RNF020**: Architettura modulare per futuri reparti
- **RNF021**: API RESTful documentate
- **RNF022**: Logging dettagliato per troubleshooting
- **RNF023**: Configurazioni esternalizzate

## 4. Reparti e Flusso Produttivo

### 4.1 Sequenza Principale
1. Clean Room (Laminazione) - **MVP**
2. Ciclo di Cura (Autoclavi) - **MVP**
3. Rifilatura CN
4. Rifilatura Manuale
5. NDI (Controllo Non Distruttivo)
6. Verniciatura ed Essiccazione
7. Montaggio

### 4.2 Reparti Paralleli/Opzionali
- Taglio
- Fresatura Foam
- HC (Honeycomb)
- Foratura
- Insertaggio
- Incollaggio
- Sigillatura

## 5. Vincoli di Sistema

### 5.1 Vincoli Tecnologici
- Frontend: Next.js 15+ con TypeScript
- UI Framework: Material-UI (MUI)
- Database: PostgreSQL
- Hosting: Server aziendale on-premise
- Integrazione: File-based con MES Gamma

### 5.2 Vincoli Temporali
- MVP operativo: 2 mesi
- Sistema completo: 6 mesi
- Go-live produzione: entro 12 mesi

### 5.3 Vincoli Organizzativi
- Formazione minima operatori
- Compatibilità processi esistenti
- Non interferenza con Gamma
- Accesso remoto solo via VPN

## 6. Assunzioni e Rischi

### 6.1 Assunzioni
- Disponibilità export Gamma regolari
- Collaborazione operatori per adozione
- Infrastruttura server adeguata
- Dispositivi tablet/mobile disponibili

### 6.2 Rischi
- Resistenza al cambiamento operatori
- Complessità algoritmo ottimizzazione autoclavi
- Latenza rete per postazioni remote
- Accuratezza dati tempi iniziali

## 7. Fasi di Implementazione

### 7.1 MVP (2 mesi)
- Sistema autenticazione base
- Generazione e gestione QR code
- Tracciamento Clean Room completo
- Ottimizzazione batch autoclavi
- Allocazione ODL base
- Sincronizzazione Gamma (read-only)
- Report essenziali

### 7.2 Fase 2 (4 mesi)
- Altri reparti produttivi
- Dashboard avanzate
- Sistema notifiche completo
- Ottimizzazioni performance
- Mobile app dedicata

### 7.3 Fase 3 (6 mesi)
- Integrazione completa workflow
- Analytics predittive
- Integrazione ERP completa
- Gestione scarti (Quarta)
- Multi-plant support