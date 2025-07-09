-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SUPERVISOR', 'OPERATOR');

-- CreateEnum
CREATE TYPE "DepartmentRole" AS ENUM ('CAPO_REPARTO', 'CAPO_TURNO', 'OPERATORE');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ODLStatus" AS ENUM ('CREATED', 'IN_HONEYCOMB', 'HONEYCOMB_COMPLETED', 'IN_CLEANROOM', 'CLEANROOM_COMPLETED', 'IN_CONTROLLO_NUMERICO', 'CONTROLLO_NUMERICO_COMPLETED', 'IN_MONTAGGIO', 'MONTAGGIO_COMPLETED', 'IN_AUTOCLAVE', 'AUTOCLAVE_COMPLETED', 'IN_NDI', 'NDI_COMPLETED', 'IN_VERNICIATURA', 'VERNICIATURA_COMPLETED', 'IN_MOTORI', 'MOTORI_COMPLETED', 'IN_CONTROLLO_QUALITA', 'CONTROLLO_QUALITA_COMPLETED', 'COMPLETED', 'ON_HOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('ENTRY', 'EXIT', 'PAUSE', 'RESUME', 'NOTE');

-- CreateEnum
CREATE TYPE "DepartmentType" AS ENUM ('HONEYCOMB', 'CLEANROOM', 'CONTROLLO_NUMERICO', 'MONTAGGIO', 'AUTOCLAVE', 'NDI', 'VERNICIATURA', 'MOTORI', 'CONTROLLO_QUALITA', 'OTHER');

