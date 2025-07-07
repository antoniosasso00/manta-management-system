import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { PartAutoclaveService } from '@/domains/autoclave/services/PartAutoclaveService';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    await PartAutoclaveService.delete(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Errore nell\'eliminazione configurazione:', error);
    return NextResponse.json(
      { error: 'Errore nell\'eliminazione della configurazione' },
      { status: 500 }
    );
  }
}