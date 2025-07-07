import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const impersonationToken = cookieStore.get('impersonation-token')?.value
    
    if (!impersonationToken) {
      return NextResponse.json({ isImpersonating: false })
    }
    
    try {
      const decoded = jwt.verify(impersonationToken, process.env.AUTH_SECRET!) as any
      return NextResponse.json({ 
        isImpersonating: decoded.isImpersonating || false,
        originalUserId: decoded.originalUserId,
        user: decoded.user
      })
    } catch (error) {
      // Token non valido
      cookieStore.delete('impersonation-token')
      return NextResponse.json({ isImpersonating: false })
    }
  } catch (error) {
    console.error('Error checking impersonation:', error)
    return NextResponse.json({ isImpersonating: false })
  }
}