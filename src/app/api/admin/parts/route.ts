import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;

    const parts = await prisma.part.findMany({
      where: search ? {
        OR: [
          { partNumber: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      } : undefined,
      orderBy: { partNumber: 'asc' },
      select: {
        id: true,
        partNumber: true,
        description: true
      }
    });

    return NextResponse.json(parts);
  } catch (error) {
    console.error('Errore nel recupero parts:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero dei part' },
      { status: 500 }
    );
  }
}