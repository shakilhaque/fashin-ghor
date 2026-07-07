import { NotificationChannel } from '@prisma/client';

export class SendNotificationDto {
  userId: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  imageUrl?: string;
  actionUrl?: string;
  // For email channel
  email?: string;
  // For SMS channel
  phone?: string;
}
