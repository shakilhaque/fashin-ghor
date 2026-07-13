import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Combo } from '@ecommerce/types';

export interface ComboInput {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  price: number;
  comparePrice?: number;
  isActive?: boolean;
  items: { productId: string; quantity?: number }[];
}

export function useCombos() {
  return useQuery({
    queryKey: ['combos', 'active'],
    queryFn: async () => {
      const { data } = await api.get('/combos');
      return data.data.combos as Combo[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminCombos() {
  return useQuery({
    queryKey: ['combos', 'admin'],
    queryFn: async () => {
      const { data } = await api.get('/combos/admin/all');
      return data.data.combos as Combo[];
    },
  });
}

export function useCombo(slug: string) {
  return useQuery({
    queryKey: ['combos', 'detail', slug],
    queryFn: async () => {
      const { data } = await api.get(`/combos/${slug}`);
      return data.data.combo as Combo;
    },
    enabled: Boolean(slug),
  });
}

export function useCreateCombo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ComboInput) => {
      const { data } = await api.post('/combos', payload);
      return data.data.combo as Combo;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['combos'] });
    },
  });
}

export function useUpdateCombo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<ComboInput> & { id: string }) => {
      const { data } = await api.patch(`/combos/${id}`, payload);
      return data.data.combo as Combo;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['combos'] });
    },
  });
}

export function useDeleteCombo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/combos/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['combos'] });
    },
  });
}
