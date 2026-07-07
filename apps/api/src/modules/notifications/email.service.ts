import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
    this.from = this.config.get<string>('EMAIL_FROM', 'onboarding@resend.dev');
  }

  async sendEmail(opts: SendEmailOptions): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      });
      this.logger.log(`Email sent to ${opts.to}: ${opts.subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${opts.to}: ${String(err)}`);
    }
  }

  buildNotificationHtml(title: string, body: string, actionUrl?: string): string {
    const button = actionUrl
      ? `<p style="margin-top:20px"><a href="${actionUrl}" style="background:#10b981;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">View Details</a></p>`
      : '';
    return `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="color:#111827;margin-bottom:8px">${title}</h2>
        <p style="color:#374151;line-height:1.6">${body}</p>
        ${button}
        <hr style="margin-top:32px;border:none;border-top:1px solid #e5e7eb"/>
        <p style="color:#9ca3af;font-size:12px;margin-top:16px">LuxeMode — Fashion you love.</p>
      </div>
    `.trim();
  }
}
