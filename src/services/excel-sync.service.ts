import * as XLSX from 'xlsx'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { PartService } from '@/domains/core/services/PartService'
import { CreatePartInput } from '@/domains/core/schemas/part'

export interface SyncResult {
  success: boolean
  message: string
  created: number
  updated: number
  skipped: number
  errors: string[]
  totalProcessed: number
}

export interface ExcelPartRow {
  partNumber: string
  description: string
}

export class ExcelSyncService {
  
  /**
   * Sincronizza le parti da un file Excel
   */
  static async syncPartsFromExcel(filePath: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      message: '',
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      totalProcessed: 0
    }

    try {
      // Verifica che il file esista
      if (!existsSync(filePath)) {
        result.message = `File non trovato: ${filePath}`
        return result
      }

      let rawData: unknown[] = []

      // Gestisce file CSV e Excel
      if (filePath.toLowerCase().endsWith('.csv')) {
        // Legge file CSV
        const csvContent = readFileSync(filePath, 'utf-8')
        const lines = csvContent.split('\n').filter(line => line.trim())
        rawData = lines.map(line => line.split(',').map(cell => cell.trim()))
      } else {
        // Legge file Excel
        const workbook = XLSX.readFile(filePath)
        const worksheet = workbook.Sheets[workbook.SheetNames[0]] // Prima sheet
        
        if (!worksheet) {
          result.message = 'Nessun foglio di lavoro trovato nel file Excel'
          return result
        }

        // Converte in JSON
        rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      }
      
      if (rawData.length === 0) {
        result.message = 'File Excel vuoto'
        return result
      }

      // Analizza l'header per trovare le colonne
      const headerRow = rawData[0] as string[]
      const partNumberCol = this.findColumnIndex(headerRow, ['pn', 'part number', 'part_number', 'partnumber', 'codice', 'numero parte'])
      const descriptionCol = this.findColumnIndex(headerRow, ['descrizione', 'description', 'desc', 'nome'])

      if (partNumberCol === -1) {
        result.message = 'Colonna "Part Number" non trovata. Colonne disponibili: ' + headerRow.join(', ')
        return result
      }

      if (descriptionCol === -1) {
        result.message = 'Colonna "Descrizione" non trovata. Colonne disponibili: ' + headerRow.join(', ')
        return result
      }

      console.log(`Trovate colonne: Part Number=${partNumberCol}, Descrizione=${descriptionCol}`)

      // Processa le righe dati (saltando l'header)
      const dataRows = rawData.slice(1) as string[][]
      
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i]
        result.totalProcessed++

        try {
          const partNumber = row[partNumberCol]?.toString().trim()
          const description = row[descriptionCol]?.toString().trim()

          // Validazione dati
          if (!partNumber || !description) {
            result.errors.push(`Riga ${i + 2}: Part Number o Descrizione mancanti`)
            result.skipped++
            continue
          }

          // Verifica se la parte esiste già
          const existingPart = await PartService.findByPartNumber(partNumber)

          if (existingPart) {
            // Aggiorna solo se la descrizione è diversa
            if (existingPart.description !== description) {
              await PartService.update(existingPart.id, { description })
              result.updated++
              console.log(`Aggiornato: ${partNumber}`)
            } else {
              result.skipped++
            }
          } else {
            // Crea nuova parte
            const newPartData: CreatePartInput = {
              partNumber,
              description
            }
            await PartService.create(newPartData)
            result.created++
            console.log(`Creato: ${partNumber}`)
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto'
          result.errors.push(`Riga ${i + 2}: ${errorMessage}`)
          result.skipped++
          console.error(`Errore riga ${i + 2}:`, error)
        }
      }

      result.success = true
      result.message = `Sincronizzazione completata: ${result.created} create, ${result.updated} aggiornate, ${result.skipped} saltate`

    } catch (error) {
      console.error('Errore sincronizzazione Excel:', error)
      result.message = `Errore durante la sincronizzazione: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
      result.success = false
    }

    return result
  }

  /**
   * Cerca l'indice di una colonna nell'header
   */
  private static findColumnIndex(headerRow: string[], possibleNames: string[]): number {
    if (!headerRow) return -1
    
    for (let i = 0; i < headerRow.length; i++) {
      const header = headerRow[i]?.toString().toLowerCase().trim()
      if (possibleNames.some(name => header.includes(name.toLowerCase()))) {
        return i
      }
    }
    return -1
  }

  /**
   * Analizza la struttura di un file Excel senza processarlo
   */
  static analyzeExcelStructure(filePath: string): {
    success: boolean
    message: string
    sheets: string[]
    headers: string[]
    sampleData: unknown[][]
  } {
    const result = {
      success: false,
      message: '',
      sheets: [] as string[],
      headers: [] as string[],
      sampleData: [] as unknown[][]
    }

    try {
      if (!existsSync(filePath)) {
        result.message = `File non trovato: ${filePath}`
        return result
      }

      let rawData: unknown[] = []

      if (filePath.toLowerCase().endsWith('.csv')) {
        // Analizza file CSV
        result.sheets = ['CSV']
        const csvContent = readFileSync(filePath, 'utf-8')
        const lines = csvContent.split('\n').filter(line => line.trim())
        rawData = lines.map(line => line.split(',').map(cell => cell.trim()))
      } else {
        // Analizza file Excel
        const workbook = XLSX.readFile(filePath)
        result.sheets = workbook.SheetNames

        if (result.sheets.length === 0) {
          result.message = 'Nessun foglio di lavoro trovato'
          return result
        }

        // Analizza il primo sheet
        const worksheet = workbook.Sheets[result.sheets[0]]
        rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      }
      
      if (rawData.length > 0) {
        result.headers = rawData[0] as string[]
        result.sampleData = rawData.slice(0, 6) as unknown[][] // Prime 5 righe + header
      }

      result.success = true
      result.message = 'Analisi completata'

    } catch (error) {
      result.message = `Errore durante l'analisi: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
    }

    return result
  }

  /**
   * Trova file Excel in una cartella
   */
  static findExcelFiles(directoryPath: string): string[] {
    try {
      if (!existsSync(directoryPath)) {
        return []
      }

      const files = readdirSync(directoryPath)
      
      return files
        .filter((file: string) => 
          file.toLowerCase().endsWith('.xlsx') || 
          file.toLowerCase().endsWith('.xls') ||
          file.toLowerCase().endsWith('.csv')
        )
        .map((file: string) => join(directoryPath, file))
        
    } catch (error) {
      console.error('Errore lettura cartella:', error)
      return []
    }
  }
}