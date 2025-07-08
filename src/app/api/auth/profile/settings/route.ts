import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { UserService } from '@/domains/user/services/UserService';
import { z } from 'zod';

const settingsSchema = z.object({
  ui: z.object({
    theme: z.enum(['light', 'dark', 'auto']).optional(),
  }).optional(),
});

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const user = await UserService.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    // Ritorna le preferenze utente (settings è un campo JSON in Prisma)
    return NextResponse.json({
      settings: user.settings || { ui: { theme: 'auto' } }
    });

  } catch (error) {
    console.error('Errore recupero impostazioni:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = settingsSchema.parse(body);

    // Recupera le impostazioni attuali
    const currentUser = await UserService.findById(session.user.id);
    const currentSettings = (currentUser?.settings as any) || {};

    // Merge delle nuove impostazioni con quelle esistenti
    const updatedSettings = {
      ...currentSettings,
      ui: {
        ...currentSettings.ui,
        ...validatedData.ui,
      },
    };

    // Aggiorna le impostazioni utente
    await UserService.updateSettings(session.user.id, updatedSettings);

    return NextResponse.json({
      message: 'Impostazioni aggiornate con successo',
      settings: updatedSettings
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati non validi', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Errore aggiornamento impostazioni:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}