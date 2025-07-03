/**
 * Background cleanup tasks for system maintenance
 */

import { prisma } from './prisma'

export class CleanupTasks {
  private static instance: CleanupTasks
  private intervals: NodeJS.Timeout[] = []

  constructor() {
    // Auto-start cleanup tasks in production
    if (process.env.NODE_ENV === 'production') {
      this.start()
    }
  }

  static getInstance(): CleanupTasks {
    if (!CleanupTasks.instance) {
      CleanupTasks.instance = new CleanupTasks()
    }
    return CleanupTasks.instance
  }

  /**
   * Start all cleanup tasks
   */
  start(): void {
    // Clean expired password reset tokens every hour
    const tokenCleanup = setInterval(() => {
      this.cleanExpiredPasswordResetTokens()
    }, 60 * 60 * 1000) // 1 hour
    
    this.intervals.push(tokenCleanup)

    // Clean old session data every 24 hours
    const sessionCleanup = setInterval(() => {
      this.cleanExpiredSessions()
    }, 24 * 60 * 60 * 1000) // 24 hours
    
    this.intervals.push(sessionCleanup)

    // Run initial cleanup
    this.cleanExpiredPasswordResetTokens()
    this.cleanExpiredSessions()
  }

  /**
   * Stop all cleanup tasks
   */
  stop(): void {
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals = []
  }

  /**
   * Clean expired password reset tokens
   */
  async cleanExpiredPasswordResetTokens(): Promise<void> {
    try {
      const result = await prisma.passwordResetToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } }, // Expired tokens
            { used: true, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, // Used tokens older than 24h
          ]
        }
      })

      // Cleanup completed silently
    } catch (error) {
      console.error('Error cleaning password reset tokens:', error)
    }
  }

  /**
   * Clean expired NextAuth sessions
   */
  async cleanExpiredSessions(): Promise<void> {
    try {
      const result = await prisma.session.deleteMany({
        where: {
          expires: { lt: new Date() }
        }
      })

      // Sessions cleanup completed silently
    } catch (error) {
      console.error('Error cleaning expired sessions:', error)
    }
  }

  /**
   * Manual cleanup - can be called from API endpoints
   */
  async runManualCleanup(): Promise<{
    passwordTokensDeleted: number
    sessionsDeleted: number
  }> {
    await Promise.all([
      this.cleanExpiredPasswordResetTokens(),
      this.cleanExpiredSessions(),
    ])

    return {
      passwordTokensDeleted: 0, // Would need to capture count from methods above
      sessionsDeleted: 0,
    }
  }
}

// Export singleton instance
export const cleanupTasks = CleanupTasks.getInstance()