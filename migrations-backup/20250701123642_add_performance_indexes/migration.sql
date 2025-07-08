-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SUPERVISOR', 'OPERATOR');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ODLStatus" AS ENUM ('CREATED', 'IN_CLEANROOM', 'CLEANROOM_COMPLETED', 'IN_AUTOCLAVE', 'AUTOCLAVE_COMPLETED', 'IN_NDI', 'IN_RIFILATURA', 'COMPLETED', 'ON_HOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('ENTRY', 'EXIT', 'PAUSE', 'RESUME', 'NOTE');

-- CreateEnum
CREATE TYPE "DepartmentType" AS ENUM ('CLEANROOM', 'AUTOCLAVE', 'NDI', 'RIFILATURA', 'OTHER');

-- CreateEnum
CREATE TYPE "LoadStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED');

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
    "standardLength" DOUBLE PRECISION,
    "standardWidth" DOUBLE PRECISION,
    "standardHeight" DOUBLE PRECISION,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gammaId" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'SUCCESS',
    "length" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "curingCycleId" TEXT,
    "vacuumLines" INTEGER,

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
    "maxHeight" DOUBLE PRECISION NOT NULL,
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
    "status" "LoadStatus" NOT NULL DEFAULT 'PLANNED',
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
    "description" TEXT NOT NULL,
    "base" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "material" TEXT NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_isActive_idx" ON "users"("email", "isActive");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

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
CREATE INDEX "odls_status_idx" ON "odls"("status");

-- CreateIndex
CREATE INDEX "odls_partId_idx" ON "odls"("partId");

-- CreateIndex
CREATE INDEX "odls_gammaId_idx" ON "odls"("gammaId");

-- CreateIndex
CREATE INDEX "odls_curingCycleId_idx" ON "odls"("curingCycleId");

-- CreateIndex
CREATE INDEX "odls_qrCode_idx" ON "odls"("qrCode");

-- CreateIndex
CREATE INDEX "odls_createdAt_idx" ON "odls"("createdAt");

-- CreateIndex
CREATE INDEX "odls_status_createdAt_idx" ON "odls"("status", "createdAt");

-- CreateIndex
CREATE INDEX "odls_priority_status_idx" ON "odls"("priority", "status");

-- CreateIndex
CREATE INDEX "production_events_odlId_timestamp_idx" ON "production_events"("odlId", "timestamp");

-- CreateIndex
CREATE INDEX "production_events_departmentId_timestamp_idx" ON "production_events"("departmentId", "timestamp");

-- CreateIndex
CREATE INDEX "production_events_userId_timestamp_idx" ON "production_events"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "production_events_eventType_timestamp_idx" ON "production_events"("eventType", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "autoclaves_code_key" ON "autoclaves"("code");

-- CreateIndex
CREATE UNIQUE INDEX "autoclave_loads_loadNumber_key" ON "autoclave_loads"("loadNumber");

-- CreateIndex
CREATE INDEX "autoclave_loads_status_plannedStart_idx" ON "autoclave_loads"("status", "plannedStart");

-- CreateIndex
CREATE INDEX "autoclave_loads_curingCycleId_idx" ON "autoclave_loads"("curingCycleId");

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
ALTER TABLE "odls" ADD CONSTRAINT "odls_curingCycleId_fkey" FOREIGN KEY ("curingCycleId") REFERENCES "curing_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_events" ADD CONSTRAINT "production_events_odlId_fkey" FOREIGN KEY ("odlId") REFERENCES "odls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_events" ADD CONSTRAINT "production_events_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_events" ADD CONSTRAINT "production_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autoclaves" ADD CONSTRAINT "autoclaves_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autoclave_loads" ADD CONSTRAINT "autoclave_loads_autoclaveId_fkey" FOREIGN KEY ("autoclaveId") REFERENCES "autoclaves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autoclave_loads" ADD CONSTRAINT "autoclave_loads_curingCycleId_fkey" FOREIGN KEY ("curingCycleId") REFERENCES "curing_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autoclave_load_items" ADD CONSTRAINT "autoclave_load_items_odlId_fkey" FOREIGN KEY ("odlId") REFERENCES "odls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autoclave_load_items" ADD CONSTRAINT "autoclave_load_items_autoclaveLoadId_fkey" FOREIGN KEY ("autoclaveLoadId") REFERENCES "autoclave_loads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_tools" ADD CONSTRAINT "part_tools_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_tools" ADD CONSTRAINT "part_tools_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
