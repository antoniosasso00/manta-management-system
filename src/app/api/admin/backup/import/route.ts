import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { BackupService } from '@/lib/backup-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    // Solo admin possono importare il database
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('backup') as File
    
    if (!file) {
      return NextResponse.json({ error: 'Nessun file fornito' }, { status: 400 })
    }

    // Verifica che il file sia di tipo SQL
    if (!file.name.endsWith('.sql')) {
      return NextResponse.json({ error: 'Formato file non supportato. Solo file .sql' }, { status: 400 })
    }

    // Leggi il file caricato
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log('Avvio del ripristino del database...')
    
    // Esegui il ripristino usando il servizio
    const result = await BackupService.restoreBackup(buffer)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Database ripristinato con successo',
      restoredFrom: file.name,
      timestamp: new Date().toISOString(),
      duration: result.duration,
    })
  } catch (error) {
    console.error('Errore durante il ripristino:', error)
    
    return NextResponse.json(
      { 
        error: 'Errore durante il ripristino del database', 
        details: error instanceof Error ? error.message : 'Errore sconosciuto',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Accesso negato' }, { status: 403 })
    }

    // Restituisci informazioni sui backup disponibili
    const backups = await BackupService.listBackups()
    const stats = await BackupService.getBackupStats()

    return NextResponse.json({
      backups,
      stats,
    })
  } catch (error) {
    console.error('Errore nel recupero dei backup di sicurezza:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero dei backup di sicurezza' },
      { status: 500 }
    )
  }
}