import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsProcessor, NOTIFICATION_QUEUE } from './notifications.processor';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueueAsync({
      name: NOTIFICATION_QUEUE,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD') || undefined,
        },
      }),
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsRepository,
    NotificationsProcessor,
    EmailService,
    SmsService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
