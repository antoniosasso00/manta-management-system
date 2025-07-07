import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { AutoclaviBatchService } from '@/services/autoclavi-batch.service';

export const runtime = 'nodejs';

// GET /api/autoclavi/batches/by-odl/[odlId] - Trova batch contenente un ODL specifico
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ odlId: string }> }
) {
  try {
    const params = await context.params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const batch = await AutoclaviBatchService.findBatchByOdl(params.odlId);

    if (!batch) {
      return NextResponse.json(
        { error: 'ODL non trovato in nessun batch' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      batch,
    });
  } catch (error) {
    console.error('Errore ricerca batch per ODL:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}