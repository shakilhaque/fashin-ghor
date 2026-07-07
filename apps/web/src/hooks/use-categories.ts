import { useQuery } from '@tanstack/react-query';
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
