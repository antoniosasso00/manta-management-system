import { NextRequest, NextResponse } from 'next/server'
import { QRGenerator, QRHelper } from '@/utils/qr-validation'
import { prisma } from '@/lib/prisma'

/**
 * GET endpoint per generare QR Code di test
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const odlId = searchParams.get('odlId')
    
    if (!odlId) {
      return NextResponse.json({ error: 'ODL ID richiesto' }, { status: 400 })
    }

    // Trova ODL nel database
    const odl = await prisma.oDL.findUnique({
      where: { id: odlId },
      include: { part: true }
    })

    if (!odl) {
      return NextResponse.json({ error: 'ODL non trovato' }, { status: 404 })
    }

    // Genera QR Code
    const qrData = QRGenerator.generateODLQR({
      id: odl.id,
      partNumber: odl.part.partNumber,
      priority: 'NORMAL'
    })

    const qrString = QRGenerator.toQRString(qrData)

    // Test validazione
    const validation = QRHelper.validateQRCode(qrString)

    return NextResponse.json({
      success: true,
      odl: {
        id: odl.id,
        odlNumber: odl.odlNumber,
        partNumber: odl.part.partNumber,
        status: odl.status
      },
      qrCode: {
        data: qrData,
        string: qrString,
        validation
      }
    })

  } catch (error) {
    console.error('Errore generazione QR test:', error)
    
    return NextResponse.json({ 
      error: 'Errore interno del server' 
    }, { status: 500 })
  }
}

/**
 * POST endpoint per testare scansione QR
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { qrCode } = body

    if (!qrCode) {
      return NextResponse.json({ error: 'QR Code richiesto' }, { status: 400 })
    }

    // Test validazione
    const validation = QRHelper.validateQRCode(qrCode)
    
    // Test rate limiting
    const rateLimit = QRHelper.checkRateLimit(qrCode, 'test-user')

    return NextResponse.json({
      success: true,
      validation,
      rateLimit,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Errore test QR:', error)
    
    return NextResponse.json({ 
      error: 'Errore interno del server' 
    }, { status: 500 })
  }
}