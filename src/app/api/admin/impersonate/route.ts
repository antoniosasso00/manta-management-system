import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export async function POST(req: Request) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const body = await req.json()
    const { userId, role, departmentId } = body

    let impersonatedUser
    let impersonatedDepartment = null

    if (userId) {
      // Impersona utente esistente
      impersonatedUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { department: true }
      })

      if (!impersonatedUser) {
        return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
      }

      impersonatedDepartment = impersonatedUser.department
    } else {
      // Crea sessione con ruolo personalizzato
      impersonatedUser = {
        id: `impersonated-${Date.now()}`,
        name: `Test ${role}`,
        email: `test-${role.toLowerCase()}@mantaaero.com`,
        role: role,
        departmentId: departmentId || null
      }

      if (departmentId) {
        impersonatedDepartment = await prisma.department.findUnique({
          where: { id: departmentId }
        })
      }
    }

    // Crea token di impersonificazione
    const impersonationToken = jwt.sign(
      {
        user: {
          id: impersonatedUser.id,
          name: impersonatedUser.name,
          email: impersonatedUser.email,
          role: impersonatedUser.role,
          departmentId: impersonatedUser.departmentId,
          department: impersonatedDepartment ? {
            id: impersonatedDepartment.id,
            name: impersonatedDepartment.name
          } : null
        },
        isImpersonating: true,
        originalUserId: session.user.id,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 ore
      },
      process.env.AUTH_SECRET!
    )

    // Salva token nei cookie
    const cookieStore = await cookies()
    cookieStore.set('impersonation-token', impersonationToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 ore
    })

    return NextResponse.json({ 
      success: true,
      user: {
        id: impersonatedUser.id,
        name: impersonatedUser.name,
        email: impersonatedUser.email,
        role: impersonatedUser.role,
        department: impersonatedDepartment
      }
    })
  } catch (error) {
    console.error('Error impersonating user:', error)
    return NextResponse.json({ error: 'Errore durante impersonificazione' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Rimuovi cookie di impersonificazione
    const cookieStore = await cookies()
    cookieStore.delete('impersonation-token')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error stopping impersonation:', error)
    return NextResponse.json({ error: 'Errore durante stop impersonificazione' }, { status: 500 })
  }
}