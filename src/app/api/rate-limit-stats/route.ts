import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import { getRateLimitStats } from '@/lib/rate-limit-middleware';

/**
 * API endpoint per monitorare statistiche rate limiting
 * Accessibile solo agli amministratori per monitoring e debugging
 */

export async function GET(request: NextRequest) {
  try {
    // Solo admin possono accedere alle statistiche
    await requireAdmin();

    // Ottieni statistiche rate limiting
    const stats = await getRateLimitStats();
    
    return NextResponse.json({
      ...stats,
      endpoint: '/api/rate-limit-stats',
      requestInfo: {
        ip: request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Rate limit stats error:', error);
    return NextResponse.json(
      { error: 'Errore durante recupero statistiche' },
      { status: 500 }
    );
  }
}