import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationChannel } from '@prisma/client';
import { NotificationsRepository } from './notifications.repository';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NOTIFICATION_QUEUE } from './notifications.processor';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly repo: NotificationsRepository,
    @InjectQueue(NOTIFICATION_QUEUE) private readonly queue: Queue,
  ) {}

  // Internal method — called from other modules to fire a notification
  async send(dto: SendNotificationDto): Promise<void> {
    await this.repo.create({
      userId: dto.userId,
      channel: dto.channel,
      title: dto.title,
      body: dto.body,
      imageUrl: dto.imageUrl,
      actionUrl: dto.actionUrl,
    });

    if (dto.channel === NotificationChannel.EMAIL && dto.email) {
      await this.queue.add('send-email', {
        to: dto.email,
        subject: dto.title,
        title: dto.title,
        body: dto.body,
        actionUrl: dto.actionUrl,
      });
    }

    if (dto.channel === NotificationChannel.SMS && dto.phone) {
      await this.queue.add('send-sms', {
        to: dto.phone,
        message: `${dto.title}: ${dto.body}`,
      });
    }
  }

  // Convenience: send both in-app and email in one call
  async sendMulti(
    opts: Omit<SendNotificationDto, 'channel'> & { email?: string; phone?: string },
  ): Promise<void> {
    await this.send({ ...opts, channel: NotificationChannel.IN_APP });

    if (opts.email) {
      await this.send({ ...opts, channel: NotificationChannel.EMAIL });
    }

    if (opts.phone) {
      await this.send({ ...opts, channel: NotificationChannel.SMS });
    }
  }

  async list(userId: string, page: number, limit: number) {
    const [notifications, total] = await this.repo.findByUser(userId, page, limit);
    return { notifications, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async unreadCount(userId: string) {
    return this.repo.countUnread(userId);
  }

  async markRead(id: string, userId: string) {
    await this.repo.markRead(id, userId);
  }

  async markAllRead(userId: string) {
    await this.repo.markAllRead(userId);
  }

  async delete(id: string, userId: string) {
    await this.repo.delete(id, userId);
  }
}
