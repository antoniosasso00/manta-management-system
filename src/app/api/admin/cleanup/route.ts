import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { cleanupTasks } from '@/lib/cleanup-tasks'

export const runtime = 'nodejs'

export async function POST() {
  try {
    await requireAdmin()

    const result = await cleanupTasks.runManualCleanup()

    return NextResponse.json({
      message: 'Cleanup completato con successo',
      result
    })

  } catch (error) {
    console.error('Manual cleanup error:', error)
    return NextResponse.json(
      { error: 'Errore durante il cleanup' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    await requireAdmin()

    // Return cleanup status/info
    return NextResponse.json({
      message: 'Cleanup tasks are running',
      info: {
        tokenCleanup: 'Runs every hour',
        sessionCleanup: 'Runs every 24 hours',
        lastRun: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Cleanup status error:', error)
    return NextResponse.json(
      { error: 'Errore nel recupero stato cleanup' },
      { status: 500 }
    )
  }
}