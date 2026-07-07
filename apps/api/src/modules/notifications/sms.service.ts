import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly token: string;
  private readonly sid: string;

  constructor(private readonly config: ConfigService) {
    this.token = this.config.get<string>('SSL_WIRELESS_API_TOKEN', '');
    this.sid = this.config.get<string>('SSL_WIRELESS_SID', '');
  }

  async sendSms(to: string, message: string): Promise<void> {
    if (!this.token || this.token === 'your_ssl_wireless_token') {
      this.logger.warn(`SMS stub — would send to ${to}: ${message}`);
      return;
    }

    try {
      await axios.post('https://smsplus.sslwireless.com/api/v3/send-sms', {
        api_token: this.token,
        sid: this.sid,
        sms_type: this.config.get('SSL_WIRELESS_SMS_TYPE', 'text'),
        mobile: to,
        sms: message,
        csms_id: `LM-${Date.now()}`,
      });
      this.logger.log(`SMS sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send SMS to ${to}: ${String(err)}`);
    }
  }
}
