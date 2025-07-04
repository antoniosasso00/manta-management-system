import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'profiles');

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Nessun file fornito' }, { status: 400 });
    }

    // Validazione tipo file
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: 'Tipo file non supportato',
        allowedTypes: ALLOWED_TYPES
      }, { status: 400 });
    }

    // Validazione dimensione file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: 'File troppo grande',
        maxSize: `${MAX_FILE_SIZE / (1024 * 1024)}MB`
      }, { status: 400 });
    }

    // Crea directory upload se non exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Genera nome file unico
    const fileExtension = file.name.split('.').pop();
    const fileName = `${session.user.id}_${Date.now()}.${fileExtension}`;
    const filePath = join(UPLOAD_DIR, fileName);
    const publicPath = `/uploads/profiles/${fileName}`;

    // Salva file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Aggiorna database con nuovo path foto
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        image: publicPath,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        updatedAt: true
      }
    });

    // Rimuovi foto precedente se esistente
    // TODO: Implementare pulizia file vecchi in background job

    return NextResponse.json({
      success: true,
      user: updatedUser,
      photoUrl: publicPath,
      message: 'Foto profilo aggiornata con successo'
    });
  } catch (error) {
    console.error('Errore nell\'upload foto profilo:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    // Rimuovi foto profilo dal database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        image: null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        updatedAt: true
      }
    });

    // TODO: Rimuovi file fisico in background job

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Foto profilo rimossa con successo'
    });
  } catch (error) {
    console.error('Errore nella rimozione foto profilo:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        updatedAt: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    return NextResponse.json({
      user,
      hasPhoto: !!user.image,
      photoUrl: user.image,
      uploadLimits: {
        maxSize: MAX_FILE_SIZE,
        allowedTypes: ALLOWED_TYPES
      }
    });
  } catch (error) {
    console.error('Errore nel recupero informazioni foto profilo:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}