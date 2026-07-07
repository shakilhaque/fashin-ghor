import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ReviewStatus, UserRole } from '@prisma/client';
import { ReviewsRepository } from './reviews.repository';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly repo: ReviewsRepository) {}

  async getProductReviews(productId: string, page: number, limit: number) {
    return this.repo.findByProduct(productId, page, limit);
  }

  async getProductStats(productId: string) {
    return this.repo.findProductStats(productId);
  }

  async getMyReviews(userId: string, page: number, limit: number) {
    return this.repo.findByUser(userId, page, limit);
  }

  async create(userId: string, dto: CreateReviewDto) {
    const existing = await this.repo.findByProductAndUser(dto.productId, userId);
    if (existing) {
      throw new BadRequestException('You have already reviewed this product');
    }

    const isVerifiedPurchase = await this.repo.hasVerifiedPurchase(userId, dto.productId);
    return this.repo.create(userId, dto, isVerifiedPurchase);
  }

  async update(userId: string, reviewId: string, dto: UpdateReviewDto) {
    const review = await this.repo.findById(reviewId);
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId) throw new ForbiddenException('Not your review');
    return this.repo.update(reviewId, dto);
  }

  async delete(userId: string, userRole: UserRole, reviewId: string) {
    const review = await this.repo.findById(reviewId);
    if (!review) throw new NotFoundException('Review not found');

    const ADMIN_ROLES: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER];
    const isAdmin = ADMIN_ROLES.includes(userRole);
    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException('Not your review');
    }
    return this.repo.delete(reviewId);
  }

  async moderate(reviewId: string, dto: ModerateReviewDto) {
    const review = await this.repo.findById(reviewId);
    if (!review) throw new NotFoundException('Review not found');
    return this.repo.moderate(reviewId, dto.status);
  }

  async adminList(opts: {
    page?: number;
    limit?: number;
    status?: ReviewStatus;
    productId?: string;
    search?: string;
  }) {
    return this.repo.findAll(opts);
  }

  async getAdminStats() {
    return this.repo.getAdminStats();
  }
}
