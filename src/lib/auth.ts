// Edge runtime compatible auth - just exports mock functions for middleware
import type { UserRole, DepartmentRole } from "@prisma/client"

declare module "next-auth" {
  interface User {
    role: UserRole
    departmentId: string | null
    departmentRole: DepartmentRole | null
  }
  
  interface Session {
    user: {
      id: string
      email: string
      name: string | null
      role: UserRole
      departmentId: string | null
      departmentRole: DepartmentRole | null
    }
  }
}

// Edge runtime auth function - validates session tokens from cookies
export const auth = async (req: any) => {
  // Check for session cookies (both dev and production names)
  const sessionToken = req.cookies?.get('authjs.session-token')?.value || 
                      req.cookies?.get('__Secure-authjs.session-token')?.value
  
  if (!sessionToken) {
    return null
  }

  // For edge runtime, we only do basic token presence validation
  // Full JWT verification happens in auth-node.ts for API routes
  return {
    user: {
      // Minimal user object for edge runtime
      authenticated: true
    }
  }
}

// Re-export handlers from auth-node for API routes
export { handlers, signIn, signOut } from './auth-node'