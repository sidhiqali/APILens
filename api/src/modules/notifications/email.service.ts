// src/modules/notifications/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface EmailData {
  to: string;
  subject: string;
  message: string;
  severity: string;
  metadata?: any;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {}

  sendChangeNotification(data: EmailData) {
    try {
      // For MVP, just log the email content
      // In production, integrate with services like SendGrid, AWS SES, or nodemailer

      const emailContent = this.generateEmailContent(data);

      this.logger.log(`📧 Email Notification (${data.severity.toUpperCase()})`);
      this.logger.log(`To: ${data.to}`);
      this.logger.log(`Subject: ${data.subject}`);
      this.logger.log(`Content:\n${emailContent}`);

      // TODO: Implement actual email sending
      // Example with nodemailer:
      /*
      const transporter = nodemailer.createTransporter({
        service: 'gmail', // or your email service
        auth: {
          user: this.configService.get('EMAIL_USER'),
          pass: this.configService.get('EMAIL_PASS'),
        },
      });

      await transporter.sendMail({
        from: this.configService.get('EMAIL_FROM'),
        to: data.to,
        subject: data.subject,
        html: emailContent,
      });
      */
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }
  }

  private generateEmailContent(data: EmailData): string {
    const severityColors = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#fd7e14',
      critical: '#dc3545',
    };

    const severityEmojis = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      critical: '🔴',
    };

    const color = severityColors[data.severity] || '#6c757d';
    const emoji = severityEmojis[data.severity] || '📝';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API Change Notification</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
            ${emoji} API Lens Notification
          </h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
            API Change Detection
          </p>
        </div>

        <div style="background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 30px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <div style="border-left: 4px solid ${color}; padding-left: 20px; margin-bottom: 25px;">
            <h2 style="margin: 0 0 10px 0; color: #495057; font-size: 20px;">
              ${data.subject}
            </h2>
            <div style="background: ${color}; color: white; padding: 4px 12px; border-radius: 16px; display: inline-block; font-size: 12px; font-weight: 600; text-transform: uppercase;">
              ${data.severity} Priority
            </div>
          </div>

          <div style="margin-bottom: 25px;">
            <h3 style="color: #495057; margin: 0 0 15px 0; font-size: 16px;">Changes Detected:</h3>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 3px solid ${color};">
              <pre style="white-space: pre-wrap; margin: 0; font-family: 'Monaco', 'Consolas', monospace; font-size: 14px; line-height: 1.5;">${data.message}</pre>
            </div>
          </div>

          ${
            data.metadata?.newVersion
              ? `
          <div style="margin-bottom: 25px;">
            <h3 style="color: #495057; margin: 0 0 10px 0; font-size: 16px;">New Version:</h3>
            <span style="background: #e9ecef; padding: 6px 12px; border-radius: 4px; font-family: monospace; font-weight: 600;">
              v${data.metadata.newVersion}
            </span>
          </div>
          `
              : ''
          }

          <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin-top: 25px;">
            <p style="margin: 0; color: #6c757d; font-size: 14px;">
              <strong>💡 What should you do?</strong><br>
              Review the changes above and update your application if necessary. 
              ${
                data.severity === 'high' || data.severity === 'critical'
                  ? 'This is a high-priority change that may affect your integration.'
                  : 'This appears to be a non-breaking change, but please verify.'
              }
            </p>
          </div>

        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="#" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            View Full Details
          </a>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
          <p style="color: #6c757d; font-size: 12px; margin: 0;">
            This notification was sent by API Lens<br>
            <a href="#" style="color: #667eea;">Manage notification preferences</a> | 
            <a href="#" style="color: #667eea;">Unsubscribe</a>
          </p>
        </div>

      </body>
      </html>
    `;
  }
}
