import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default async function middleware(req: NextRequest) {
  // Skip API routes and static files
  if (req.nextUrl.pathname.startsWith('/api/') ||
      req.nextUrl.pathname.startsWith('/_next/') ||
      req.nextUrl.pathname.includes('.')) {
    return NextResponse.next()
  }

  // Check for session cookies
  const sessionToken = req.cookies.get('authjs.session-token')?.value || 
                      req.cookies.get('__Secure-authjs.session-token')?.value

  const isAuthPage = req.nextUrl.pathname === '/login' || 
                     req.nextUrl.pathname === '/register' ||
                     req.nextUrl.pathname.startsWith('/forgot-password') ||
                     req.nextUrl.pathname.startsWith('/reset-password')

  // Root path - redirect based on auth status
  if (req.nextUrl.pathname === '/') {
    if (sessionToken) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    } else {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // Auth pages - redirect if already logged in
  if (isAuthPage) {
    if (sessionToken && req.nextUrl.pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Protected pages - require authentication
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}