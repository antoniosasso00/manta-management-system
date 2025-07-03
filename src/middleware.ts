import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { corsHandler, corsConfigs } from "@/lib/cors-config"

export default auth((req) => {
  // Gestisci CORS per tutte le richieste API
  if (req.nextUrl.pathname.startsWith('/api/')) {
    // Determina configurazione CORS basata sul path
    let corsConfig = corsConfigs.development;
    
    if (process.env.NODE_ENV === 'production') {
      if (req.nextUrl.pathname.startsWith('/api/admin/')) {
        corsConfig = corsConfigs.admin;
      } else if (req.nextUrl.pathname.startsWith('/api/production/')) {
        corsConfig = corsConfigs.production;
      } else {
        corsConfig = corsConfigs.public;
      }
    }
    
    // Applica CORS
    const corsMiddleware = corsHandler(corsConfig);
    const corsResponse = corsMiddleware(req);
    
    if (corsResponse) {
      return corsResponse;
    }
  }

  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith("/login") || 
                     req.nextUrl.pathname.startsWith("/register") ||
                     req.nextUrl.pathname.startsWith("/forgot-password") ||
                     req.nextUrl.pathname.startsWith("/reset-password")

  // Allow auth pages when not logged in
  if (isAuthPage) {
    if (isLoggedIn && !req.nextUrl.pathname.startsWith("/reset-password")) {
      return NextResponse.redirect(new URL("/", req.url))
    }
    return NextResponse.next()
  }

  // Check if user is logged in for protected routes
  if (!isLoggedIn) {
    let from = req.nextUrl.pathname
    if (req.nextUrl.search) {
      from += req.nextUrl.search
    }

    return NextResponse.redirect(
      new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
    )
  }

  // Check if user account is active
  if (req.auth?.user && 'isActive' in req.auth.user && !req.auth.user.isActive) {
    return NextResponse.redirect(new URL("/login?reason=account-disabled", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - api/health (health check endpoint)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api/auth|api/health|test|simple-test|_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
}