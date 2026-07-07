'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Cart } from '@ecommerce/types';

const CART_KEY = ['cart'];

async function fetchCart(): Promise<Cart> {
  const { data } = await api.get('/cart');
  return data.data.cart as Cart;
}

export function useCart() {
  return useQuery({ queryKey: CART_KEY, queryFn: fetchCart, staleTime: 30_000 });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { productId: string; variantId?: string; quantity?: number }) =>
      api.post('/cart/items', vars).then((r) => r.data.data.cart as Cart),
    onSuccess: (cart) => qc.setQueryData(CART_KEY, cart),
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      api.patch(`/cart/items/${itemId}`, { quantity }).then((r) => r.data.data.cart as Cart),
    onSuccess: (cart) => qc.setQueryData(CART_KEY, cart),
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) =>
      api.delete(`/cart/items/${itemId}`).then((r) => r.data.data.cart as Cart),
    onSuccess: (cart) => qc.setQueryData(CART_KEY, cart),
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete('/cart'),
    onSuccess: () => qc.setQueryData(CART_KEY, { id: null, items: [], subtotal: 0, itemCount: 0, discount: 0, shipping: 0, tax: 0, total: 0, couponCode: null }),
  });
}
