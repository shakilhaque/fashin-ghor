import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';

export const NOTIFICATION_QUEUE = 'notifications';

export interface EmailJobData {
  to: string;
  subject: string;
  title: string;
  body: string;
  actionUrl?: string;
}

export interface SmsJobData {
  to: string;
  message: string;
}

@Processor(NOTIFICATION_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'send-email': {
        const data = job.data as EmailJobData;
        await this.emailService.sendEmail({
          to: data.to,
          subject: data.subject,
          html: this.emailService.buildNotificationHtml(data.title, data.body, data.actionUrl),
        });
        break;
      }
      case 'send-sms': {
        const data = job.data as SmsJobData;
        await this.smsService.sendSms(data.to, data.message);
        break;
      }
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }
}
