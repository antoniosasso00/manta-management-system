import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth-node'
import { existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { z } from 'zod'

const browseRequestSchema = z.object({
  path: z.string().optional().default('/home')
})

interface FileSystemItem {
  name: string
  path: string
  type: 'file' | 'directory'
  isExcel?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Solo admin può esplorare il filesystem
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { path } = browseRequestSchema.parse(body)

    if (!existsSync(path)) {
      return NextResponse.json(
        { error: 'Percorso non trovato' },
        { status: 404 }
      )
    }

    const items: FileSystemItem[] = []

    try {
      const files = readdirSync(path)
      
      // Aggiungi cartella parent (se non siamo nella root)
      if (path !== '/') {
        items.push({
          name: '..',
          path: join(path, '..'),
          type: 'directory'
        })
      }

      for (const file of files) {
        try {
          const fullPath = join(path, file)
          const stats = statSync(fullPath)
          
          // Salta file/cartelle nascoste (che iniziano con .)
          if (file.startsWith('.')) continue

          const item: FileSystemItem = {
            name: file,
            path: fullPath,
            type: stats.isDirectory() ? 'directory' : 'file'
          }

          // Marca i file Excel e CSV
          if (item.type === 'file') {
            item.isExcel = file.toLowerCase().endsWith('.xlsx') || 
                          file.toLowerCase().endsWith('.xls') ||
                          file.toLowerCase().endsWith('.csv')
          }

          items.push(item)
          
        } catch (error) {
          // Salta file che non possono essere letti (permessi, ecc.)
          console.warn(`Impossibile leggere ${file}:`, error)
          continue
        }
      }

      // Ordina: cartelle prima, poi file, tutto alfabetico
      items.sort((a, b) => {
        if (a.name === '..') return -1
        if (b.name === '..') return 1
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })

      return NextResponse.json({
        success: true,
        currentPath: path,
        items
      })

    } catch (error) {
      console.error('Errore lettura cartella:', error)
      return NextResponse.json(
        { error: 'Impossibile leggere la cartella' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Errore browse filesystem:', error)
    
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