import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-node'
import { ExcelSyncService } from '@/services/excel-sync.service'
import { z } from 'zod'

export const runtime = 'nodejs'

const syncRequestSchema = z.object({
  filePath: z.string().min(1, 'Percorso file richiesto'),
  action: z.enum(['analyze', 'sync'])
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Solo admin può sincronizzare
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { filePath, action } = syncRequestSchema.parse(body)

    if (action === 'analyze') {
      // Analizza la struttura del file
      const result = ExcelSyncService.analyzeExcelStructure(filePath)
      return NextResponse.json(result)
    } else {
      // Esegue la sincronizzazione
      const result = await ExcelSyncService.syncPartsFromExcel(filePath)
      return NextResponse.json(result)
    }

  } catch (error) {
    console.error('Errore sincronizzazione Excel:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}