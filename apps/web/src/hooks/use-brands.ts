import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export function useAdminBrands() {
  return useQuery({
    queryKey: ['brands', 'admin'],
    queryFn: async () => {
      const { data } = await api.get('/brands/admin/all');
      return data.data.brands as Brand[];
    },
  });
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Brand>) => {
      const { data } = await api.post('/brands', payload);
      return data.data.brand as Brand;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['brands'] });
    },
  });
}

export function useUpdateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Brand> & { id: string }) => {
      const { data } = await api.patch(`/brands/${id}`, payload);
      return data.data.brand as Brand;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['brands'] });
    },
  });
}

export function useDeleteBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/brands/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['brands'] });
    },
  });
}
