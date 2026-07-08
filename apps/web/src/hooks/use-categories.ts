import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Category } from '@ecommerce/types';

export function useCategoryTree() {
  return useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data.data.categories as Category[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: ['categories', 'detail', slug],
    queryFn: async () => {
      const { data } = await api.get(`/categories/${slug}`);
      return data.data.category as Category & { parent: Category | null; children: Category[] };
    },
    enabled: Boolean(slug),
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ['categories', 'admin'],
    queryFn: async () => {
      const { data } = await api.get('/categories/admin/all');
      return data.data.categories as Category[];
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Category>) => {
      const { data } = await api.post('/categories', payload);
      return data.data.category as Category;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Category> & { id: string }) => {
      const { data } = await api.patch(`/categories/${id}`, payload);
      return data.data.category as Category;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
