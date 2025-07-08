# Database Schema - MES Aerospazio

Questo documento descrive tutte le tabelle e i campi presenti nel database del sistema MES Aerospazio.

## Tabelle Principali

### 1. users
**Descrizione**: Utenti del sistema con ruoli e permessi

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco (CUID) |
| `email` | String | Email utente (unica) |
| `name` | String? | Nome completo |
| `password` | String | Password hash |
| `role` | UserRole | Ruolo globale (ADMIN, SUPERVISOR, OPERATOR) |
| `isActive` | Boolean | Account attivo |
| `image` | String? | URL foto profilo |
| `createdAt` | DateTime | Data creazione |
| `updatedAt` | DateTime | Ultimo aggiornamento |
| `departmentId` | String? | Dipartimento di appartenenza |
| `departmentRole` | DepartmentRole? | Ruolo nel dipartimento |

### 2. password_reset_tokens
**Descrizione**: Token per reset password

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `token` | String | Token di reset (unico) |
| `userId` | String | Riferimento utente |
| `expiresAt` | DateTime | Scadenza token |
| `createdAt` | DateTime | Data creazione |
| `used` | Boolean | Token utilizzato |

### 3. accounts
**Descrizione**: Account esterni OAuth (NextAuth)

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `userId` | String | Riferimento utente |
| `type` | String | Tipo account |
| `provider` | String | Provider OAuth |
| `providerAccountId` | String | ID account provider |
| `refresh_token` | String? | Token refresh |
| `access_token` | String? | Token accesso |
| `expires_at` | Int? | Scadenza token |
| `token_type` | String? | Tipo token |
| `scope` | String? | Scope permessi |
| `id_token` | String? | ID token |
| `session_state` | String? | Stato sessione |

### 4. sessions
**Descrizione**: Sessioni utente attive

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `sessionToken` | String | Token sessione (unico) |
| `userId` | String | Riferimento utente |
| `expires` | DateTime | Scadenza sessione |

## Tabelle Business Core

### 5. parts
**Descrizione**: Anagrafica parti/componenti aerospaziali

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `partNumber` | String | Codice parte (unico) |
| `description` | String | Descrizione |
| `createdAt` | DateTime | Data creazione |
| `updatedAt` | DateTime | Ultimo aggiornamento |
| `gammaId` | String? | ID sistema Gamma |
| `lastSyncAt` | DateTime? | Ultima sincronizzazione |
| `syncStatus` | SyncStatus | Stato sync (SUCCESS, PARTIAL, FAILED) |
| `defaultCuringCycleId` | String? | Ciclo cottura predefinito |
| `defaultVacuumLines` | Int? | Linee vuoto predefinite |

### 6. odls
**Descrizione**: Ordini Di Lavorazione (Work Orders)

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `odlNumber` | String | Numero ODL (unico) |
| `partId` | String | Riferimento parte |
| `quantity` | Int | Quantità |
| `priority` | Priority | Priorità (LOW, NORMAL, HIGH, URGENT) |
| `status` | ODLStatus | Stato lavorazione |
| `qrCode` | String | Codice QR (unico) |
| `expectedCompletionDate` | DateTime? | Data completamento prevista |
| `createdAt` | DateTime | Data creazione |
| `updatedAt` | DateTime | Ultimo aggiornamento |
| `gammaId` | String? | ID sistema Gamma |
| `lastSyncAt` | DateTime? | Ultima sincronizzazione |
| `syncStatus` | SyncStatus | Stato sincronizzazione |

### 7. production_events
**Descrizione**: Eventi di produzione (entrata/uscita da reparti)

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `odlId` | String | Riferimento ODL |
| `departmentId` | String | Riferimento reparto |
| `eventType` | EventType | Tipo evento (ENTRY, EXIT, PAUSE, RESUME, NOTE) |
| `timestamp` | DateTime | Timestamp evento |
| `userId` | String | Utente che ha registrato l'evento |
| `notes` | String? | Note aggiuntive |
| `duration` | Int? | Durata in minuti |
| `isAutomatic` | Boolean | Evento automatico |

### 8. departments
**Descrizione**: Reparti produttivi

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `code` | String | Codice reparto (unico) |
| `name` | String | Nome reparto |
| `type` | DepartmentType | Tipo reparto |
| `isActive` | Boolean | Reparto attivo |

## Tabelle Autoclavi

