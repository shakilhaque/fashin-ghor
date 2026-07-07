import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Address } from '@ecommerce/types';

export type AddressInput = {
  label?: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
};

const ADDRESSES_KEY = ['addresses'];

export function useAddresses() {
  return useQuery({
    queryKey: ADDRESSES_KEY,
    queryFn: async () => {
      const { data } = await api.get('/users/me/addresses');
      return data.data.addresses as Address[];
    },
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddressInput) => {
      const { data } = await api.post('/users/me/addresses', input);
      return data.data.address as Address;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY }),
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<AddressInput> }) => {
      const { data } = await api.patch(`/users/me/addresses/${id}`, input);
      return data.data.address as Address;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY }),
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/me/addresses/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY }),
  });
}
