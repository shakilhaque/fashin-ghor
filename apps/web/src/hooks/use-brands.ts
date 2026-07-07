import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Brand } from '@ecommerce/types';

export function useBrands() {
  return useQuery({
    queryKey: ['brands', 'list'],
    queryFn: async () => {
      const { data } = await api.get('/brands');
      return data.data.brands as Brand[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useBrand(slug: string) {
  return useQuery({
    queryKey: ['brands', 'detail', slug],
    queryFn: async () => {
      const { data } = await api.get(`/brands/${slug}`);
      return data.data.brand as Brand;
    },
    enabled: Boolean(slug),
  });
}