### 9. autoclaves
**Descrizione**: Autoclavi per cottura compositi

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `code` | String | Codice autoclave (unico) |
| `name` | String | Nome autoclave |
| `departmentId` | String | Riferimento reparto |
| `maxLength` | Float | Lunghezza massima |
| `maxWidth` | Float | Larghezza massima |
| `maxHeight` | Float | Altezza massima |
| `vacuumLines` | Int | Numero linee vuoto |
| `isActive` | Boolean | Autoclave attiva |

### 10. autoclave_loads
**Descrizione**: Carichi di cottura autoclave

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `loadNumber` | String | Numero carico (unico) |
| `autoclaveId` | String | Riferimento autoclave |
| `curingCycleId` | String | Riferimento ciclo cottura |
| `plannedStart` | DateTime | Inizio pianificato |
| `actualStart` | DateTime? | Inizio effettivo |
| `plannedEnd` | DateTime | Fine pianificata |
| `actualEnd` | DateTime? | Fine effettiva |
| `status` | LoadStatus | Stato carico |
| `layoutData` | Json? | Dati layout carico |
| `createdAt` | DateTime | Data creazione |
| `updatedAt` | DateTime | Ultimo aggiornamento |

### 11. autoclave_load_items
**Descrizione**: ODL inclusi nei carichi autoclave

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `odlId` | String | Riferimento ODL |
| `autoclaveLoadId` | String | Riferimento carico |
| `position` | Json? | Posizione nel carico |
| `addedAt` | DateTime | Data aggiunta |
| `previousStatus` | ODLStatus? | Stato precedente ODL |

### 12. curing_cycles
**Descrizione**: Cicli di cottura predefiniti

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `code` | String | Codice ciclo (unico) |
| `name` | String | Nome ciclo |
| `description` | String? | Descrizione |
| `phase1Temperature` | Float | Temperatura fase 1 |
| `phase1Pressure` | Float | Pressione fase 1 |
| `phase1Duration` | Int | Durata fase 1 |
| `phase2Temperature` | Float? | Temperatura fase 2 |
| `phase2Pressure` | Float? | Pressione fase 2 |
| `phase2Duration` | Int? | Durata fase 2 |
| `isActive` | Boolean | Ciclo attivo |
| `createdAt` | DateTime | Data creazione |
| `updatedAt` | DateTime | Ultimo aggiornamento |

## Tabelle Strumenti e Utensili

### 13. tools
**Descrizione**: Utensili e stampi

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `toolPartNumber` | String | Codice utensile (unico) |
| `description` | String? | Descrizione |
| `base` | Float | Dimensione base |
| `height` | Float | Altezza |
| `weight` | Float? | Peso |
| `material` | String? | Materiale |
| `valveCount` | Int | Numero valvole |
| `isActive` | Boolean | Utensile attivo |
| `createdAt` | DateTime | Data creazione |
| `updatedAt` | DateTime | Ultimo aggiornamento |

### 14. part_tools
**Descrizione**: Associazione parti-utensili

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `partId` | String | Riferimento parte |
| `toolId` | String | Riferimento utensile |

## Tabelle Qualità

### 15. quality_control_plans
**Descrizione**: Piani di controllo qualità

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `partId` | String | Riferimento parte |
| `version` | String | Versione piano |
| `title` | String | Titolo |
| `description` | String? | Descrizione |
| `isActive` | Boolean | Piano attivo |
| `createdAt` | DateTime | Data creazione |
| `updatedAt` | DateTime | Ultimo aggiornamento |
| `createdBy` | String | Creatore |
| `inspectionType` | QCInspectionType | Tipo ispezione |
| `frequency` | QCFrequency | Frequenza controllo |
| `sampleSize` | Int | Dimensione campione |
| `acceptanceCriteria` | Json | Criteri accettazione |

### 16. quality_inspections
**Descrizione**: Ispezioni qualità eseguite

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `planId` | String | Riferimento piano |
| `odlId` | String | Riferimento ODL |
| `inspectorId` | String | Ispettore |
| `status` | QCStatus | Stato ispezione |
| `startedAt` | DateTime? | Inizio ispezione |
| `completedAt` | DateTime? | Fine ispezione |
| `result` | QCResult? | Risultato |
| `measurements` | Json? | Misurazioni |
| `notes` | String? | Note |
| `attachments` | String[] | Allegati |
| `certificateNumber` | String? | Numero certificato |
| `signedBy` | String? | Firmato da |
| `signedAt` | DateTime? | Data firma |

