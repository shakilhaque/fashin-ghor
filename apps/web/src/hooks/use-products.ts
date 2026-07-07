import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Product, ProductListQuery } from '@ecommerce/types';

interface ProductListResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useProducts(query: ProductListQuery = {}) {
  return useQuery({
    queryKey: ['products', 'list', query],
    queryFn: async (): Promise<ProductListResult> => {
      const { data } = await api.get('/products', { params: query });
      return {
        products: data.data.products as Product[],
        total: data.meta.total,
        page: data.meta.page,
        limit: data.meta.limit,
        totalPages: data.meta.totalPages,
      };
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['products', 'detail', slug],
    queryFn: async () => {
      const { data } = await api.get(`/products/${slug}`);
      return data.data.product as Product;
    },
    enabled: Boolean(slug),
  });
}
