import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;
  private readonly fromAddress: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.fromAddress = this.config.get<string>('EMAIL_FROM', 'noreply@luxemode.com');
  }

  async sendOtpEmail(to: string, code: string, purpose: 'email_verify' | 'forgot_password'): Promise<void> {
    const subject =
      purpose === 'email_verify' ? 'Verify your LuxeMode account' : 'Reset your LuxeMode password';
    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #059669;">LuxeMode</h2>
        <p>Your verification code is:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">${code}</p>
        <p style="color: #666;">This code expires shortly. If you did not request this, you can ignore this email.</p>
      </div>
    `;

    if (!this.resend) {
      this.logger.warn(`[DEV MODE] No RESEND_API_KEY set. OTP for ${to}: ${code}`);
      return;
    }

    const { error } = await this.resend.emails.send({
      from: this.fromAddress,
      to,
      subject,
      html,
    });

    if (error) {
      this.logger.error(`Failed to send OTP email to ${to}: ${error.message}`);
      if (this.config.get<string>('NODE_ENV') !== 'production') {
        this.logger.warn(`[DEV FALLBACK] OTP for ${to}: ${code}`);
      }
    }
  }
}