### 17. non_conformities
**Descrizione**: Non conformità rilevate

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `inspectionId` | String? | Riferimento ispezione |
| `odlId` | String | Riferimento ODL |
| `reportedBy` | String | Segnalato da |
| `type` | NCType | Tipo non conformità |
| `severity` | NCSeverity | Severità |
| `category` | NCCategory | Categoria |
| `title` | String | Titolo |
| `description` | String | Descrizione |
| `rootCause` | String? | Causa radice |
| `status` | NCStatus | Stato |
| `detectedAt` | DateTime | Data rilevamento |
| `assignedTo` | String? | Assegnato a |
| `dueDate` | DateTime? | Scadenza |

### 18. corrective_actions
**Descrizione**: Azioni correttive/preventive (CAPA)

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `nonConformityId` | String | Riferimento NC |
| `type` | CAPAType | Tipo azione |
| `title` | String | Titolo |
| `description` | String | Descrizione |
| `plannedAction` | String | Azione pianificata |
| `dueDate` | DateTime | Scadenza |
| `assignedTo` | String | Assegnato a |
| `status` | CAPAStatus | Stato |
| `actualAction` | String? | Azione effettiva |
| `completedAt` | DateTime? | Data completamento |
| `verifiedBy` | String? | Verificato da |
| `verifiedAt` | DateTime? | Data verifica |
| `effectiveness` | String? | Efficacia |
| `followUpDate` | DateTime? | Data follow-up |

### 19. quality_certificates
**Descrizione**: Certificati di qualità

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `odlId` | String | Riferimento ODL |
| `certificateNumber` | String | Numero certificato (unico) |
| `title` | String | Titolo |
| `description` | String? | Descrizione |
| `conformityStatus` | Boolean | Stato conformità |
| `standardsRef` | String[] | Riferimenti standard |
| `issuedBy` | String | Emesso da |
| `approvedBy` | String? | Approvato da |
| `issuedAt` | DateTime | Data emissione |
| `approvedAt` | DateTime? | Data approvazione |
| `documentPath` | String? | Percorso documento |

## Configurazioni Reparti

### 20. part_honeycomb
**Descrizione**: Configurazioni parti per reparto Honeycomb

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `partId` | String | Riferimento parte (unico) |
| `coreType` | HoneycombType | Tipo nido d'ape |
| `cellSize` | Float | Dimensione celle |
| `coreDensity` | Float | Densità core |
| `coreThickness` | Float | Spessore core |
| `skinMaterial` | String? | Materiale skin |
| `skinThickness` | Float? | Spessore skin |
| `adhesiveType` | String | Tipo adesivo |
| `cureTemperature` | Float | Temperatura cottura |
| `cureTime` | Int | Tempo cottura |
| `pressure` | Float | Pressione |
| `bondStrength` | Float? | Resistenza bond |
| `compressionStrength` | Float? | Resistenza compressione |
| `setupTimeMinutes` | Int? | Tempo setup |
| `cycleTimeMinutes` | Int? | Tempo ciclo |
| `skillLevel` | SkillLevel | Livello competenza |

### 21. part_controllo_numerico
**Descrizione**: Configurazioni parti per CNC

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `partId` | String | Riferimento parte (unico) |
| `materialType` | CNCMaterialType | Tipo materiale |
| `toolingRequired` | String[] | Utensili richiesti |
| `programmingTime` | Int? | Tempo programmazione |
| `setupTime` | Int? | Tempo setup |
| `cycleTime` | Int? | Tempo ciclo |
| `toleranceClass` | ToleranceClass | Classe tolleranza |
| `surfaceFinish` | String? | Finitura superficie |
| `compatibleMachines` | String[] | Macchine compatibili |
| `priority` | Int | Priorità |
| `dimensionalChecks` | Json | Controlli dimensionali |
| `requiredInspection` | String? | Ispezione richiesta |

### 22. part_montaggio
**Descrizione**: Configurazioni parti per Montaggio

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `partId` | String | Riferimento parte (unico) |
| `assemblyType` | AssemblyType | Tipo assemblaggio |
| `componentCount` | Int | Numero componenti |
| `assemblyTime` | Int? | Tempo assemblaggio |
| `testingTime` | Int? | Tempo test |
| `requiredParts` | Json | Parti richieste |
| `requiredTools` | String[] | Utensili richiesti |
| `requiredFixtures` | String[] | Attrezzature richieste |
| `assemblySequence` | Json | Sequenza assemblaggio |
| `testProcedure` | String? | Procedura test |
| `qualityChecks` | String[] | Controlli qualità |

