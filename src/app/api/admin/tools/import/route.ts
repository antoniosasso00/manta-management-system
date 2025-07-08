import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { ToolService } from '@/domains/core/services/ToolService'
import { z } from 'zod'
import { auditHelpers } from '@/lib/audit-logger'

export const runtime = 'nodejs'

const importToolSchema = z.object({
  toolPartNumber: z.string().min(1, "Part number tool obbligatorio"),
  description: z.string().optional(),
  base: z.number().positive("Base deve essere positiva"),
  height: z.number().positive("Altezza deve essere positiva"),
  weight: z.number().positive().optional(),
  material: z.string().optional(),
  isActive: z.boolean().default(true)
})

const bulkImportSchema = z.object({
  tools: z.array(importToolSchema),
  skipDuplicates: z.boolean().default(true)
})

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin()

    const body = await request.json()
    const { tools, skipDuplicates } = bulkImportSchema.parse(body)

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as Array<{ row: number; toolPartNumber: string; error: string }>
    }

    for (let i = 0; i < tools.length; i++) {
      const toolData = tools[i]
      
      try {
        // Check if tool part number already exists
        const existingTool = await ToolService.findByPartNumber(toolData.toolPartNumber)

        if (existingTool) {
          if (skipDuplicates) {
            results.skipped++
            continue
          } else {
            results.errors.push({
              row: i + 1,
              toolPartNumber: toolData.toolPartNumber,
              error: 'Part Number già esistente'
            })
            continue
          }
        }

        // Create tool
        await ToolService.create({
          toolPartNumber: toolData.toolPartNumber,
          description: toolData.description || undefined,
          base: toolData.base,
          height: toolData.height,
          weight: toolData.weight || undefined,
          material: toolData.material || undefined,
          isActive: toolData.isActive,
        })

        results.created++

      } catch (error) {
        console.error(`Error creating tool ${toolData.toolPartNumber}:`, error)
        results.errors.push({
          row: i + 1,
          toolPartNumber: toolData.toolPartNumber,
          error: 'Errore durante la creazione'
        })
      }
    }

    // Log audit action
    await auditHelpers.logDataImport(
      adminUser.user.id, 
      adminUser.user.email,
      'TOOLS_IMPORT',
      `Import di ${tools.length} tools: ${results.created} creati, ${results.skipped} saltati, ${results.errors.length} errori`,
      request
    )

    return NextResponse.json({
      message: `Import completato: ${results.created} creati, ${results.skipped} saltati, ${results.errors.length} errori`,
      results
    })

  } catch (error) {
    console.error('Import tools error:', error)
    
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