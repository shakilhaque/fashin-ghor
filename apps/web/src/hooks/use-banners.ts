import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface PromoBanner {
  id: string;
  title: string | null;
  subtitle: string | null;
  badgeText: string | null;
  imageUrl: string;
  linkUrl: string | null;
  linkLabel: string | null;
  type: 'HERO' | 'SLIDER' | 'STATIC';
  position: number;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useBanners() {
  return useQuery({
    queryKey: ['banners', 'active'],
    queryFn: async () => {
      const { data } = await api.get('/banners');
      return (data.data?.data ?? []) as PromoBanner[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminBanners() {
  return useQuery({
    queryKey: ['admin', 'banners'],
    queryFn: async () => {
      const { data } = await api.get('/banners/admin/all');
      return (data.data?.data ?? []) as PromoBanner[];
    },
  });
}

export function useCreateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<PromoBanner>) => {
      const { data } = await api.post('/banners', payload);
      return data.data as PromoBanner;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'banners'] }),
  });
}

export function useUpdateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<PromoBanner> & { id: string }) => {
      const { data } = await api.patch(`/banners/${id}`, payload);
      return data.data as PromoBanner;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'banners'] });
      qc.invalidateQueries({ queryKey: ['banners', 'active'] });
    },
  });
}

export function useDeleteBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/banners/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'banners'] });
      qc.invalidateQueries({ queryKey: ['banners', 'active'] });
    },
  });
}
