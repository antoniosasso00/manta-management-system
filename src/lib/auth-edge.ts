// Simple edge-compatible auth check
export function getSessionFromCookie(cookieHeader: string) {
  // Extract session token from cookie
  const sessionToken = cookieHeader
    .split(';')
    .find(c => c.trim().startsWith('authjs.session-token=') || c.trim().startsWith('__Secure-authjs.session-token='))
    ?.split('=')[1]
  
  return sessionToken ? { sessionToken } : null
}

export function createSimpleAuthMiddleware() {
  return (req: Request) => {
    const cookieHeader = req.headers.get('cookie') || ''
    const session = getSessionFromCookie(cookieHeader)
    
    return {
      isAuthenticated: !!session,
      session
    }
  }
}