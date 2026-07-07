import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ReviewStatus, UserRole } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { ReviewsService } from './reviews.service';

const SUPPORT_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPPORT] as const;

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly service: ReviewsService) {}

  // ── Public ───────────────────────────────────────────────────────────────

  @Public()
  @Get('product/:productId')
  async getProductReviews(
    @Param('productId') productId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const result = await this.service.getProductReviews(productId, Number(page), Number(limit));
    return {
      message: 'Reviews retrieved',
      data: { reviews: result.reviews },
      meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
    };
  }

  @Public()
  @Get('product/:productId/stats')
  async getProductStats(@Param('productId') productId: string) {
    const stats = await this.service.getProductStats(productId);
    return { message: 'Review stats retrieved', data: { stats } };
  }

  // ── Customer ─────────────────────────────────────────────────────────────

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReviewDto,
  ) {
    const review = await this.service.create(user.id, dto);
    return { message: 'Review submitted and pending moderation', data: { review } };
  }

  @Get('my')
  async getMyReviews(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const result = await this.service.getMyReviews(user.id, Number(page), Number(limit));
    return {
      message: 'My reviews retrieved',
      data: { reviews: result.reviews },
      meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
    };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    const review = await this.service.update(user.id, id, dto);
    return { message: 'Review updated', data: { review } };
  }

  @Delete(':id')
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.service.delete(user.id, user.role as UserRole, id);
    return { message: 'Review deleted', data: null };
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  @Get('admin/list')
  @Roles(...SUPPORT_ROLES)
  async adminList(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: ReviewStatus,
    @Query('productId') productId?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.service.adminList({
      page: Number(page),
      limit: Number(limit),
      status,
      productId,
      search,
    });
    return {
      message: 'Reviews retrieved',
      data: { reviews: result.reviews },
      meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
    };
  }

  @Get('admin/stats')
  @Roles(...SUPPORT_ROLES)
  async adminStats() {
    const stats = await this.service.getAdminStats();
    return { message: 'Review stats retrieved', data: { stats } };
  }

  @Patch('admin/:id/moderate')
  @Roles(...SUPPORT_ROLES)
  async moderate(@Param('id') id: string, @Body() dto: ModerateReviewDto) {
    const review = await this.service.moderate(id, dto);
    return { message: `Review ${dto.status.toLowerCase()}`, data: { review } };
  }
}