### 23. part_verniciatura
**Descrizione**: Configurazioni parti per Verniciatura

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `partId` | String | Riferimento parte (unico) |
| `coatingType` | CoatingType | Tipo rivestimento |
| `primerRequired` | Boolean | Primer richiesto |
| `coatLayers` | Int | Strati rivestimento |
| `surfacePrep` | SurfacePrepType | Preparazione superficie |
| `cleaningRequired` | Boolean | Pulizia richiesta |
| `maskingRequired` | Boolean | Mascheratura richiesta |
| `sprayPattern` | String? | Pattern spray |
| `cureTemperature` | Float? | Temperatura cottura |
| `cureTime` | Int? | Tempo cottura |
| `dryTime` | Int | Tempo asciugatura |
| `thicknessCheck` | Boolean | Controllo spessore |
| `adhesionTest` | Boolean | Test adesione |
| `colorMatch` | String? | Confronto colore |

### 24. part_autoclave
**Descrizione**: Configurazioni parti per Autoclave

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `partId` | String | Riferimento parte (unico) |
| `curingCycleId` | String | Riferimento ciclo cottura |
| `vacuumLines` | Int | Linee vuoto |
| `setupTime` | Int? | Tempo setup |
| `loadPosition` | String? | Posizione preferita |
| `notes` | String? | Note specifiche |
| `createdAt` | DateTime | Data creazione |
| `updatedAt` | DateTime | Ultimo aggiornamento |

### 25. part_cleanroom
**Descrizione**: Configurazioni parti per Clean Room

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `partId` | String | Riferimento parte (unico) |
| `layupSequence` | Json? | Sequenza strati |
| `fiberOrientation` | String[] | Orientamenti fibre |
| `resinType` | String? | Tipo resina |
| `prepregCode` | String? | Codice prepreg |
| `roomTemperature` | Float? | Temperatura stanza |
| `humidity` | Float? | Umidità richiesta |
| `shelfLife` | Int? | Vita utile materiale |
| `setupTime` | Int? | Tempo setup |
| `cycleTime` | Int? | Tempo ciclo |
| `createdAt` | DateTime | Data creazione |
| `updatedAt` | DateTime | Ultimo aggiornamento |

### 26. part_ndi
**Descrizione**: Configurazioni parti per NDI (Controlli Non Distruttivi)

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `partId` | String | Riferimento parte (unico) |
| `inspectionMethod` | String[] | Metodi ispezione |
| `acceptanceCriteria` | Json? | Criteri accettazione |
| `criticalAreas` | Json? | Aree critiche |
| `inspectionTime` | Int? | Tempo ispezione |
| `requiredCerts` | String[] | Certificazioni richieste |
| `calibrationReq` | String? | Requisiti calibrazione |
| `createdAt` | DateTime | Data creazione |
| `updatedAt` | DateTime | Ultimo aggiornamento |

### 27. part_motori
**Descrizione**: Configurazioni parti per Motori

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `partId` | String | Riferimento parte (unico) |
| `engineType` | EngineType | Tipo motore |
| `powerRating` | Float? | Potenza nominale |
| `rpmRange` | String? | Range RPM |
| `fuelType` | FuelType? | Tipo carburante |
| `assemblyTime` | Int? | Tempo assemblaggio |
| `testingTime` | Int? | Tempo test |
| `burnInTime` | Int? | Tempo rodaggio |
| `compressionTest` | Boolean | Test compressione |
| `leakTest` | Boolean | Test perdite |
| `performanceTest` | Boolean | Test prestazioni |
| `vibrationTest` | Boolean | Test vibrazioni |
| `certificationReq` | String[] | Certificazioni richieste |
| `documentationReq` | String[] | Documentazione richiesta |

## Tabelle Metriche e Statistiche

### 28. time_metrics
**Descrizione**: Metriche temporali per ODL

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `odlId` | String | Riferimento ODL |
| `departmentId` | String | Riferimento reparto |
| `advancementTime` | Int? | Tempo totale ENTRY→EXIT |
| `workingTime` | Int? | Tempo lavorazione (no pause) |
| `waitingTime` | Int? | Tempo attesa |
| `entryTimestamp` | DateTime? | Timestamp ENTRY |
| `exitTimestamp` | DateTime? | Timestamp EXIT |
| `pauseDuration` | Int | Durata pause |
| `isCompleted` | Boolean | Reparto completato |
| `calculatedAt` | DateTime | Data calcolo |
| `updatedAt` | DateTime | Ultimo aggiornamento |

