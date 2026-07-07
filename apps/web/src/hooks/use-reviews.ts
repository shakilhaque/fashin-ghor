'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string | null;
  body: string | null;
  images: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isVerifiedPurchase: boolean;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null };
  product?: { id: string; name: string; slug: string; images: { url: string }[] };
}

export interface ReviewStats {
  average: number;
  total: number;
  distribution: Record<string, number>;
}

// ── Public ───────────────────────────────────────────────────────────────────

export function useProductReviews(productId: string, page = 1) {
  return useQuery({
    queryKey: ['reviews', 'product', productId, page],
    queryFn: async () => {
      const { data } = await api.get(`/reviews/product/${productId}?page=${page}&limit=10`);
      return data as { data: { reviews: Review[] }; meta: { total: number; totalPages: number; page: number } };
    },
    enabled: !!productId,
  });
}

export function useProductReviewStats(productId: string) {
  return useQuery({
    queryKey: ['reviews', 'stats', productId],
    queryFn: async () => {
      const { data } = await api.get(`/reviews/product/${productId}/stats`);
      return data.data.stats as ReviewStats;
    },
    enabled: !!productId,
  });
}

// ── Customer ─────────────────────────────────────────────────────────────────

export function useMyReviews(page = 1) {
  return useQuery({
    queryKey: ['reviews', 'my', page],
    queryFn: async () => {
      const { data } = await api.get(`/reviews/my?page=${page}`);
      return data as { data: { reviews: Review[] }; meta: { total: number; totalPages: number } };
    },
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { productId: string; rating: number; title?: string; body?: string; images?: string[] }) => {
      const { data } = await api.post('/reviews', dto);
      return data.data.review as Review;
    },
    onSuccess: (review) => {
      qc.invalidateQueries({ queryKey: ['reviews', 'product', review.productId] });
      qc.invalidateQueries({ queryKey: ['reviews', 'stats', review.productId] });
      qc.invalidateQueries({ queryKey: ['reviews', 'my'] });
    },
  });
}

export function useUpdateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: { id: string; rating?: number; title?: string; body?: string }) => {
      const { data } = await api.patch(`/reviews/${id}`, dto);
      return data.data.review as Review;
    },
    onSuccess: (review) => {
      qc.invalidateQueries({ queryKey: ['reviews', 'product', review.productId] });
      qc.invalidateQueries({ queryKey: ['reviews', 'my'] });
    },
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/reviews/${id}`); return id; },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export function useAdminReviews(opts: { page?: number; status?: string; search?: string } = {}) {
  const { page = 1, status, search } = opts;
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (status) params.set('status', status);
  if (search) params.set('search', search);

  return useQuery({
    queryKey: ['admin', 'reviews', page, status, search],
    queryFn: async () => {
      const { data } = await api.get(`/reviews/admin/list?${params}`);
      return data as { data: { reviews: Review[] }; meta: { total: number; totalPages: number; page: number } };
    },
  });
}

export function useAdminReviewStats() {
  return useQuery({
    queryKey: ['admin', 'review-stats'],
    queryFn: async () => {
      const { data } = await api.get('/reviews/admin/stats');
      return data.data.stats as { pending: number; approved: number; rejected: number; total: number };
    },
  });
}

export function useModerateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: 'APPROVED' | 'REJECTED'; note?: string }) => {
      const { data } = await api.patch(`/reviews/admin/${id}/moderate`, { status, note });
      return data.data.review as Review;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'reviews'] });
      qc.invalidateQueries({ queryKey: ['admin', 'review-stats'] });
      qc.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}
