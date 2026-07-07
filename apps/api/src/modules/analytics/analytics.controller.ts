import { Controller, Get, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { AnalyticsService, AnalyticsPeriod } from './analytics.service';

const ALL_STAFF: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.SUPPORT,
  UserRole.WAREHOUSE,
];

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('overview')
  @Roles(...ALL_STAFF)
  async getOverview(@Query('period') period: string) {
    const validPeriods: AnalyticsPeriod[] = ['7d', '30d', '90d', '1y'];
    const p: AnalyticsPeriod = validPeriods.includes(period as AnalyticsPeriod)
      ? (period as AnalyticsPeriod)
      : '30d';

    const data = await this.service.getOverview(p);
    return { message: 'Analytics overview', data };
  }
}
