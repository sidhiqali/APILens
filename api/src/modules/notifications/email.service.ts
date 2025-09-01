import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface EmailData {
  to: string;
  subject: string;
  message: string;
  severity: string;
  metadata?: any;
}

interface VerificationEmailData {
  to: string;
  subject: string;
  verificationUrl: string;
  token: string;
}

interface PasswordResetEmailData {
  to: string;
  subject: string;
  resetUrl: string;
  token: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {}

  sendChangeNotification(data: EmailData) {
    try {
      const emailContent = this.generateEmailContent(data);

      this.logger.log(`📧 Email Notification (${data.severity.toUpperCase()})`);
      this.logger.log(`To: ${data.to}`);
      this.logger.log(`Subject: ${data.subject}`);
      this.logger.log(`Content:\n${emailContent}`);
    } catch (error) {
      this.logger.error(
        `Failed to send change notification email: ${error.message}`,
      );
      throw error;
    }
  }

  sendVerificationEmail(data: VerificationEmailData) {
    try {
      this.generateVerificationEmailContent(data);

      this.logger.log(`📧 Verification Email`);
      this.logger.log(`To: ${data.to}`);
      this.logger.log(`Subject: ${data.subject}`);
      this.logger.log(`Verification URL: ${data.verificationUrl}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email: ${error.message}`);
      throw error;
    }
  }

  sendPasswordResetEmail(data: PasswordResetEmailData) {
    try {
      this.generatePasswordResetEmailContent(data);

      this.logger.log(`📧 Password Reset Email`);
      this.logger.log(`To: ${data.to}`);
      this.logger.log(`Subject: ${data.subject}`);
      this.logger.log(`Reset URL: ${data.resetUrl}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email: ${error.message}`,
      );
      throw error;
    }
  }

  private sendWelcomeEmail(to: string, name: string) {
    try {
      this.generateWelcomeEmailContent(name);

      this.logger.log(`📧 Welcome Email`);
      this.logger.log(`To: ${to}`);
      this.logger.log(`Subject: Welcome to API Lens!`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email: ${error.message}`);
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
          <a href="${this.configService.get('FRONTEND_URL')}/dashboard" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            View Full Details
          </a>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
          <p style="color: #6c757d; font-size: 12px; margin: 0;">
            This notification was sent by API Lens<br>
            <a href="${this.configService.get('FRONTEND_URL')}/settings/notifications" style="color: #667eea;">Manage notification preferences</a>
          </p>
        </div>

      </body>
      </html>
    `;
  }

  private generateVerificationEmailContent(
    data: VerificationEmailData,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - API Lens</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
            📧 Verify Your Email
          </h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
            Welcome to API Lens
          </p>
        </div>

        <div style="background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 30px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <h2 style="margin: 0 0 20px 0; color: #495057; font-size: 20px;">
            Please verify your email address
          </h2>

          <p style="margin-bottom: 25px; color: #6c757d; font-size: 16px;">
            Thanks for signing up for API Lens! Before we can get you started, we need to verify your email address.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.verificationUrl}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
              Verify Email Address
            </a>
          </div>

          <p style="margin-top: 25px; color: #6c757d; font-size: 14px;">
            If the button doesn't work, you can copy and paste this link into your browser:
          </p>
          <p style="word-break: break-all; color: #667eea; font-size: 14px;">
            ${data.verificationUrl}
          </p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin-top: 25px;">
            <p style="margin: 0; color: #6c757d; font-size: 14px;">
              <strong>⏰ This link will expire in 24 hours</strong><br>
              If you didn't create an account with API Lens, you can safely ignore this email.
            </p>
          </div>

        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
          <p style="color: #6c757d; font-size: 12px; margin: 0;">
            This email was sent by API Lens<br>
            If you have any questions, please contact our support team.
          </p>
        </div>

      </body>
      </html>
    `;
  }

  private generatePasswordResetEmailContent(
    data: PasswordResetEmailData,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - API Lens</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <div style="background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); padding: 30px; border-radius: 8px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
            🔐 Reset Your Password
          </h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
            API Lens Password Reset
          </p>
        </div>

        <div style="background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 30px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <h2 style="margin: 0 0 20px 0; color: #495057; font-size: 20px;">
            Reset your password
          </h2>

          <p style="margin-bottom: 25px; color: #6c757d; font-size: 16px;">
            We received a request to reset your password for your API Lens account. Click the button below to choose a new password.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetUrl}" style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
              Reset Password
            </a>
          </div>

          <p style="margin-top: 25px; color: #6c757d; font-size: 14px;">
            If the button doesn't work, you can copy and paste this link into your browser:
          </p>
          <p style="word-break: break-all; color: #667eea; font-size: 14px;">
            ${data.resetUrl}
          </p>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 6px; margin-top: 25px;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>⚠️ Security Notice</strong><br>
              This password reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
            </p>
          </div>

        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
          <p style="color: #6c757d; font-size: 12px; margin: 0;">
            This email was sent by API Lens<br>
            If you have any questions, please contact our support team.
          </p>
        </div>

      </body>
      </html>
    `;
  }

  private generateWelcomeEmailContent(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to API Lens!</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; border-radius: 8px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
            🎉 Welcome to API Lens!
          </h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
            Your API monitoring journey starts here
          </p>
        </div>

        <div style="background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 30px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <h2 style="margin: 0 0 20px 0; color: #495057; font-size: 20px;">
            Hi ${name}, welcome aboard!
          </h2>

          <p style="margin-bottom: 25px; color: #6c757d; font-size: 16px;">
            Thanks for joining API Lens! You're now ready to monitor your APIs and stay informed about any changes. Here's what you can do next:
          </p>

          <div style="margin: 25px 0;">
            <h3 style="color: #495057; margin: 0 0 15px 0; font-size: 16px;">🚀 Getting Started:</h3>
            <ul style="color: #6c757d; font-size: 14px; line-height: 1.8;">
              <li>Add your first API by providing an OpenAPI specification URL</li>
              <li>Configure monitoring frequency and notification preferences</li>
              <li>Set up alerts for breaking changes</li>
              <li>Explore the dashboard to see your API health status</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.configService.get('FRONTEND_URL')}/dashboard" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
              Go to Dashboard
            </a>
          </div>

          <div style="background: #e7f3ff; border: 1px solid #b3d7ff; padding: 20px; border-radius: 6px; margin-top: 25px;">
            <p style="margin: 0; color: #0056b3; font-size: 14px;">
              <strong>💡 Pro Tip:</strong><br>
              Start by adding a few APIs you depend on most. API Lens will automatically detect changes and notify you via email or webhook.
            </p>
          </div>

        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
          <p style="color: #6c757d; font-size: 12px; margin: 0;">
            Need help? Check out our <a href="${this.configService.get('FRONTEND_URL')}/docs" style="color: #667eea;">documentation</a> or contact support.<br>
            Happy monitoring! 🎯
          </p>
        </div>

      </body>
      </html>
    `;
  }
}
