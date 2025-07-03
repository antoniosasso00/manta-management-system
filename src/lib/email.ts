/**
 * Email service for sending notifications
 * This is a basic implementation that can be extended with services like:
 * - SendGrid
 * - Resend
 * - AWS SES
 * - Nodemailer with SMTP
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

interface PasswordResetEmailData {
  email: string
  name?: string
  resetUrl: string
  expiresIn: string
}

export class EmailService {
  private static instance: EmailService
  private isConfigured: boolean = false

  constructor() {
    // Check if email service is configured
    this.isConfigured = !!(
      process.env.EMAIL_SERVICE_ENABLED === 'true' &&
      (process.env.SMTP_HOST || process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY)
    )
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  /**
   * Send a password reset email
   */
  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean> {
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
   * Send email (main method)
   */
  private async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured) {
      // In development, log to console instead of sending
      console.log('📧 Email Service Not Configured - Email Content:')
      console.log('To:', options.to)
      console.log('Subject:', options.subject)
      console.log('Text:', options.text)
      console.log('---')
      
      // In development, we simulate success but in production this should be configured
      return process.env.NODE_ENV === 'development'
    }

    try {
      // Choose email provider based on environment variables
      if (process.env.SENDGRID_API_KEY) {
        return await this.sendWithSendGrid(options)
      } else if (process.env.RESEND_API_KEY) {
        return await this.sendWithResend(options)
      } else if (process.env.SMTP_HOST) {
        return await this.sendWithSMTP(options)
      }

      throw new Error('No email service configured')
    } catch (error) {
      console.error('Email sending failed:', error)
      return false
    }
  }

  /**
   * SendGrid implementation
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async sendWithSendGrid(_options: EmailOptions): Promise<boolean> {
    // TODO: Implement SendGrid
    // const sgMail = require('@sendgrid/mail')
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY!)
    // ...
    return false
  }

  /**
   * Resend implementation
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async sendWithResend(_options: EmailOptions): Promise<boolean> {
    // TODO: Implement Resend
    // const { Resend } = require('resend')
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // ...
    return false
  }

  /**
   * SMTP implementation with Nodemailer
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async sendWithSMTP(_options: EmailOptions): Promise<boolean> {
    // TODO: Implement Nodemailer SMTP
    // const nodemailer = require('nodemailer')
    // ...
    return false
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
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: #1976d2;
              color: white;
              padding: 20px;
              text-align: center;
              margin-bottom: 20px;
            }
            .content {
              padding: 20px;
              background: #f9f9f9;
              border-radius: 5px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #1976d2;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MES Aerospazio</h1>
            <p>Manufacturing Execution System</p>
          </div>
          
          <div class="content">
            <h2>Reset Password</h2>
            <p>Ciao ${data.name},</p>
            <p>Hai richiesto di reimpostare la password per il tuo account MES Aerospazio.</p>
            <p>Clicca sul pulsante qui sotto per reimpostare la tua password:</p>
            
            <a href="${data.resetUrl}" class="button">Reimposta Password</a>
            
            <p>Se il pulsante non funziona, copia e incolla questo link nel tuo browser:</p>
            <p><a href="${data.resetUrl}">${data.resetUrl}</a></p>
            
            <p><strong>Importante:</strong></p>
            <ul>
              <li>Questo link scade tra ${data.expiresIn}</li>
              <li>Se non hai richiesto questo reset, ignora questa email</li>
              <li>Il link può essere utilizzato una sola volta</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>Questa è una email automatica, non rispondere a questo messaggio.</p>
            <p>© 2024 MES Aerospazio - Manufacturing Execution System</p>
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

© 2024 MES Aerospazio - Manufacturing Execution System
    `
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance()