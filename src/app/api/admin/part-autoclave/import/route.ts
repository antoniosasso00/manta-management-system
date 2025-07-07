import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { PartAutoclaveService } from '@/domains/autoclave/services/PartAutoclaveService'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { auditHelpers } from '@/lib/audit-logger'

export const runtime = 'nodejs'

const importPartAutoclaveSchema = z.object({
  partNumber: z.string().min(1, "Part Number obbligatorio"),
  curingCycleName: z.string().min(1, "Nome ciclo cura obbligatorio"),
  vacuumLines: z.number().int().min(0, "Valvole deve essere >= 0"),
  setupTime: z.number().int().min(0).optional(),
  loadPosition: z.string().optional(),
  notes: z.string().optional()
})

const bulkImportSchema = z.object({
  configs: z.array(importPartAutoclaveSchema),
  skipDuplicates: z.boolean().default(true)
})

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin()

    const body = await request.json()
    const { configs, skipDuplicates } = bulkImportSchema.parse(body)

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as Array<{ row: number; partNumber: string; error: string }>
    }

    // Get all parts and curing cycles for lookup
    const parts = await prisma.part.findMany({
      select: { id: true, partNumber: true }
    })
    const partMap = new Map(parts.map(p => [p.partNumber, p.id]))

    const curingCycles = await prisma.curingCycle.findMany({
      select: { id: true, name: true }
    })
    const cycleMap = new Map(curingCycles.map(c => [c.name, c.id]))

    for (let i = 0; i < configs.length; i++) {
      const configData = configs[i]
      
      try {
        // Validate part exists
        const partId = partMap.get(configData.partNumber)
        if (!partId) {
          results.errors.push({
            row: i + 1,
            partNumber: configData.partNumber,
            error: `Part Number '${configData.partNumber}' non trovato`
          })
          continue
        }

        // Validate curing cycle exists
        const curingCycleId = cycleMap.get(configData.curingCycleName)
        if (!curingCycleId) {
          results.errors.push({
            row: i + 1,
            partNumber: configData.partNumber,
            error: `Ciclo cura '${configData.curingCycleName}' non trovato`
          })
          continue
        }

        // Check if configuration already exists
        const existingConfig = await prisma.partAutoclave.findUnique({
          where: { partId }
        })

        if (existingConfig) {
          if (skipDuplicates) {
            // Update existing configuration
            await PartAutoclaveService.upsert({
              partId,
              curingCycleId,
              vacuumLines: configData.vacuumLines,
              setupTime: configData.setupTime,
              loadPosition: configData.loadPosition,
              notes: configData.notes
            })
            results.updated++
          } else {
            results.skipped++
          }
        } else {
          // Create new configuration
          await PartAutoclaveService.upsert({
            partId,
            curingCycleId,
            vacuumLines: configData.vacuumLines,
            setupTime: configData.setupTime,
            loadPosition: configData.loadPosition,
            notes: configData.notes
          })
          results.created++
        }

      } catch (error) {
        console.error(`Error creating/updating config for ${configData.partNumber}:`, error)
        results.errors.push({
          row: i + 1,
          partNumber: configData.partNumber,
          error: 'Errore durante la creazione/aggiornamento'
        })
      }
    }

    // Log audit action
    await auditHelpers.logDataImport(
      adminUser.user.id, 
      adminUser.user.email,
      'PART_AUTOCLAVE_IMPORT',
      `Import di ${configs.length} configurazioni: ${results.created} create, ${results.updated} aggiornate, ${results.skipped} saltate, ${results.errors.length} errori`,
      request
    )

    return NextResponse.json({
      message: `Import completato: ${results.created} create, ${results.updated} aggiornate, ${results.skipped} saltate, ${results.errors.length} errori`,
      results
    })

  } catch (error) {
    console.error('Import part autoclave config error:', error)
    
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