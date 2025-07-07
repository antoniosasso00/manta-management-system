import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-node';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;
    const days = parseInt(searchParams.get('days') || '7');

    // Genera array degli ultimi N giorni
    const chartData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      // Conta ODL completati dall'utente in quel giorno
      const completedODL = await prisma.oDL.count({
        where: {
          status: 'COMPLETED',
          updatedAt: {
            gte: date,
            lt: nextDay
          },
          events: {
            some: {
              userId: userId,
              eventType: 'EXIT',
              timestamp: {
                gte: date,
                lt: nextDay
              }
            }
          }
        }
      });

      chartData.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('it-IT', { weekday: 'short' }),
        completedODL
      });
    }

    return NextResponse.json(chartData);

  } catch (error) {
    console.error('Chart API error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}