import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    // Verifica ruolo admin
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Accesso negato' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      format = 'excel', 
      filters = {},
      includeMetadata = true,
      dateRange = 'all'
    } = body;

    // Costruisci filtri per query
    const whereConditions = buildWhereConditions(filters);

    // Recupera dati per export
    const events = await prisma.productionEvent.findMany({
      where: whereConditions,
      orderBy: { timestamp: 'desc' },
      take: 10000, // Limite per performance
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        odl: {
          select: {
            id: true,
            odlNumber: true,
            status: true,
            part: {
              select: {
                partNumber: true,
                description: true
              }
            }
          }
        }
      }
    });

    // Trasforma dati per export
    const exportData = events.map(event => ({
      'Data/Ora': event.timestamp.toLocaleString('it-IT'),
      'Tipo Evento': event.eventType,
      'Categoria': getCategoryFromEventType(event.eventType),
      'Livello': getLevelFromEventType(event.eventType),
      'Descrizione': event.notes || '',
      'Utente': event.user?.name || 'Sistema',
      'Email Utente': event.user?.email || '',
      'Ruolo': event.user?.role || '',
      'Reparto': event.department?.name || '',
      'Tipo Reparto': event.department?.type || '',
      'ODL': event.odl?.odlNumber || '',
      'Part Number': event.odl?.part?.partNumber || '',
      'Descrizione Parte': event.odl?.part?.description || '',
      'Stato ODL': event.odl?.status || '',
      'Durata (min)': event.duration || '',
      'ID Evento': event.id
    }));

    // Genera export basato sul formato richiesto
    switch (format.toLowerCase()) {
      case 'excel':
        return await generateExcelExport(exportData, filters, includeMetadata);
      case 'csv':
        return await generateCSVExport(exportData, filters);
      case 'pdf':
        return await generatePDFExport(exportData, filters, includeMetadata);
      default:
        return NextResponse.json({ error: 'Formato non supportato' }, { status: 400 });
    }
  } catch (error) {
    console.error('Errore nell\'export audit:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// Funzioni helper
function buildWhereConditions(filters: any) {
  const whereConditions: any = {};

  if (filters.search) {
    whereConditions.OR = [
      { description: { contains: filters.search, mode: 'insensitive' } },
      { user: { name: { contains: filters.search, mode: 'insensitive' } } },
      { user: { email: { contains: filters.search, mode: 'insensitive' } } }
    ];
  }

  if (filters.userId) {
    whereConditions.userId = filters.userId;
  }

  if (filters.eventType) {
    whereConditions.eventType = filters.eventType;
  }

  if (filters.department) {
    whereConditions.departmentId = filters.department;
  }

  if (filters.dateFrom || filters.dateTo) {
    whereConditions.timestamp = {};
    if (filters.dateFrom) {
      whereConditions.timestamp.gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      whereConditions.timestamp.lte = new Date(filters.dateTo);
    }
  }

  return whereConditions;
}

function getCategoryFromEventType(eventType: string): string {
  const categoryMap: { [key: string]: string } = {
    'ENTRY': 'PRODUCTION',
    'EXIT': 'PRODUCTION',
    'TRANSFER': 'PRODUCTION',
    'QR_SCAN': 'PRODUCTION',
    'ODL_CREATE': 'ODL_MANAGEMENT',
    'ODL_UPDATE': 'ODL_MANAGEMENT',
    'ODL_DELETE': 'ODL_MANAGEMENT',
    'USER_LOGIN': 'AUTHENTICATION',
    'USER_LOGOUT': 'AUTHENTICATION',
    'FAILED_LOGIN': 'AUTHENTICATION',
    'PASSWORD_RESET': 'AUTHENTICATION',
    'SYSTEM_ERROR': 'SYSTEM',
    'CONFIG_CHANGE': 'SYSTEM'
  };
  return categoryMap[eventType] || 'OTHER';
}

function getLevelFromEventType(eventType: string): string {
  const levelMap: { [key: string]: string } = {
    'ENTRY': 'INFO',
    'EXIT': 'INFO',
    'TRANSFER': 'INFO',
    'QR_SCAN': 'INFO',
    'ODL_CREATE': 'INFO',
    'ODL_UPDATE': 'WARNING',
    'ODL_DELETE': 'ERROR',
    'USER_LOGIN': 'INFO',
    'USER_LOGOUT': 'INFO',
    'FAILED_LOGIN': 'WARNING',
    'PASSWORD_RESET': 'WARNING',
    'SYSTEM_ERROR': 'ERROR',
    'CONFIG_CHANGE': 'WARNING'
  };
  return levelMap[eventType] || 'INFO';
}

async function generateExcelExport(data: any[], filters: any, includeMetadata: boolean) {
  const wb = XLSX.utils.book_new();
  
  // Foglio principale con dati
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Eventi Audit');
  
  // Foglio metadati se richiesto
  if (includeMetadata) {
    const metadata = [
      ['Export generato il', new Date().toLocaleString('it-IT')],
      ['Numero eventi', data.length],
      ['Filtri applicati', JSON.stringify(filters, null, 2)],
      ['Utente export', 'Admin'],
      ['Versione sistema', '1.0']
    ];
    const wsMetadata = XLSX.utils.aoa_to_sheet(metadata);
    XLSX.utils.book_append_sheet(wb, wsMetadata, 'Metadati');
  }
  
  // Genera buffer Excel
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  
  const filename = `audit_export_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  return new NextResponse(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache'
    }
  });
}

async function generateCSVExport(data: any[], filters: any) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Eventi');
  
  const csvBuffer = XLSX.write(wb, { bookType: 'csv', type: 'buffer' });
  
  const filename = `audit_export_${new Date().toISOString().split('T')[0]}.csv`;
  
  return new NextResponse(csvBuffer, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache'
    }
  });
}

async function generatePDFExport(data: any[], filters: any, includeMetadata: boolean) {
  // Implementazione PDF semplificata
  // In produzione utilizzare jsPDF con jsPDF-AutoTable
  
  const reportData = {
    title: 'Report Eventi Audit',
    generatedAt: new Date().toLocaleString('it-IT'),
    totalEvents: data.length,
    filters: filters,
    events: data.slice(0, 100), // Limita per PDF
    metadata: includeMetadata ? {
      system: 'MES Aerospazio',
      version: '1.0',
      exportedBy: 'Admin'
    } : null
  };
  
  // Per ora ritorniamo JSON che sarà convertito in PDF dal frontend
  const filename = `audit_export_${new Date().toISOString().split('T')[0]}.json`;
  
  return new NextResponse(JSON.stringify(reportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache'
    }
  });
}

// Endpoint GET per preview dati export
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Accesso negato' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      search: searchParams.get('search') || '',
      userId: searchParams.get('userId') || '',
      eventType: searchParams.get('eventType') || '',
      department: searchParams.get('department') || '',
      dateFrom: searchParams.get('dateFrom') || '',
      dateTo: searchParams.get('dateTo') || ''
    };

    const whereConditions = buildWhereConditions(filters);
    
    const totalEvents = await prisma.productionEvent.count({
      where: whereConditions
    });

    const preview = await prisma.productionEvent.findMany({
      where: whereConditions,
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        department: { select: { name: true, type: true } },
        odl: { 
          select: { 
            odlNumber: true, 
            part: { select: { partNumber: true } } 
          } 
        }
      }
    });

    return NextResponse.json({
      totalEvents,
      preview,
      filters,
      availableFormats: ['excel', 'csv', 'pdf'],
      estimatedSize: Math.round(totalEvents * 0.5) // KB approssimativo
    });
  } catch (error) {
    console.error('Errore nella preview export:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}