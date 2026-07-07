import { Controller, Get } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';

const ALL_STAFF: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.SUPPORT,
  UserRole.WAREHOUSE,
];

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('stats')
  @Roles(...ALL_STAFF)
  async getStats() {
    const stats = await this.service.getStats();
    return { message: 'Dashboard stats', data: { stats } };
  }
}
