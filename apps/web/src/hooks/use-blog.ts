'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  _count?: { posts: number };
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content?: string;
  coverImage: string | null;
  authorId: string;
  categoryId: string | null;
  tags: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  metaTitle: string | null;
  metaDesc: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string; avatar: string | null };
  category: { id: string; name: string; slug: string } | null;
}

// ── Public ───────────────────────────────────────────────────────────────────

export function useBlogCategories() {
  return useQuery({
    queryKey: ['blog', 'categories'],
    queryFn: async () => {
      const { data } = await api.get('/blog/categories');
      return data.data.categories as BlogCategory[];
    },
  });
}

export function useBlogPosts(opts: {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  search?: string;
} = {}) {
  const { page = 1, limit = 9, category, tag, search } = opts;
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (category) params.set('category', category);
  if (tag) params.set('tag', tag);
  if (search) params.set('search', search);

  return useQuery({
    queryKey: ['blog', 'posts', page, category, tag, search],
    queryFn: async () => {
      const { data } = await api.get(`/blog/posts?${params}`);
      return data as { data: { posts: BlogPost[] }; meta: { total: number; totalPages: number; page: number } };
    },
  });
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ['blog', 'post', slug],
    queryFn: async () => {
      const { data } = await api.get(`/blog/posts/${slug}`);
      return data.data.post as BlogPost;
    },
    enabled: !!slug,
  });
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export function useAdminBlogPosts(opts: { page?: number; status?: string; search?: string } = {}) {
  const { page = 1, status, search } = opts;
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (status) params.set('status', status);
  if (search) params.set('search', search);

  return useQuery({
    queryKey: ['admin', 'blog', 'posts', page, status, search],
    queryFn: async () => {
      const { data } = await api.get(`/blog/admin/posts?${params}`);
      return data as { data: { posts: BlogPost[] }; meta: { total: number; totalPages: number; page: number } };
    },
  });
}

export function useAdminBlogPost(id: string) {
  return useQuery({
    queryKey: ['admin', 'blog', 'post', id],
    queryFn: async () => {
      const { data } = await api.get(`/blog/admin/posts/${id}`);
      return data.data.post as BlogPost;
    },
    enabled: !!id && id !== 'new',
  });
}

export function useAdminBlogStats() {
  return useQuery({
    queryKey: ['admin', 'blog', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/blog/admin/stats');
      return data.data.stats as { draft: number; published: number; archived: number; total: number };
    },
  });
}

export function useCreateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<BlogPost>) => {
      const { data } = await api.post('/blog/posts', dto);
      return data.data.post as BlogPost;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'blog'] });
      qc.invalidateQueries({ queryKey: ['blog', 'posts'] });
    },
  });
}

export function useUpdateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<BlogPost> & { id: string }) => {
      const { data } = await api.patch(`/blog/posts/${id}`, dto);
      return data.data.post as BlogPost;
    },
    onSuccess: (post) => {
      qc.invalidateQueries({ queryKey: ['admin', 'blog'] });
      qc.invalidateQueries({ queryKey: ['blog', 'post', post.slug] });
      qc.invalidateQueries({ queryKey: ['blog', 'posts'] });
    },
  });
}

export function useDeleteBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/blog/posts/${id}`); return id; },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'blog'] });
      qc.invalidateQueries({ queryKey: ['blog', 'posts'] });
    },
  });
}

export function useCreateBlogCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { name: string; slug?: string }) => {
      const { data } = await api.post('/blog/categories', dto);
      return data.data.category as BlogCategory;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blog', 'categories'] }),
  });
}

export function useDeleteBlogCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await api.delete(`/blog/categories/${id}`); return id; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blog', 'categories'] }),
  });
}