### 29. part_time_statistics
**Descrizione**: Statistiche temporali aggregate per parte

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `partId` | String | Riferimento parte |
| `departmentId` | String | Riferimento reparto |
| `avgAdvancementTime` | Float? | Tempo avanzamento medio |
| `avgWorkingTime` | Float? | Tempo lavorazione medio |
| `avgWaitingTime` | Float? | Tempo attesa medio |
| `completedODLCount` | Int | ODL completati |
| `totalAdvancementTime` | Int | Tempo avanzamento totale |
| `totalWorkingTime` | Int | Tempo lavorazione totale |
| `totalWaitingTime` | Int | Tempo attesa totale |
| `lastUpdated` | DateTime | Ultimo aggiornamento |

## Tabelle Sistema

### 30. gamma_sync_logs
**Descrizione**: Log sincronizzazione sistema Gamma

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `fileName` | String | Nome file |
| `fileType` | String | Tipo file |
| `entityType` | String | Tipo entità |
| `syncStatus` | SyncStatus | Stato sincronizzazione |
| `recordsRead` | Int | Record letti |
| `recordsSynced` | Int | Record sincronizzati |
| `recordsSkipped` | Int | Record saltati |
| `errorMessage` | String? | Messaggio errore |
| `syncedAt` | DateTime | Data sincronizzazione |

### 31. audit_logs
**Descrizione**: Log audit sistema

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | ID univoco |
| `action` | AuditAction | Azione eseguita |
| `resource` | String | Risorsa interessata |
| `resourceId` | String? | ID risorsa |
| `userId` | String | Utente |
| `userEmail` | String | Email utente |
| `details` | Json? | Dettagli azione |
| `ipAddress` | String? | Indirizzo IP |
| `userAgent` | String? | User Agent |
| `timestamp` | DateTime | Timestamp |

## Enumeratori

### UserRole
- `ADMIN` - Amministratore sistema
- `SUPERVISOR` - Supervisore
- `OPERATOR` - Operatore

### DepartmentRole
- `CAPO_REPARTO` - Capo reparto
- `CAPO_TURNO` - Capo turno
- `OPERATORE` - Operatore

### Priority
- `LOW` - Bassa
- `NORMAL` - Normale
- `HIGH` - Alta
- `URGENT` - Urgente

### ODLStatus
Stati completi del ciclo produttivo:
- `CREATED` - Creato
- `IN_HONEYCOMB` - In Honeycomb
- `HONEYCOMB_COMPLETED` - Honeycomb completato
- `IN_CLEANROOM` - In Clean Room
- `CLEANROOM_COMPLETED` - Clean Room completato
- `IN_CONTROLLO_NUMERICO` - In CNC
- `CONTROLLO_NUMERICO_COMPLETED` - CNC completato
- `IN_MONTAGGIO` - In Montaggio
- `MONTAGGIO_COMPLETED` - Montaggio completato
- `IN_AUTOCLAVE` - In Autoclave
- `AUTOCLAVE_COMPLETED` - Autoclave completato
- `IN_NDI` - In NDI
- `NDI_COMPLETED` - NDI completato
- `IN_VERNICIATURA` - In Verniciatura
- `VERNICIATURA_COMPLETED` - Verniciatura completato
- `IN_MOTORI` - In Motori
- `MOTORI_COMPLETED` - Motori completato
- `IN_CONTROLLO_QUALITA` - In Controllo Qualità
- `CONTROLLO_QUALITA_COMPLETED` - Controllo Qualità completato
- `COMPLETED` - Completato
- `ON_HOLD` - In attesa
- `CANCELLED` - Cancellato

### EventType
- `ENTRY` - Ingresso
- `EXIT` - Uscita
- `PAUSE` - Pausa
- `RESUME` - Ripresa
- `NOTE` - Nota

### DepartmentType
- `HONEYCOMB` - Processo honeycomb
- `CLEANROOM` - Camera bianca laminazione
- `CONTROLLO_NUMERICO` - Controllo numerico CNC
- `MONTAGGIO` - Assemblaggio
- `AUTOCLAVE` - Cottura
- `NDI` - Controlli non distruttivi
- `VERNICIATURA` - Verniciatura
- `MOTORI` - Assemblaggio motori
- `CONTROLLO_QUALITA` - Controllo qualità
- `OTHER` - Altri reparti

### Altri Enumeratori
Vedere schema Prisma per tutti gli enumeratori specializzati per materiali, tipi di lavorazione, stati qualità, ecc.

---

*Documento generato automaticamente dal schema Prisma del database MES Aerospazio*