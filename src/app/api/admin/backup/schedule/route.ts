import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-node'
import { UserRole } from '@prisma/client'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

interface BackupSchedule {
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
  time: string
  retentionDays: number
  lastBackup?: Date
  nextBackup?: Date
}

// Questo sarebbe idealmente salvato in un database o file di configurazione
let currentSchedule: BackupSchedule = {
  enabled: false,
  frequency: 'daily',
  time: '02:00',
  retentionDays: 30,
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
    }

    // Calcola il prossimo backup
    const nextBackup = calculateNextBackup(currentSchedule)
    
    return NextResponse.json({
      ...currentSchedule,
      nextBackup,
    })
  } catch (error) {
    console.error('Errore nel recupero della configurazione:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero della configurazione' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
    }

    const body = await request.json()
    const { enabled, frequency, time, retentionDays } = body

    // Valida i parametri
    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Parametro enabled non valido' }, { status: 400 })
    }

    if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
      return NextResponse.json({ error: 'Frequenza non valida' }, { status: 400 })
    }

    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      return NextResponse.json({ error: 'Orario non valido' }, { status: 400 })
    }

    if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 365) {
      return NextResponse.json({ error: 'Giorni di retention non validi' }, { status: 400 })
    }

    // Aggiorna la configurazione
    currentSchedule = {
      enabled,
      frequency,
      time,
      retentionDays,
      lastBackup: currentSchedule.lastBackup,
    }

    // Se abilitato, imposta il cron job (in una implementazione reale)
    if (enabled) {
      console.log(`Backup automatico configurato: ${frequency} alle ${time}`)
      // Qui implementeresti la logica per impostare il cron job
      // setupCronJob(frequency, time)
    } else {
      console.log('Backup automatico disabilitato')
      // Qui implementeresti la logica per rimuovere il cron job
      // removeCronJob()
    }

    const nextBackup = calculateNextBackup(currentSchedule)

    return NextResponse.json({
      success: true,
      message: 'Configurazione salvata con successo',
      schedule: {
        ...currentSchedule,
        nextBackup,
      },
    })
  } catch (error) {
    console.error('Errore nel salvataggio della configurazione:', error)
    return NextResponse.json(
      { error: 'Errore nel salvataggio della configurazione' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
    }

    const url = new URL(request.url)
    const fileName = url.searchParams.get('file')
    
    if (!fileName) {
      return NextResponse.json({ error: 'Nome file non specificato' }, { status: 400 })
    }

    const backupDir = path.join(process.cwd(), 'backups')
    const filePath = path.join(backupDir, fileName)
    
    // Verifica che il file esista e sia nella directory corretta
    if (!fs.existsSync(filePath) || !filePath.startsWith(backupDir)) {
      return NextResponse.json({ error: 'File non trovato' }, { status: 404 })
    }

    // Elimina il file
    fs.unlinkSync(filePath)

    return NextResponse.json({
      success: true,
      message: 'File eliminato con successo',
      deletedFile: fileName,
    })
  } catch (error) {
    console.error('Errore nell\'eliminazione del file:', error)
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione del file' },
      { status: 500 }
    )
  }
}

// Funzione per calcolare il prossimo backup
function calculateNextBackup(schedule: BackupSchedule): Date | null {
  if (!schedule.enabled) return null

  const now = new Date()
  const [hours, minutes] = schedule.time.split(':').map(Number)
  
  let nextBackup = new Date()
  nextBackup.setHours(hours, minutes, 0, 0)

  switch (schedule.frequency) {
    case 'daily':
      if (nextBackup <= now) {
        nextBackup.setDate(nextBackup.getDate() + 1)
      }
      break
    case 'weekly':
      if (nextBackup <= now) {
        nextBackup.setDate(nextBackup.getDate() + 7)
      }
      break
    case 'monthly':
      if (nextBackup <= now) {
        nextBackup.setMonth(nextBackup.getMonth() + 1)
      }
      break
  }

  return nextBackup
}

// Funzione per pulire i backup vecchi
async function cleanupOldBackups(retentionDays: number) {
  try {
    const backupDir = path.join(process.cwd(), 'backups')
    
    if (!fs.existsSync(backupDir)) {
      return
    }

    const files = fs.readdirSync(backupDir)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    for (const file of files) {
      const filePath = path.join(backupDir, file)
      const stats = fs.statSync(filePath)
      
      if (stats.birthtime < cutoffDate) {
        fs.unlinkSync(filePath)
        console.log(`Eliminato backup vecchio: ${file}`)
      }
    }
  } catch (error) {
    console.error('Errore nella pulizia dei backup:', error)
  }
}

// Funzione per eseguire il backup automatico (non export per route compatibility)
async function performScheduledBackup() {
  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      console.error('DATABASE_URL non configurato')
      return
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `scheduled-backup-${timestamp}.sql`
    const backupDir = path.join(process.cwd(), 'backups')
    
    // Assicurati che la directory backups esista
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    
    const backupPath = path.join(backupDir, fileName)

    // Parse dell'URL del database
    const url = new URL(databaseUrl)
    const dbName = url.pathname.slice(1)
    const host = url.hostname
    const port = url.port || '5432'
    const username = url.username
    const password = url.password

    // Comando pg_dump per esportare il database
    const pgDumpCmd = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${dbName} -f "${backupPath}" --verbose --clean --if-exists --no-owner --no-privileges`

    console.log('Eseguendo backup automatico...')
    await execAsync(pgDumpCmd)

    // Aggiorna la data dell'ultimo backup
    currentSchedule.lastBackup = new Date()

    // Pulisci i backup vecchi
    await cleanupOldBackups(currentSchedule.retentionDays)

    console.log(`Backup automatico completato: ${fileName}`)
    return fileName
  } catch (error) {
    console.error('Errore durante il backup automatico:', error)
    throw error
  }
}