-- CreateEnum
CREATE TYPE "LoadStatus" AS ENUM ('DRAFT', 'READY', 'IN_CURE', 'COMPLETED', 'RELEASED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'BULK_UPDATE', 'BULK_DELETE', 'EXPORT', 'IMPORT', 'LOGIN', 'LOGOUT', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "QCInspectionType" AS ENUM ('DIMENSIONAL', 'VISUAL', 'FUNCTIONAL', 'MATERIAL', 'SURFACE', 'ASSEMBLY', 'FINAL');

-- CreateEnum
CREATE TYPE "QCFrequency" AS ENUM ('EVERY_PIECE', 'FIRST_PIECE', 'SAMPLE', 'PERIODIC', 'FINAL_ONLY');

-- CreateEnum
CREATE TYPE "QCStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QCResult" AS ENUM ('PASS', 'FAIL', 'CONDITIONAL', 'RECHECK');

-- CreateEnum
CREATE TYPE "NCType" AS ENUM ('DIMENSIONAL', 'VISUAL', 'FUNCTIONAL', 'MATERIAL', 'PROCESS', 'DOCUMENTATION');

-- CreateEnum
CREATE TYPE "NCSeverity" AS ENUM ('CRITICAL', 'MAJOR', 'MINOR', 'COSMETIC');

-- CreateEnum
CREATE TYPE "NCCategory" AS ENUM ('CUSTOMER_IMPACT', 'SAFETY', 'REGULATORY', 'INTERNAL', 'SUPPLIER');

-- CreateEnum
CREATE TYPE "NCStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CAPAType" AS ENUM ('CORRECTIVE', 'PREVENTIVE', 'IMPROVEMENT');

-- CreateEnum
CREATE TYPE "CAPAStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'CLOSED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "HoneycombType" AS ENUM ('ALUMINUM_3_16', 'ALUMINUM_1_4', 'ALUMINUM_3_8', 'NOMEX_3_16', 'NOMEX_1_4', 'NOMEX_3_8', 'CARBON_3_16', 'CARBON_1_4');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "CNCMaterialType" AS ENUM ('ALUMINUM', 'CARBON_FIBER', 'STEEL', 'TITANIUM', 'COMPOSITE', 'PLASTIC');

-- CreateEnum
CREATE TYPE "ToleranceClass" AS ENUM ('ROUGH', 'STANDARD', 'FINE', 'PRECISION', 'HIGH_PRECISION');

-- CreateEnum
CREATE TYPE "AssemblyType" AS ENUM ('MECHANICAL', 'BONDED', 'WELDED', 'RIVETED', 'HYBRID');

-- CreateEnum
CREATE TYPE "CoatingType" AS ENUM ('PRIMER', 'BASE_COAT', 'CLEAR_COAT', 'POWDER_COAT', 'ANODIZING', 'CHEMICAL_CONVERSION');

-- CreateEnum
CREATE TYPE "SurfacePrepType" AS ENUM ('DEGREASING', 'SANDING', 'BLASTING', 'ETCHING', 'POLISHING');

-- CreateEnum
CREATE TYPE "EngineType" AS ENUM ('PISTON', 'TURBOPROP', 'TURBOJET', 'TURBOFAN', 'ELECTRIC', 'HYBRID');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('AVGAS_100LL', 'JET_A1', 'DIESEL', 'ELECTRIC', 'HYDROGEN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OPERATOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "departmentId" TEXT,
    "departmentRole" "DepartmentRole",
    "settings" JSONB,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parts" (
    "id" TEXT NOT NULL,
    "partNumber" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gammaId" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'SUCCESS',
    "defaultCuringCycleId" TEXT,
    "defaultVacuumLines" INTEGER,

    CONSTRAINT "parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "odls" (
    "id" TEXT NOT NULL,
    "odlNumber" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "status" "ODLStatus" NOT NULL DEFAULT 'CREATED',
    "qrCode" TEXT NOT NULL,
    "expectedCompletionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gammaId" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'SUCCESS',

    CONSTRAINT "odls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_events" (
    "id" TEXT NOT NULL,
    "odlId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "notes" TEXT,
    "duration" INTEGER,
    "isAutomatic" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "production_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DepartmentType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autoclaves" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "maxLength" DOUBLE PRECISION NOT NULL,
    "maxWidth" DOUBLE PRECISION NOT NULL,
    "vacuumLines" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "autoclaves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autoclave_loads" (
    "id" TEXT NOT NULL,
    "loadNumber" TEXT NOT NULL,
    "autoclaveId" TEXT NOT NULL,
    "curingCycleId" TEXT NOT NULL,
    "plannedStart" TIMESTAMP(3) NOT NULL,
    "actualStart" TIMESTAMP(3),
    "plannedEnd" TIMESTAMP(3) NOT NULL,
    "actualEnd" TIMESTAMP(3),
    "status" "LoadStatus" NOT NULL DEFAULT 'DRAFT',
    "layoutData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "autoclave_loads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autoclave_load_items" (
    "id" TEXT NOT NULL,
    "odlId" TEXT NOT NULL,
    "autoclaveLoadId" TEXT NOT NULL,
    "position" JSONB,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previousStatus" "ODLStatus",

    CONSTRAINT "autoclave_load_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gamma_sync_logs" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "syncStatus" "SyncStatus" NOT NULL,
    "recordsRead" INTEGER NOT NULL DEFAULT 0,
    "recordsSynced" INTEGER NOT NULL DEFAULT 0,
    "recordsSkipped" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gamma_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tools" (
    "id" TEXT NOT NULL,
    "toolPartNumber" TEXT NOT NULL,
    "description" TEXT,
    "base" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION,
    "material" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_tools" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,

    CONSTRAINT "part_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curing_cycles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "phase1Temperature" DOUBLE PRECISION NOT NULL,
    "phase1Pressure" DOUBLE PRECISION NOT NULL,
    "phase1Duration" INTEGER NOT NULL,
    "phase2Temperature" DOUBLE PRECISION,
    "phase2Pressure" DOUBLE PRECISION,
    "phase2Duration" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curing_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_control_plans" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "inspectionType" "QCInspectionType" NOT NULL,
    "frequency" "QCFrequency" NOT NULL,
    "sampleSize" INTEGER NOT NULL DEFAULT 1,
    "acceptanceCriteria" JSONB NOT NULL,

    CONSTRAINT "quality_control_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_inspections" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "odlId" TEXT NOT NULL,
    "inspectorId" TEXT NOT NULL,
    "status" "QCStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "result" "QCResult",
    "measurements" JSONB,
    "notes" TEXT,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "certificateNumber" TEXT,
    "signedBy" TEXT,
    "signedAt" TIMESTAMP(3),

    CONSTRAINT "quality_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "non_conformities" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT,
    "odlId" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "type" "NCType" NOT NULL,
    "severity" "NCSeverity" NOT NULL,
    "category" "NCCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rootCause" TEXT,
    "status" "NCStatus" NOT NULL DEFAULT 'OPEN',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedTo" TEXT,
    "dueDate" TIMESTAMP(3),

    CONSTRAINT "non_conformities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corrective_actions" (
    "id" TEXT NOT NULL,
    "nonConformityId" TEXT NOT NULL,
    "type" "CAPAType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "plannedAction" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "status" "CAPAStatus" NOT NULL DEFAULT 'PLANNED',
    "actualAction" TEXT,
    "completedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "effectiveness" TEXT,
    "followUpDate" TIMESTAMP(3),

    CONSTRAINT "corrective_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_certificates" (
    "id" TEXT NOT NULL,
    "odlId" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "conformityStatus" BOOLEAN NOT NULL DEFAULT false,
    "standardsRef" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "issuedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "documentPath" TEXT,

    CONSTRAINT "quality_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_honeycomb" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "coreType" "HoneycombType" NOT NULL,
    "cellSize" DOUBLE PRECISION NOT NULL,
    "coreDensity" DOUBLE PRECISION NOT NULL,
    "coreThickness" DOUBLE PRECISION NOT NULL,
    "skinMaterial" TEXT,
    "skinThickness" DOUBLE PRECISION,
    "adhesiveType" TEXT NOT NULL,
    "cureTemperature" DOUBLE PRECISION NOT NULL,
    "cureTime" INTEGER NOT NULL,
    "pressure" DOUBLE PRECISION NOT NULL,
    "bondStrength" DOUBLE PRECISION,
    "compressionStrength" DOUBLE PRECISION,
    "setupTimeMinutes" INTEGER,
    "cycleTimeMinutes" INTEGER,
    "skillLevel" "SkillLevel" NOT NULL DEFAULT 'BASIC',

    CONSTRAINT "part_honeycomb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_controllo_numerico" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "materialType" "CNCMaterialType" NOT NULL,
    "toolingRequired" TEXT[],
    "programmingTime" INTEGER,
    "setupTime" INTEGER,
    "cycleTime" INTEGER,
    "toleranceClass" "ToleranceClass" NOT NULL DEFAULT 'STANDARD',
    "surfaceFinish" TEXT,
    "compatibleMachines" TEXT[],
    "priority" INTEGER NOT NULL DEFAULT 1,
    "dimensionalChecks" JSONB NOT NULL,
    "requiredInspection" TEXT,

    CONSTRAINT "part_controllo_numerico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_montaggio" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "assemblyType" "AssemblyType" NOT NULL,
    "componentCount" INTEGER NOT NULL,
    "assemblyTime" INTEGER,
    "testingTime" INTEGER,
    "requiredParts" JSONB NOT NULL,
    "requiredTools" TEXT[],
    "requiredFixtures" TEXT[],
    "assemblySequence" JSONB NOT NULL,
    "testProcedure" TEXT,
    "qualityChecks" TEXT[],

    CONSTRAINT "part_montaggio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_verniciatura" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "coatingType" "CoatingType" NOT NULL,
    "primerRequired" BOOLEAN NOT NULL DEFAULT false,
    "coatLayers" INTEGER NOT NULL DEFAULT 1,
    "surfacePrep" "SurfacePrepType" NOT NULL,
    "cleaningRequired" BOOLEAN NOT NULL DEFAULT true,
    "maskingRequired" BOOLEAN NOT NULL DEFAULT false,
    "sprayPattern" TEXT,
    "cureTemperature" DOUBLE PRECISION,
    "cureTime" INTEGER,
    "dryTime" INTEGER NOT NULL,
    "thicknessCheck" BOOLEAN NOT NULL DEFAULT true,
    "adhesionTest" BOOLEAN NOT NULL DEFAULT false,
    "colorMatch" TEXT,

    CONSTRAINT "part_verniciatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_autoclave" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "curingCycleId" TEXT NOT NULL,
    "vacuumLines" INTEGER NOT NULL,
    "setupTime" INTEGER,
    "loadPosition" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "part_autoclave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_cleanroom" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "layupSequence" JSONB,
    "fiberOrientation" TEXT[],
    "resinType" TEXT,
    "prepregCode" TEXT,
    "roomTemperature" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "shelfLife" INTEGER,
    "setupTime" INTEGER,
    "cycleTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "part_cleanroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_ndi" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "inspectionMethod" TEXT[],
    "acceptanceCriteria" JSONB,
    "criticalAreas" JSONB,
    "inspectionTime" INTEGER,
    "requiredCerts" TEXT[],
    "calibrationReq" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "part_ndi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_motori" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "engineType" "EngineType" NOT NULL,
    "powerRating" DOUBLE PRECISION,
    "rpmRange" TEXT,
    "fuelType" "FuelType",
    "assemblyTime" INTEGER,
    "testingTime" INTEGER,
    "burnInTime" INTEGER,
    "compressionTest" BOOLEAN NOT NULL DEFAULT false,
    "leakTest" BOOLEAN NOT NULL DEFAULT true,
    "performanceTest" BOOLEAN NOT NULL DEFAULT true,
    "vibrationTest" BOOLEAN NOT NULL DEFAULT false,
    "certificationReq" TEXT[],
    "documentationReq" TEXT[],

    CONSTRAINT "part_motori_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_metrics" (
    "id" TEXT NOT NULL,
    "odlId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "advancementTime" INTEGER,
    "workingTime" INTEGER,
    "waitingTime" INTEGER,
    "entryTimestamp" TIMESTAMP(3),
    "exitTimestamp" TIMESTAMP(3),
    "pauseDuration" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_time_statistics" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "avgAdvancementTime" DOUBLE PRECISION,
    "avgWorkingTime" DOUBLE PRECISION,
    "avgWaitingTime" DOUBLE PRECISION,
    "completedODLCount" INTEGER NOT NULL DEFAULT 0,
    "totalAdvancementTime" INTEGER NOT NULL DEFAULT 0,
    "totalWorkingTime" INTEGER NOT NULL DEFAULT 0,
    "totalWaitingTime" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "part_time_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_isActive_idx" ON "users"("email", "isActive");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_departmentId_departmentRole_idx" ON "users"("departmentId", "departmentRole");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expiresAt_used_idx" ON "password_reset_tokens"("expiresAt", "used");

-- CreateIndex
CREATE INDEX "password_reset_tokens_createdAt_idx" ON "password_reset_tokens"("createdAt");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expires_idx" ON "sessions"("expires");

-- CreateIndex
CREATE UNIQUE INDEX "parts_partNumber_key" ON "parts"("partNumber");

-- CreateIndex
CREATE INDEX "parts_partNumber_idx" ON "parts"("partNumber");

-- CreateIndex
CREATE INDEX "parts_gammaId_idx" ON "parts"("gammaId");

-- CreateIndex
CREATE INDEX "parts_defaultCuringCycleId_idx" ON "parts"("defaultCuringCycleId");

-- CreateIndex
CREATE UNIQUE INDEX "odls_odlNumber_key" ON "odls"("odlNumber");

-- CreateIndex
CREATE UNIQUE INDEX "odls_qrCode_key" ON "odls"("qrCode");

-- CreateIndex
CREATE INDEX "odls_qrCode_idx" ON "odls"("qrCode");

-- CreateIndex
CREATE INDEX "odls_partId_status_idx" ON "odls"("partId", "status");

-- CreateIndex
CREATE INDEX "odls_status_priority_createdAt_idx" ON "odls"("status", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "odls_gammaId_idx" ON "odls"("gammaId");

-- CreateIndex
CREATE INDEX "odls_createdAt_idx" ON "odls"("createdAt");

-- CreateIndex
CREATE INDEX "production_events_odlId_timestamp_idx" ON "production_events"("odlId", "timestamp");

-- CreateIndex
CREATE INDEX "production_events_departmentId_eventType_timestamp_idx" ON "production_events"("departmentId", "eventType", "timestamp");

-- CreateIndex
CREATE INDEX "production_events_userId_timestamp_idx" ON "production_events"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "production_events_timestamp_isAutomatic_idx" ON "production_events"("timestamp", "isAutomatic");

-- CreateIndex
CREATE INDEX "production_events_odlId_departmentId_eventType_idx" ON "production_events"("odlId", "departmentId", "eventType");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "autoclaves_code_key" ON "autoclaves"("code");

-- CreateIndex
CREATE UNIQUE INDEX "autoclave_loads_loadNumber_key" ON "autoclave_loads"("loadNumber");

-- CreateIndex
CREATE INDEX "autoclave_loads_autoclaveId_status_plannedStart_idx" ON "autoclave_loads"("autoclaveId", "status", "plannedStart");

-- CreateIndex
CREATE INDEX "autoclave_loads_status_plannedStart_idx" ON "autoclave_loads"("status", "plannedStart");

-- CreateIndex
CREATE INDEX "autoclave_loads_curingCycleId_status_idx" ON "autoclave_loads"("curingCycleId", "status");

-- CreateIndex
CREATE INDEX "autoclave_loads_plannedStart_plannedEnd_idx" ON "autoclave_loads"("plannedStart", "plannedEnd");

-- CreateIndex
CREATE INDEX "autoclave_load_items_autoclaveLoadId_idx" ON "autoclave_load_items"("autoclaveLoadId");

-- CreateIndex
CREATE UNIQUE INDEX "autoclave_load_items_odlId_autoclaveLoadId_key" ON "autoclave_load_items"("odlId", "autoclaveLoadId");

-- CreateIndex
CREATE INDEX "gamma_sync_logs_fileType_syncedAt_idx" ON "gamma_sync_logs"("fileType", "syncedAt");

-- CreateIndex
CREATE UNIQUE INDEX "tools_toolPartNumber_key" ON "tools"("toolPartNumber");

-- CreateIndex
CREATE INDEX "tools_toolPartNumber_idx" ON "tools"("toolPartNumber");

-- CreateIndex
CREATE INDEX "part_tools_partId_idx" ON "part_tools"("partId");

-- CreateIndex
CREATE INDEX "part_tools_toolId_idx" ON "part_tools"("toolId");

-- CreateIndex
CREATE UNIQUE INDEX "part_tools_partId_toolId_key" ON "part_tools"("partId", "toolId");

-- CreateIndex
CREATE UNIQUE INDEX "curing_cycles_code_key" ON "curing_cycles"("code");

-- CreateIndex
CREATE INDEX "curing_cycles_code_idx" ON "curing_cycles"("code");

-- CreateIndex
CREATE INDEX "audit_logs_resource_resourceId_timestamp_idx" ON "audit_logs"("resource", "resourceId", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_action_timestamp_idx" ON "audit_logs"("action", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_userId_timestamp_idx" ON "audit_logs"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "quality_control_plans_partId_isActive_idx" ON "quality_control_plans"("partId", "isActive");

-- CreateIndex
CREATE INDEX "quality_control_plans_inspectionType_isActive_idx" ON "quality_control_plans"("inspectionType", "isActive");

-- CreateIndex
CREATE INDEX "quality_control_plans_createdAt_idx" ON "quality_control_plans"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "quality_inspections_certificateNumber_key" ON "quality_inspections"("certificateNumber");

-- CreateIndex
CREATE INDEX "quality_inspections_odlId_status_idx" ON "quality_inspections"("odlId", "status");

-- CreateIndex
CREATE INDEX "quality_inspections_inspectorId_status_idx" ON "quality_inspections"("inspectorId", "status");

-- CreateIndex
CREATE INDEX "quality_inspections_completedAt_idx" ON "quality_inspections"("completedAt");

-- CreateIndex
CREATE INDEX "quality_inspections_certificateNumber_idx" ON "quality_inspections"("certificateNumber");

-- CreateIndex
CREATE INDEX "non_conformities_odlId_status_idx" ON "non_conformities"("odlId", "status");

-- CreateIndex
CREATE INDEX "non_conformities_assignedTo_status_idx" ON "non_conformities"("assignedTo", "status");

-- CreateIndex
CREATE INDEX "non_conformities_severity_status_idx" ON "non_conformities"("severity", "status");

-- CreateIndex
CREATE INDEX "non_conformities_detectedAt_idx" ON "non_conformities"("detectedAt");

-- CreateIndex
CREATE INDEX "corrective_actions_nonConformityId_idx" ON "corrective_actions"("nonConformityId");

-- CreateIndex
CREATE INDEX "corrective_actions_assignedTo_status_idx" ON "corrective_actions"("assignedTo", "status");

-- CreateIndex
CREATE INDEX "corrective_actions_dueDate_status_idx" ON "corrective_actions"("dueDate", "status");

-- CreateIndex
CREATE INDEX "corrective_actions_completedAt_idx" ON "corrective_actions"("completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "quality_certificates_certificateNumber_key" ON "quality_certificates"("certificateNumber");

-- CreateIndex
CREATE INDEX "quality_certificates_odlId_idx" ON "quality_certificates"("odlId");

-- CreateIndex
CREATE INDEX "quality_certificates_certificateNumber_idx" ON "quality_certificates"("certificateNumber");

-- CreateIndex
CREATE INDEX "quality_certificates_issuedAt_idx" ON "quality_certificates"("issuedAt");

-- CreateIndex
CREATE INDEX "quality_certificates_conformityStatus_idx" ON "quality_certificates"("conformityStatus");

-- CreateIndex
CREATE UNIQUE INDEX "part_honeycomb_partId_key" ON "part_honeycomb"("partId");

-- CreateIndex
CREATE INDEX "part_honeycomb_partId_idx" ON "part_honeycomb"("partId");

-- CreateIndex
CREATE INDEX "part_honeycomb_coreType_idx" ON "part_honeycomb"("coreType");

-- CreateIndex
CREATE UNIQUE INDEX "part_controllo_numerico_partId_key" ON "part_controllo_numerico"("partId");

-- CreateIndex
CREATE INDEX "part_controllo_numerico_partId_idx" ON "part_controllo_numerico"("partId");

-- CreateIndex
CREATE INDEX "part_controllo_numerico_materialType_idx" ON "part_controllo_numerico"("materialType");

-- CreateIndex
CREATE UNIQUE INDEX "part_montaggio_partId_key" ON "part_montaggio"("partId");

-- CreateIndex
CREATE INDEX "part_montaggio_partId_idx" ON "part_montaggio"("partId");

-- CreateIndex
CREATE INDEX "part_montaggio_assemblyType_idx" ON "part_montaggio"("assemblyType");

-- CreateIndex
CREATE UNIQUE INDEX "part_verniciatura_partId_key" ON "part_verniciatura"("partId");

-- CreateIndex
CREATE INDEX "part_verniciatura_partId_idx" ON "part_verniciatura"("partId");

-- CreateIndex
CREATE INDEX "part_verniciatura_coatingType_idx" ON "part_verniciatura"("coatingType");

-- CreateIndex
CREATE UNIQUE INDEX "part_autoclave_partId_key" ON "part_autoclave"("partId");

-- CreateIndex
CREATE INDEX "part_autoclave_partId_idx" ON "part_autoclave"("partId");

-- CreateIndex
CREATE INDEX "part_autoclave_curingCycleId_idx" ON "part_autoclave"("curingCycleId");

-- CreateIndex
CREATE UNIQUE INDEX "part_cleanroom_partId_key" ON "part_cleanroom"("partId");

-- CreateIndex
CREATE INDEX "part_cleanroom_partId_idx" ON "part_cleanroom"("partId");

-- CreateIndex
CREATE UNIQUE INDEX "part_ndi_partId_key" ON "part_ndi"("partId");

-- CreateIndex
CREATE INDEX "part_ndi_partId_idx" ON "part_ndi"("partId");

-- CreateIndex
CREATE UNIQUE INDEX "part_motori_partId_key" ON "part_motori"("partId");

-- CreateIndex
CREATE INDEX "part_motori_partId_idx" ON "part_motori"("partId");

-- CreateIndex
CREATE INDEX "part_motori_engineType_idx" ON "part_motori"("engineType");

-- CreateIndex
CREATE INDEX "time_metrics_odlId_idx" ON "time_metrics"("odlId");

-- CreateIndex
CREATE INDEX "time_metrics_departmentId_isCompleted_idx" ON "time_metrics"("departmentId", "isCompleted");

-- CreateIndex
CREATE INDEX "time_metrics_calculatedAt_idx" ON "time_metrics"("calculatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "time_metrics_odlId_departmentId_key" ON "time_metrics"("odlId", "departmentId");

-- CreateIndex
CREATE INDEX "part_time_statistics_partId_idx" ON "part_time_statistics"("partId");

-- CreateIndex
CREATE INDEX "part_time_statistics_departmentId_idx" ON "part_time_statistics"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "part_time_statistics_partId_departmentId_key" ON "part_time_statistics"("partId", "departmentId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parts" ADD CONSTRAINT "parts_defaultCuringCycleId_fkey" FOREIGN KEY ("defaultCuringCycleId") REFERENCES "curing_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "odls" ADD CONSTRAINT "odls_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_events" ADD CONSTRAINT "production_events_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_events" ADD CONSTRAINT "production_events_odlId_fkey" FOREIGN KEY ("odlId") REFERENCES "odls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_events" ADD CONSTRAINT "production_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autoclaves" ADD CONSTRAINT "autoclaves_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autoclave_loads" ADD CONSTRAINT "autoclave_loads_autoclaveId_fkey" FOREIGN KEY ("autoclaveId") REFERENCES "autoclaves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autoclave_loads" ADD CONSTRAINT "autoclave_loads_curingCycleId_fkey" FOREIGN KEY ("curingCycleId") REFERENCES "curing_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autoclave_load_items" ADD CONSTRAINT "autoclave_load_items_autoclaveLoadId_fkey" FOREIGN KEY ("autoclaveLoadId") REFERENCES "autoclave_loads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autoclave_load_items" ADD CONSTRAINT "autoclave_load_items_odlId_fkey" FOREIGN KEY ("odlId") REFERENCES "odls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_tools" ADD CONSTRAINT "part_tools_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_tools" ADD CONSTRAINT "part_tools_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_control_plans" ADD CONSTRAINT "quality_control_plans_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_odlId_fkey" FOREIGN KEY ("odlId") REFERENCES "odls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_planId_fkey" FOREIGN KEY ("planId") REFERENCES "quality_control_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_signedBy_fkey" FOREIGN KEY ("signedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "non_conformities" ADD CONSTRAINT "non_conformities_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "non_conformities" ADD CONSTRAINT "non_conformities_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "quality_inspections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "non_conformities" ADD CONSTRAINT "non_conformities_odlId_fkey" FOREIGN KEY ("odlId") REFERENCES "odls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "non_conformities" ADD CONSTRAINT "non_conformities_reportedBy_fkey" FOREIGN KEY ("reportedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_nonConformityId_fkey" FOREIGN KEY ("nonConformityId") REFERENCES "non_conformities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_certificates" ADD CONSTRAINT "quality_certificates_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_certificates" ADD CONSTRAINT "quality_certificates_issuedBy_fkey" FOREIGN KEY ("issuedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_certificates" ADD CONSTRAINT "quality_certificates_odlId_fkey" FOREIGN KEY ("odlId") REFERENCES "odls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_honeycomb" ADD CONSTRAINT "part_honeycomb_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_controllo_numerico" ADD CONSTRAINT "part_controllo_numerico_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_montaggio" ADD CONSTRAINT "part_montaggio_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_verniciatura" ADD CONSTRAINT "part_verniciatura_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_autoclave" ADD CONSTRAINT "part_autoclave_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_autoclave" ADD CONSTRAINT "part_autoclave_curingCycleId_fkey" FOREIGN KEY ("curingCycleId") REFERENCES "curing_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_cleanroom" ADD CONSTRAINT "part_cleanroom_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_ndi" ADD CONSTRAINT "part_ndi_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_motori" ADD CONSTRAINT "part_motori_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_metrics" ADD CONSTRAINT "time_metrics_odlId_fkey" FOREIGN KEY ("odlId") REFERENCES "odls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_metrics" ADD CONSTRAINT "time_metrics_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_time_statistics" ADD CONSTRAINT "part_time_statistics_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_time_statistics" ADD CONSTRAINT "part_time_statistics_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
