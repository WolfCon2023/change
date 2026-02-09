/**
 * Email Service
 * Handles sending emails via SMTP using nodemailer
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { config } from '../config/index.js';

// Email template types
export interface ComplianceReminderData {
  recipientName: string;
  recipientEmail: string;
  businessName: string;
  itemTitle: string;
  itemDescription?: string;
  dueDate: Date;
  daysUntilDue: number;
  dashboardUrl: string;
}

export interface WelcomeEmailData {
  recipientName: string;
  recipientEmail: string;
  loginUrl: string;
}

export interface PasswordResetData {
  recipientName: string;
  recipientEmail: string;
  resetUrl: string;
  expiresIn: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private initialized = false;

  /**
   * Initialize the email transporter
   */
  private async init(): Promise<void> {
    if (this.initialized) return;

    const { host, port, secure, user, pass } = config.smtp;

    if (!host || !user || !pass) {
      console.warn('[EmailService] SMTP not configured - emails will be logged but not sent');
      this.initialized = true;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      });

      // Verify connection
      await this.transporter.verify();
      console.log('[EmailService] SMTP connection verified successfully');
      this.initialized = true;
    } catch (error) {
      console.error('[EmailService] Failed to initialize SMTP:', error);
      this.transporter = null;
      this.initialized = true;
    }
  }

  /**
   * Send an email
   */
  private async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<boolean> {
    await this.init();

    const emailData = {
      from: `"C.H.A.N.G.E. Platform" <${config.smtp.from}>`,
      to,
      subject,
      html,
      text: text || this.htmlToText(html),
    };

    if (!this.transporter) {
      console.log('[EmailService] Email would be sent (SMTP not configured):');
      console.log(`  To: ${to}`);
      console.log(`  Subject: ${subject}`);
      return false;
    }

    try {
      const result = await this.transporter.sendMail(emailData);
      console.log(`[EmailService] Email sent successfully to ${to}, messageId: ${result.messageId}`);
      return true;
    } catch (error) {
      console.error(`[EmailService] Failed to send email to ${to}:`, error);
      return false;
    }
  }

  /**
   * Simple HTML to plain text conversion
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Send compliance deadline reminder
   */
  async sendComplianceReminder(data: ComplianceReminderData): Promise<boolean> {
    const logoUrl = `${config.appUrl}/logo-v2.png`;
    const urgencyColor = data.daysUntilDue <= 3 ? '#dc2626' : data.daysUntilDue <= 7 ? '#f59e0b' : '#3b82f6';
    const urgencyText = data.daysUntilDue <= 0 
      ? 'OVERDUE' 
      : data.daysUntilDue === 1 
        ? 'Due Tomorrow' 
        : `Due in ${data.daysUntilDue} days`;

    const formattedDate = data.dueDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const subject = data.daysUntilDue <= 0
      ? `🚨 OVERDUE: ${data.itemTitle} - Action Required`
      : data.daysUntilDue <= 3
        ? `⚠️ Urgent: ${data.itemTitle} due in ${data.daysUntilDue} day${data.daysUntilDue === 1 ? '' : 's'}`
        : `📅 Reminder: ${data.itemTitle} due ${formattedDate}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header with Logo -->
    <tr>
      <td style="background-color: #1e40af; padding: 24px; text-align: center;">
        <img src="${logoUrl}" alt="C.H.A.N.G.E. Platform" style="height: 50px; width: auto;" />
      </td>
    </tr>
    
    <!-- Urgency Banner -->
    <tr>
      <td style="background-color: ${urgencyColor}; padding: 12px 24px; text-align: center;">
        <span style="color: #ffffff; font-weight: bold; font-size: 16px;">${urgencyText}</span>
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td style="padding: 32px 24px;">
        <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">
          Hello ${data.recipientName},
        </p>
        
        <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
          This is a reminder about an upcoming compliance deadline for <strong>${data.businessName}</strong>:
        </p>
        
        <!-- Item Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
          <tr>
            <td style="padding: 20px;">
              <h2 style="color: #111827; font-size: 18px; margin: 0 0 8px 0;">${data.itemTitle}</h2>
              ${data.itemDescription ? `<p style="color: #6b7280; font-size: 14px; margin: 0 0 16px 0;">${data.itemDescription}</p>` : ''}
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right: 8px;">
                    <span style="color: #6b7280; font-size: 14px;">📅 Due Date:</span>
                  </td>
                  <td>
                    <span style="color: #111827; font-size: 14px; font-weight: 600;">${formattedDate}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- CTA Button -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
          <tr>
            <td style="text-align: center;">
              <a href="${data.dashboardUrl}" style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                View in Dashboard
              </a>
            </td>
          </tr>
        </table>
        
        <p style="color: #6b7280; font-size: 14px; margin: 24px 0 0 0; text-align: center;">
          Need help? Reply to this email or visit our support center.
        </p>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} CHANGE Business Transformation Platform. All rights reserved.
        </p>
        <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">
          You're receiving this email because you have compliance notifications enabled.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    return this.sendEmail(data.recipientEmail, subject, html);
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    const logoUrl = `${config.appUrl}/logo-v2.png`;
    const subject = '🎉 Welcome to C.H.A.N.G.E. Platform!';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header with Logo -->
    <tr>
      <td style="background-color: #1e40af; padding: 24px; text-align: center;">
        <img src="${logoUrl}" alt="C.H.A.N.G.E. Platform" style="height: 50px; width: auto;" />
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td style="padding: 32px 24px;">
        <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">
          Hello ${data.recipientName},
        </p>
        
        <p style="color: #374151; font-size: 16px; margin: 0 0 24px 0;">
          Welcome to C.H.A.N.G.E. - your guided platform for forming and operating your business. We're excited to help you on your entrepreneurial journey!
        </p>
        
        <h3 style="color: #111827; font-size: 16px; margin: 0 0 12px 0;">Here's what you can do:</h3>
        
        <ul style="color: #374151; font-size: 14px; margin: 0 0 24px 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Set up your business profile</li>
          <li style="margin-bottom: 8px;">Complete formation steps (Articles, EIN, etc.)</li>
          <li style="margin-bottom: 8px;">Manage operations (Banking, Agreements, Compliance)</li>
          <li style="margin-bottom: 8px;">Track tasks and deadlines</li>
          <li style="margin-bottom: 8px;">Store important documents</li>
        </ul>
        
        <!-- CTA Button -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align: center;">
              <a href="${data.loginUrl}" style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Get Started
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} CHANGE Business Transformation Platform. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    return this.sendEmail(data.recipientEmail, subject, html);
  }

  /**
   * Send a test email to verify SMTP configuration
   */
  async sendTestEmail(to: string): Promise<boolean> {
    const subject = '✅ C.H.A.N.G.E. Platform - Email Test';
    const logoUrl = `${config.appUrl}/logo-v2.png`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header with Logo -->
    <div style="background-color: #1e40af; padding: 24px; text-align: center;">
      <img src="${logoUrl}" alt="C.H.A.N.G.E. Platform" style="height: 50px; width: auto;" />
    </div>
    
    <!-- Content -->
    <div style="padding: 32px 24px; text-align: center;">
      <h2 style="color: #059669; margin: 0 0 16px 0; font-size: 24px;">Email Test Successful!</h2>
      <p style="color: #374151; margin: 0 0 8px 0; font-size: 16px;">
        This confirms that your C.H.A.N.G.E. Platform email notifications are working correctly.
      </p>
      <p style="color: #6b7280; font-size: 14px; margin: 24px 0 0 0;">
        Sent at: ${new Date().toISOString()}
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} CHANGE Business Transformation Platform. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return this.sendEmail(to, subject, html);
  }
}

// Export singleton instance
export const emailService = new EmailService();
