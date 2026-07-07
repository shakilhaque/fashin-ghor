import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ReviewStatus, UserRole } from '@prisma/client';
import { ReviewsService } from './reviews.service';
import { ReviewsRepository } from './reviews.repository';

// ── Factories ─────────────────────────────────────────────────────────────────

function makeReview(overrides: Record<string, unknown> = {}) {
  return {
    id: 'review-1',
    userId: 'user-1',
    productId: 'prod-1',
    rating: 5,
    title: 'Great product',
    body: 'Really loved it',
    images: [],
    isVerifiedPurchase: false,
    status: ReviewStatus.PENDING,
    moderationNote: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: 'user-1', name: 'Jane Doe', avatar: null },
    ...overrides,
  };
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('ReviewsService', () => {
  let service: ReviewsService;
  let repo: jest.Mocked<ReviewsRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: ReviewsRepository,
          useValue: {
            findByProduct: jest.fn(),
            findProductStats: jest.fn(),
            findByUser: jest.fn(),
            findById: jest.fn(),
            findByProductAndUser: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            moderate: jest.fn(),
            findAll: jest.fn(),
            hasVerifiedPurchase: jest.fn(),
            getAdminStats: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    repo = module.get(ReviewsRepository) as jest.Mocked<ReviewsRepository>;
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = { productId: 'prod-1', rating: 5, title: 'Great', body: 'Loved it' };

    it('throws BadRequestException when user has already reviewed the product', async () => {
      repo.findByProductAndUser.mockResolvedValue(makeReview() as any);
      await expect(service.create('user-1', dto)).rejects.toThrow(BadRequestException);
      expect(repo.findByProductAndUser).toHaveBeenCalledWith('prod-1', 'user-1');
    });

    it('creates review with isVerifiedPurchase=true when user has purchased the product', async () => {
      repo.findByProductAndUser.mockResolvedValue(null);
      repo.hasVerifiedPurchase.mockResolvedValue(true);
      repo.create.mockResolvedValue(makeReview({ isVerifiedPurchase: true }) as any);
      await service.create('user-1', dto);
      expect(repo.create).toHaveBeenCalledWith('user-1', dto, true);
    });

    it('creates review with isVerifiedPurchase=false when user has not purchased', async () => {
      repo.findByProductAndUser.mockResolvedValue(null);
      repo.hasVerifiedPurchase.mockResolvedValue(false);
      repo.create.mockResolvedValue(makeReview({ isVerifiedPurchase: false }) as any);
      await service.create('user-1', dto);
      expect(repo.create).toHaveBeenCalledWith('user-1', dto, false);
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('throws NotFoundException when review does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update('user-1', 'review-1', { rating: 4 })).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user does not own the review', async () => {
      repo.findById.mockResolvedValue(makeReview({ userId: 'other-user' }) as any);
      await expect(service.update('user-1', 'review-1', { rating: 4 })).rejects.toThrow(ForbiddenException);
    });

    it('updates the review when user is the owner', async () => {
      const updated = makeReview({ rating: 4 });
      repo.findById.mockResolvedValue(makeReview({ userId: 'user-1' }) as any);
      repo.update.mockResolvedValue(updated as any);
      const result = await service.update('user-1', 'review-1', { rating: 4 });
      expect(repo.update).toHaveBeenCalledWith('review-1', { rating: 4 });
      expect(result.rating).toBe(4);
    });
  });

  // ── delete ─────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('throws NotFoundException when review does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.delete('user-1', UserRole.CUSTOMER, 'review-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when customer tries to delete someone else\'s review', async () => {
      repo.findById.mockResolvedValue(makeReview({ userId: 'other-user' }) as any);
      await expect(service.delete('user-1', UserRole.CUSTOMER, 'review-1')).rejects.toThrow(ForbiddenException);
    });

    it('allows customer to delete their own review', async () => {
      repo.findById.mockResolvedValue(makeReview({ userId: 'user-1' }) as any);
      repo.delete.mockResolvedValue(undefined as any);
      await service.delete('user-1', UserRole.CUSTOMER, 'review-1');
      expect(repo.delete).toHaveBeenCalledWith('review-1');
    });

    it('allows ADMIN to delete any review regardless of ownership', async () => {
      repo.findById.mockResolvedValue(makeReview({ userId: 'other-user' }) as any);
      repo.delete.mockResolvedValue(undefined as any);
      await service.delete('admin-1', UserRole.ADMIN, 'review-1');
      expect(repo.delete).toHaveBeenCalledWith('review-1');
    });

    it('allows SUPER_ADMIN to delete any review', async () => {
      repo.findById.mockResolvedValue(makeReview({ userId: 'other-user' }) as any);
      repo.delete.mockResolvedValue(undefined as any);
      await service.delete('admin-1', UserRole.SUPER_ADMIN, 'review-1');
      expect(repo.delete).toHaveBeenCalledWith('review-1');
    });

    it('allows MANAGER to delete any review', async () => {
      repo.findById.mockResolvedValue(makeReview({ userId: 'other-user' }) as any);
      repo.delete.mockResolvedValue(undefined as any);
      await service.delete('mgr-1', UserRole.MANAGER, 'review-1');
      expect(repo.delete).toHaveBeenCalledWith('review-1');
    });
  });

  // ── moderate ───────────────────────────────────────────────────────────────

  describe('moderate', () => {
    it('throws NotFoundException when review does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.moderate('review-1', { status: ReviewStatus.APPROVED }),
      ).rejects.toThrow(NotFoundException);
    });

    it('approves a pending review', async () => {
      const approved = makeReview({ status: ReviewStatus.APPROVED });
      repo.findById.mockResolvedValue(makeReview() as any);
      repo.moderate.mockResolvedValue(approved as any);
      const result = await service.moderate('review-1', { status: ReviewStatus.APPROVED });
      expect(repo.moderate).toHaveBeenCalledWith('review-1', ReviewStatus.APPROVED);
      expect(result.status).toBe(ReviewStatus.APPROVED);
    });

    it('rejects a pending review', async () => {
      const rejected = makeReview({ status: ReviewStatus.REJECTED });
      repo.findById.mockResolvedValue(makeReview() as any);
      repo.moderate.mockResolvedValue(rejected as any);
      const result = await service.moderate('review-1', { status: ReviewStatus.REJECTED });
      expect(result.status).toBe(ReviewStatus.REJECTED);
    });
  });

  // ── getProductStats ────────────────────────────────────────────────────────

  describe('getProductStats', () => {
    it('delegates to repository', async () => {
      const stats = { total: 5, average: 4.2, distribution: { 1: 0, 2: 1, 3: 0, 4: 2, 5: 2 } };
      repo.findProductStats.mockResolvedValue(stats as any);
      const result = await service.getProductStats('prod-1');
      expect(repo.findProductStats).toHaveBeenCalledWith('prod-1');
      expect(result).toEqual(stats);
    });
  });
});
