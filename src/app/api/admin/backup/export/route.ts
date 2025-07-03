import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { BackupService } from '@/lib/backup-service'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    // Solo admin possono esportare il database
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
    }

    // Esegui il backup usando il servizio
    const result = await BackupService.performBackup({
      type: 'manual',
      userId: session.user.id,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Leggi il file backup
    const backupPath = path.join(process.cwd(), 'backups', result.fileName!)
    const backupData = fs.readFileSync(backupPath)

    // Restituisci il file come download
    return new NextResponse(backupData, {
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${result.fileName}"`,
        'Content-Length': backupData.length.toString(),
      },
    })
  } catch (error) {
    console.error('Errore durante il backup:', error)
    return NextResponse.json(
      { error: 'Errore durante il backup del database' },
      { status: 500 }
    )
  }
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

    // Restituisci informazioni sui backup disponibili usando il servizio
    const backups = await BackupService.listBackups()
    const stats = await BackupService.getBackupStats()

    return NextResponse.json({
      backups,
      stats,
    })
  } catch (error) {
    console.error('Errore nel recupero dei backup:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dei backup' },
      { status: 500 }
    )
  }
}