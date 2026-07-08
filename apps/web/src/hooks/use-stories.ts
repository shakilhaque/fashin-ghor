import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Story } from '@ecommerce/types';

export function useStories() {
  return useQuery({
    queryKey: ['stories', 'active'],
    queryFn: async () => {
      const { data } = await api.get('/stories');
      return data.data.stories as Story[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useAdminStories() {
  return useQuery({
    queryKey: ['stories', 'all'],
    queryFn: async () => {
      const { data } = await api.get('/stories/admin/all');
      return data.data.stories as Story[];
    },
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title: string;
      coverImage: string;
      subtitle?: string;
      isActive?: boolean;
      position?: number;
      scheduledAt?: string;
      expiresAt?: string;
      productId?: string;
    }) => {
      const { data } = await api.post('/stories', payload);
      return data.data.story as Story;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stories'] }),
  });
}

export function useUpdateStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; [key: string]: unknown }) => {
      const { data } = await api.patch(`/stories/${id}`, payload);
      return data.data.story as Story;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stories'] }),
  });
}

export function useDeleteStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/stories/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stories'] }),
  });
}

export function useAddSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      storyId,
      ...payload
    }: {
      storyId: string;
      mediaUrl: string;
      mediaType?: 'IMAGE' | 'VIDEO';
      duration?: number;
      caption?: string;
      productId?: string;
      position?: number;
    }) => {
      const { data } = await api.post(`/stories/${storyId}/slides`, payload);
      return data.data.slide;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stories'] }),
  });
}

export function useUpdateSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      storyId,
      slideId,
      ...payload
    }: {
      storyId: string;
      slideId: string;
      [key: string]: unknown;
    }) => {
      const { data } = await api.patch(`/stories/${storyId}/slides/${slideId}`, payload);
      return data.data.slide;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stories'] }),
  });
}

export function useDeleteSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ storyId, slideId }: { storyId: string; slideId: string }) => {
      await api.delete(`/stories/${storyId}/slides/${slideId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stories'] }),
  });
}

export function useTrackStoryView() {
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/stories/${id}/view`);
    },
  });
}
