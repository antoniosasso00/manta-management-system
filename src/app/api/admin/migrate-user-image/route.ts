import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Verifica se la colonna image esiste già
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'image'
        AND table_schema = 'public'
      ) as column_exists;
    ` as Array<{ column_exists: boolean }>

    if (result[0]?.column_exists) {
      return NextResponse.json(
        { message: 'Colonna image già esistente nella tabella users' },
        { status: 200 }
      )
    }

    // Aggiunge la colonna image se non esiste
    await prisma.$executeRaw`
      ALTER TABLE "users" ADD COLUMN "image" TEXT;
    `

    return NextResponse.json(
      { message: 'Colonna image aggiunta con successo alla tabella users' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Errore durante migrazione:', error)
    
    return NextResponse.json(
      { 
        message: 'Errore durante la migrazione',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}