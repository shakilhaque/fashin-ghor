import { Injectable } from '@nestjs/common';
import { MediaType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const slideInclude = {
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      images: { take: 1, select: { url: true } },
    },
  },
} as const;

const storyInclude = {
  slides: {
    include: slideInclude,
    orderBy: { position: 'asc' as const },
  },
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      images: { take: 1, select: { url: true } },
    },
  },
} as const;

@Injectable()
export class StoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActive() {
    const now = new Date();
    return this.prisma.story.findMany({
      where: {
        isActive: true,
        OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
      },
      include: storyInclude,
      orderBy: { position: 'asc' },
    });
  }

  findAll() {
    return this.prisma.story.findMany({
      include: storyInclude,
      orderBy: { position: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.story.findUnique({ where: { id }, include: storyInclude });
  }

  create(data: {
    title: string;
    coverImage: string;
    subtitle?: string;
    isActive?: boolean;
    position?: number;
    scheduledAt?: Date;
    expiresAt?: Date;
    productId?: string | null;
  }) {
    return this.prisma.story.create({ data, include: storyInclude });
  }

  update(id: string, data: {
    title?: string;
    coverImage?: string;
    subtitle?: string | null;
    isActive?: boolean;
    position?: number;
    scheduledAt?: Date | null;
    expiresAt?: Date | null;
    productId?: string | null;
  }) {
    return this.prisma.story.update({ where: { id }, data, include: storyInclude });
  }

  delete(id: string) {
    return this.prisma.story.delete({ where: { id } });
  }

  incrementViewCount(id: string) {
    return this.prisma.story.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  createSlide(data: {
    storyId: string;
    mediaUrl: string;
    mediaType?: MediaType;
    duration?: number;
    caption?: string | null;
    position?: number;
    productId?: string | null;
  }) {
    return this.prisma.storySlide.create({ data });
  }

  findSlideById(id: string) {
    return this.prisma.storySlide.findUnique({ where: { id } });
  }

  updateSlide(id: string, data: {
    mediaUrl?: string;
    mediaType?: MediaType;
    duration?: number;
    caption?: string | null;
    position?: number;
    productId?: string | null;
  }) {
    return this.prisma.storySlide.update({ where: { id }, data });
  }

  deleteSlide(id: string) {
    return this.prisma.storySlide.delete({ where: { id } });
  }
}
