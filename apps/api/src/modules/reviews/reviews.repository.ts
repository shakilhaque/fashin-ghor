import { Injectable } from '@nestjs/common';
import { ReviewStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

const USER_SELECT = { id: true, name: true, avatar: true };
const PRODUCT_SELECT = { id: true, name: true, slug: true, images: { take: 1, select: { url: true } } };

@Injectable()
export class ReviewsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByProduct(productId: string, page = 1, limit = 10) {
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId, status: ReviewStatus.APPROVED },
        include: { user: { select: USER_SELECT } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({ where: { productId, status: ReviewStatus.APPROVED } }),
    ]);
    return { reviews, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findProductStats(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { productId, status: ReviewStatus.APPROVED },
      select: { rating: true },
    });
    const total = reviews.length;
    const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => { dist[r.rating] = (dist[r.rating] ?? 0) + 1; });
    return { average: Math.round(avg * 10) / 10, total, distribution: dist };
  }

  async findByUser(userId: string, page = 1, limit = 10) {
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { userId },
        include: { product: { select: PRODUCT_SELECT } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({ where: { userId } }),
    ]);
    return { reviews, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    return this.prisma.review.findUnique({
      where: { id },
      include: {
        user: { select: USER_SELECT },
        product: { select: PRODUCT_SELECT },
      },
    });
  }

  async findByProductAndUser(productId: string, userId: string) {
    return this.prisma.review.findUnique({ where: { productId_userId: { productId, userId } } });
  }

  async create(userId: string, dto: CreateReviewDto, isVerifiedPurchase: boolean) {
    return this.prisma.review.create({
      data: {
        userId,
        productId: dto.productId,
        rating: dto.rating,
        title: dto.title,
        body: dto.body,
        images: dto.images ?? [],
        isVerifiedPurchase,
        status: ReviewStatus.PENDING,
      },
      include: { user: { select: USER_SELECT } },
    });
  }

  async update(id: string, dto: UpdateReviewDto) {
    return this.prisma.review.update({
      where: { id },
      data: {
        ...(dto.rating !== undefined && { rating: dto.rating }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.body !== undefined && { body: dto.body }),
        ...(dto.images !== undefined && { images: dto.images }),
        status: ReviewStatus.PENDING, // reset to pending on edit
      },
      include: { user: { select: USER_SELECT } },
    });
  }

  async delete(id: string) {
    return this.prisma.review.delete({ where: { id } });
  }

  async moderate(id: string, status: ReviewStatus) {
    return this.prisma.review.update({
      where: { id },
      data: { status },
      include: { user: { select: USER_SELECT }, product: { select: PRODUCT_SELECT } },
    });
  }

  // Admin — list all with filters
  async findAll(opts: {
    page?: number;
    limit?: number;
    status?: ReviewStatus;
    productId?: string;
    search?: string;
  }) {
    const { page = 1, limit = 20, status, productId, search } = opts;
    const where = {
      ...(status && { status }),
      ...(productId && { productId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { body: { contains: search, mode: 'insensitive' as const } },
          { user: { name: { contains: search, mode: 'insensitive' as const } } },
        ],
      }),
    };

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: { select: USER_SELECT },
          product: { select: PRODUCT_SELECT },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return { reviews, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async hasVerifiedPurchase(userId: string, productId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        userId,
        status: { in: ['DELIVERED'] },
        items: { some: { productId } },
      },
    });
    return order !== null;
  }

  async getAdminStats() {
    const [pending, approved, rejected, total] = await Promise.all([
      this.prisma.review.count({ where: { status: ReviewStatus.PENDING } }),
      this.prisma.review.count({ where: { status: ReviewStatus.APPROVED } }),
      this.prisma.review.count({ where: { status: ReviewStatus.REJECTED } }),
      this.prisma.review.count(),
    ]);
    return { pending, approved, rejected, total };
  }
}
