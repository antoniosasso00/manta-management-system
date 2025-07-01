import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "./prisma"
import { redisRateLimiter, getClientIdentifier, RATE_LIMIT_CONFIGS } from "./rate-limit-redis"
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

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Rate limiting based on IP/User-Agent
        const clientId = await getClientIdentifier(req as Request)
        const rateLimitResult = await redisRateLimiter.checkLimit(clientId, RATE_LIMIT_CONFIGS.AUTH_LOGIN)
        
        if (!rateLimitResult.allowed) {
          console.warn(`Rate limit exceeded for client: ${clientId}`)
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        })

        if (!user || !user.password || !user.isActive) {
          // Failed login - don't reset rate limit
          return null
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          // Failed login - don't reset rate limit
          return null
        }

        // Successful login - reset rate limit
        await redisRateLimiter.reset(clientId, RATE_LIMIT_CONFIGS.AUTH_LOGIN.keyPrefix)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          departmentId: user.departmentId,
          departmentRole: user.departmentRole,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.departmentId = user.departmentId
        token.departmentRole = user.departmentRole
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.departmentId = token.departmentId as string | null
        session.user.departmentRole = token.departmentRole as DepartmentRole | null
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
})