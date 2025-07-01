/**
 * Production-ready email service for MES Aerospazio
 * Supports multiple providers with fallback and error handling
 */

import { z } from 'zod'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
  provider?: string
}

interface PasswordResetEmailData {
  email: string
  name?: string
  resetUrl: string
  expiresIn: string
}

// Email configuration validation
const emailConfigSchema = z.object({
  enabled: z.boolean(),
  provider: z.enum(['smtp', 'sendgrid', 'resend', 'console']),
  fromEmail: z.string().email(),
  fromName: z.string(),
  replyTo: z.string().email().optional(),
})

export class EmailService {
  private static instance: EmailService
  private config!: z.infer<typeof emailConfigSchema>
  private isConfigured: boolean = false

  constructor() {
    this.loadConfiguration()
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  private loadConfiguration(): void {
    try {
      const config = {
        enabled: process.env.EMAIL_SERVICE_ENABLED === 'true',
        provider: process.env.EMAIL_PROVIDER || 'console',
        fromEmail: process.env.EMAIL_FROM || 'noreply@mes-aerospazio.com',
        fromName: process.env.EMAIL_FROM_NAME || 'MES Aerospazio',
        replyTo: process.env.EMAIL_REPLY_TO,
      }

      this.config = emailConfigSchema.parse(config)
      this.isConfigured = this.config.enabled && this.validateProviderConfig()
      
      console.log(`Email service initialized: ${this.config.provider} (enabled: ${this.isConfigured})`)
    } catch (error) {
      console.error('Email configuration error:', error)
      this.isConfigured = false
      // Fallback to console mode
      this.config = {
        enabled: false,
        provider: 'console',
        fromEmail: 'noreply@mes-aerospazio.com',
        fromName: 'MES Aerospazio',
      }
    }
  }

  private validateProviderConfig(): boolean {
    switch (this.config.provider) {
      case 'smtp':
        return !!(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER)
      case 'sendgrid':
        return !!process.env.SENDGRID_API_KEY
      case 'resend':
        return !!process.env.RESEND_API_KEY
      case 'console':
        return true
      default:
        return false
    }
  }

  /**
   * Send email with comprehensive error handling
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    // Validate email options
    try {
      z.object({
        to: z.string().email(),
        subject: z.string().min(1),
        html: z.string().min(1),
      }).parse(options)
    } catch {
      return {
        success: false,
        error: 'Invalid email options',
      }
    }

    // Check if service is configured
    if (!this.isConfigured) {
      if (process.env.NODE_ENV === 'development') {
        return this.sendConsoleEmail(options)
      }
      return {
        success: false,
        error: 'Email service not configured for production',
      }
    }

    // Send email based on provider
    try {
      switch (this.config.provider) {
        case 'smtp':
          return await this.sendSMTPEmail(options)
        case 'sendgrid':
          return await this.sendSendGridEmail(options)
        case 'resend':
          return await this.sendResendEmail(options)
        case 'console':
          return this.sendConsoleEmail(options)
        default:
          throw new Error(`Unsupported email provider: ${this.config.provider}`)
      }
    } catch (error) {
      console.error('Email sending failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error',
        provider: this.config.provider,
      }
    }
  }

  /**
   * Send password reset email with proper templating
   */
  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<EmailResult> {
    const { email, name, resetUrl, expiresIn } = data

    const html = this.generatePasswordResetHTML({
      name: name || email,
      resetUrl,
      expiresIn,
    })

    const text = this.generatePasswordResetText({
      name: name || email,
      resetUrl,
      expiresIn,
    })

    return this.sendEmail({
      to: email,
      subject: 'Reset Password - MES Aerospazio',
      html,
      text,
    })
  }

  /**
   * Console email implementation for development
   */
  private sendConsoleEmail(options: EmailOptions): EmailResult {
    console.log('\n📧 EMAIL SERVICE - DEVELOPMENT MODE')
    console.log('=====================================')
    console.log(`To: ${options.to}`)
    console.log(`Subject: ${options.subject}`)
    console.log(`HTML Content:\n${options.html}`)
    if (options.text) {
      console.log(`Text Content:\n${options.text}`)
    }
    console.log('=====================================\n')

    return {
      success: true,
      messageId: `dev-${Date.now()}`,
      provider: 'console',
    }
  }

  /**
   * SMTP implementation using Nodemailer
   */
  private async sendSMTPEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const nodemailer = await import('nodemailer')
      
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
        },
      })

      const result = await transporter.sendMail({
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: this.config.replyTo,
      })

      return {
        success: true,
        messageId: result.messageId,
        provider: 'smtp',
      }
    } catch (error) {
      throw new Error(`SMTP Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * SendGrid implementation
   */
  private async sendSendGridEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const sgMail = await import('@sendgrid/mail')
      sgMail.default.setApiKey(process.env.SENDGRID_API_KEY!)

      const msg = {
        to: options.to,
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName,
        },
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: this.config.replyTo,
      }

      const [response] = await sgMail.default.send(msg)

      return {
        success: true,
        messageId: response.headers['x-message-id'] as string,
        provider: 'sendgrid',
      }
    } catch (error) {
      throw new Error(`SendGrid Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Resend implementation
   */
  private async sendResendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)

      const result = await resend.emails.send({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: this.config.replyTo,
      })

      if (result.error) {
        throw new Error(`Resend Error: ${result.error.message}`)
      }

      return {
        success: true,
        messageId: result.data?.id,
        provider: 'resend',
      }
    } catch (error) {
      throw new Error(`Resend Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate HTML template for password reset
   */
  private generatePasswordResetHTML(data: {
    name: string
    resetUrl: string
    expiresIn: string
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reset Password - MES Aerospazio</title>
          <style>
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: #1976d2;
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .header p {
              margin: 5px 0 0 0;
              opacity: 0.9;
            }
            .content {
              padding: 30px 20px;
            }
            .button {
              display: inline-block;
              padding: 14px 28px;
              background: #1976d2;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: 600;
              text-align: center;
            }
            .button:hover {
              background: #1565c0;
            }
            .warning-box {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #dee2e6;
            }
            .url-fallback {
              word-break: break-all;
              background: #f8f9fa;
              padding: 10px;
              border-radius: 4px;
              font-family: monospace;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>MES Aerospazio</h1>
              <p>Manufacturing Execution System</p>
            </div>
            
            <div class="content">
              <h2>Reset Password</h2>
              <p>Ciao <strong>${data.name}</strong>,</p>
              <p>Hai richiesto di reimpostare la password per il tuo account MES Aerospazio.</p>
              <p>Clicca sul pulsante qui sotto per reimpostare la tua password:</p>
              
              <div style="text-align: center;">
                <a href="${data.resetUrl}" class="button">Reimposta Password</a>
              </div>
              
              <p>Se il pulsante non funziona, copia e incolla questo link nel tuo browser:</p>
              <div class="url-fallback">${data.resetUrl}</div>
              
              <div class="warning-box">
                <p><strong>⚠️ Importante:</strong></p>
                <ul style="margin: 10px 0 0 20px;">
                  <li>Questo link scade tra <strong>${data.expiresIn}</strong></li>
                  <li>Se non hai richiesto questo reset, ignora questa email</li>
                  <li>Il link può essere utilizzato una sola volta</li>
                  <li>Per sicurezza, non condividere questo link con nessuno</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p>Questa è una email automatica, non rispondere a questo messaggio.</p>
              <p>© 2024 MES Aerospazio - Manufacturing Execution System</p>
              <p>Se hai problemi, contatta l'amministratore di sistema.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  /**
   * Generate text template for password reset
   */
  private generatePasswordResetText(data: {
    name: string
    resetUrl: string
    expiresIn: string
  }): string {
    return `
MES Aerospazio - Reset Password

Ciao ${data.name},

Hai richiesto di reimpostare la password per il tuo account MES Aerospazio.

Per reimpostare la tua password, visita questo link:
${data.resetUrl}

IMPORTANTE:
- Questo link scade tra ${data.expiresIn}
- Se non hai richiesto questo reset, ignora questa email
- Il link può essere utilizzato una sola volta
- Per sicurezza, non condividere questo link con nessuno

© 2024 MES Aerospazio - Manufacturing Execution System

Se hai problemi, contatta l'amministratore di sistema.
    `
  }

  /**
   * Test email configuration
   */
  async testConfiguration(): Promise<EmailResult> {
    return this.sendEmail({
      to: this.config.fromEmail,
      subject: 'Test Email - MES Aerospazio',
      html: '<h1>Email Service Test</h1><p>This is a test email to verify email configuration.</p>',
      text: 'Email Service Test - This is a test email to verify email configuration.',
    })
  }

  /**
   * Get current configuration (without sensitive data)
   */
  getConfiguration() {
    return {
      enabled: this.isConfigured,
      provider: this.config.provider,
      fromEmail: this.config.fromEmail,
      fromName: this.config.fromName,
    }
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance()