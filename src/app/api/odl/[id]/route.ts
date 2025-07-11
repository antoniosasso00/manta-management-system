import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-node'
import { ODLService } from '@/domains/core/services/ODLService'
import { updateODLSchema } from '@/domains/core/schemas/odl.schema'
import { ZodError } from 'zod'

export const runtime = 'nodejs'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const odl = await ODLService.findById((await params).id)
    
    if (!odl) {
      return NextResponse.json({ error: 'ODL not found' }, { status: 404 })
    }

    return NextResponse.json(odl)
  } catch (error) {
    console.error('Error fetching ODL:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin or supervisor role
    if (!['ADMIN', 'SUPERVISOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateODLSchema.parse({ ...body, id: (await params).id })
    
    const odl = await ODLService.update((await params).id, validatedData)

    return NextResponse.json(odl)
  } catch (error) {
    console.error('Error updating ODL:', error)
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      if (error.message === 'ODL not found') {
        return NextResponse.json({ error: 'ODL non trovato' }, { status: 404 })
      }
      if (error.message.includes('already exists')) {
        return NextResponse.json({ error: 'ODL con questo numero già esistente' }, { status: 409 })
      }
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: 'Risorsa non trovata' }, { status: 404 })
      }
      if (error.message.includes('modified by another operation')) {
        return NextResponse.json({ 
          error: 'ODL modificato da un\'altra operazione. Aggiorna la pagina e riprova.' 
        }, { status: 409 })
      }
    }

    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await ODLService.delete((await params).id)

    return NextResponse.json({ message: 'ODL deleted successfully' })
  } catch (error) {
    console.error('Error deleting ODL:', error)
    
    if (error instanceof Error) {
      if (error.message === 'ODL not found') {
        return NextResponse.json({ error: 'ODL non trovato' }, { status: 404 })
      }
      if (error.message.includes('production events')) {
        return NextResponse.json({ 
          error: 'ODL contiene eventi di produzione registrati' 
        }, { status: 409 })
      }
      if (error.message.includes('non-conformities')) {
        return NextResponse.json({ 
          error: 'ODL contiene non-conformità registrate' 
        }, { status: 409 })
      }
      if (error.message.includes('quality certificates')) {
        return NextResponse.json({ 
          error: 'ODL contiene certificati di qualità' 
        }, { status: 409 })
      }
      if (error.message.includes('quality inspections')) {
        return NextResponse.json({ 
          error: 'ODL contiene ispezioni di qualità' 
        }, { status: 409 })
      }
    }

    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}