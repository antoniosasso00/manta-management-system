import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { Queue } from 'bullmq'
import Redis from 'ioredis'

const execAsync = promisify(exec)

interface BackupJob {
  type: 'manual' | 'scheduled'
  userId?: string
  retentionDays?: number
}

interface BackupResult {
  success: boolean
  fileName?: string
  size?: number
  duration?: number
  error?: string
}

export class BackupService {
  private static backupQueue: Queue | null = null
  private static redisClient: Redis | null = null

  static async initializeQueue() {
    if (!this.backupQueue) {
      try {
        this.redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

        this.backupQueue = new Queue('backup-queue', {
          connection: this.redisClient,
        })

        console.log('Backup queue initialized successfully')
      } catch (error) {
        console.error('Failed to initialize backup queue:', error)
      }
    }
  }

  static async scheduleBackup(job: BackupJob): Promise<string> {
    await this.initializeQueue()
    
    if (!this.backupQueue) {
      throw new Error('Backup queue not initialized')
    }

    const jobId = `backup-${Date.now()}`
    await this.backupQueue.add('perform-backup', job, {
      jobId,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    })

    return jobId
  }

  static async performBackup(options: {
    type: 'manual' | 'scheduled'
    userId?: string
    retentionDays?: number
  }): Promise<BackupResult> {
    const startTime = Date.now()
    
    try {
      const databaseUrl = process.env.DATABASE_URL
      if (!databaseUrl) {
        throw new Error('DATABASE_URL not configured')
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `${options.type}-backup-${timestamp}.sql`
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

      console.log(`Performing ${options.type} backup...`)
      await execAsync(pgDumpCmd)

      // Verifica che il file sia stato creato
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file not created')
      }

      const stats = fs.statSync(backupPath)
      const duration = Date.now() - startTime

      // Pulisci i backup vecchi se specificato
      if (options.retentionDays) {
        await this.cleanupOldBackups(options.retentionDays)
      }

      console.log(`${options.type} backup completed: ${fileName} (${stats.size} bytes, ${duration}ms)`)
      
      return {
        success: true,
        fileName,
        size: stats.size,
        duration,
      }
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`${options.type} backup failed:`, error)
      
      return {
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  static async restoreBackup(backupData: Buffer): Promise<BackupResult> {
    const startTime = Date.now()
    
    try {
      const databaseUrl = process.env.DATABASE_URL
      if (!databaseUrl) {
        throw new Error('DATABASE_URL not configured')
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const restoreFileName = `restore-${timestamp}.sql`
      const tempDir = path.join(process.cwd(), 'temp')
      
      // Assicurati che la directory temp esista
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }
      
      const restorePath = path.join(tempDir, restoreFileName)

      // Scrivi il file di backup nel disco
      fs.writeFileSync(restorePath, backupData)

      // Crea un backup di sicurezza prima del ripristino
      const safetyBackupResult = await this.performBackup({
        type: 'manual',
        userId: 'system-safety',
      })

      if (!safetyBackupResult.success) {
        console.warn('Safety backup failed, proceeding with restore anyway')
      }

      // Parse dell'URL del database
      const url = new URL(databaseUrl)
      const dbName = url.pathname.slice(1)
      const host = url.hostname
      const port = url.port || '5432'
      const username = url.username
      const password = url.password

      // Comando psql per importare il database
      const psqlCmd = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${username} -d ${dbName} -f "${restorePath}" -v ON_ERROR_STOP=1`

      console.log('Performing database restore...')
      await execAsync(psqlCmd)

      // Pulisci il file temporaneo
      fs.unlinkSync(restorePath)

      const duration = Date.now() - startTime
      console.log(`Database restore completed (${duration}ms)`)
      
      return {
        success: true,
        duration,
      }
    } catch (error) {
      const duration = Date.now() - startTime
      console.error('Database restore failed:', error)
      
      return {
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  static async listBackups(): Promise<Array<{
    name: string
    size: number
    created: Date
    modified: Date
    type: 'manual' | 'scheduled'
  }>> {
    const backupDir = path.join(process.cwd(), 'backups')
    
    if (!fs.existsSync(backupDir)) {
      return []
    }

    return fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const filePath = path.join(backupDir, file)
        const stats = fs.statSync(filePath)
        
        return {
          name: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          type: file.startsWith('scheduled-') ? 'scheduled' : 'manual',
        }
      })
      .sort((a, b) => b.modified.getTime() - a.modified.getTime())
  }

  static async deleteBackup(fileName: string): Promise<boolean> {
    try {
      const backupDir = path.join(process.cwd(), 'backups')
      const filePath = path.join(backupDir, fileName)
      
      // Verifica che il file esista e sia nella directory corretta
      if (!fs.existsSync(filePath) || !filePath.startsWith(backupDir)) {
        return false
      }

      fs.unlinkSync(filePath)
      console.log(`Backup deleted: ${fileName}`)
      return true
    } catch (error) {
      console.error('Error deleting backup:', error)
      return false
    }
  }

  static async cleanupOldBackups(retentionDays: number): Promise<number> {
    try {
      const backupDir = path.join(process.cwd(), 'backups')
      
      if (!fs.existsSync(backupDir)) {
        return 0
      }

      const files = fs.readdirSync(backupDir)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

      let deletedCount = 0

      for (const file of files) {
        const filePath = path.join(backupDir, file)
        const stats = fs.statSync(filePath)
        
        if (stats.birthtime < cutoffDate) {
          fs.unlinkSync(filePath)
          console.log(`Deleted old backup: ${file}`)
          deletedCount++
        }
      }

      return deletedCount
    } catch (error) {
      console.error('Error cleaning up old backups:', error)
      return 0
    }
  }

  static async getBackupStats(): Promise<{
    totalBackups: number
    totalSize: number
    oldestBackup?: Date
    newestBackup?: Date
  }> {
    const backups = await this.listBackups()
    
    if (backups.length === 0) {
      return {
        totalBackups: 0,
        totalSize: 0,
      }
    }

    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0)
    const dates = backups.map(backup => backup.created)
    
    return {
      totalBackups: backups.length,
      totalSize,
      oldestBackup: new Date(Math.min(...dates.map(d => d.getTime()))),
      newestBackup: new Date(Math.max(...dates.map(d => d.getTime()))),
    }
  }
}

// Funzione di utilità per formattare le dimensioni dei file
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Funzione di utilità per formattare la durata
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}