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

// Mock auth function for edge runtime compatibility
export const auth = (callback: (req: any) => any) => {
  return (req: any) => {
    // Simple check - just pass through for edge runtime
    return callback(req)
  }
}

// Export placeholders for API routes - they should use auth-node.ts
export const handlers = { GET: null, POST: null }
export const signIn = null
export const signOut = null