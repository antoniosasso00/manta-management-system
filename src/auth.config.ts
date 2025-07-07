import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      // Temporarily disable auth middleware to debug
      console.log('[AUTH DEBUG] Path:', nextUrl.pathname, 'User:', !!auth?.user)
      return true
    },
  },
  providers: [],
} satisfies NextAuthConfig