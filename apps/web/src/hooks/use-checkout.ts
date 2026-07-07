'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PaymentMethod } from '@ecommerce/types';

export interface ShippingRate {
  id: string;
  name: string;
  rate: number;
  isFree: boolean;
  minOrderAmt: number;
  zone: { name: string; countries: string[] };
}

export interface CheckoutSummary {
  items: unknown[];
  itemCount: number;
  subtotal: number;
  shippingCost: number;
  shippingRateName: string;
  discount: number;
  couponCode: string | null;
  tax: number;
  total: number;
}

export interface PlacedOrder {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  tax: number;
  total: number;
  couponCode: string | null;
  items: unknown[];
  createdAt: string;
}

export function useShippingRates() {
  return useQuery({
    queryKey: ['shipping', 'rates'],
    queryFn: async () => {
      const { data } = await api.get('/shipping/rates');
      return data.data.rates as ShippingRate[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useCheckoutSummary() {
  return useMutation({
    mutationFn: async (vars: { shippingRateId: string; couponCode?: string }) => {
      const { data } = await api.post('/checkout/summary', vars);
      return data.data.summary as CheckoutSummary;
    },
  });
}

export function usePlaceOrder() {
  return useMutation({
    mutationFn: async (vars: {
      addressId: string;
      shippingRateId: string;
      paymentMethod: PaymentMethod;
      couponCode?: string;
      notes?: string;
    }) => {
      const { data } = await api.post('/checkout/place-order', vars);
      return data.data.order as PlacedOrder;
    },
  });
}

export function useOrders(page = 1) {
  return useQuery({
    queryKey: ['orders', page],
    queryFn: async () => {
      const { data } = await api.get(`/checkout/orders?page=${page}`);
      return data as { data: { orders: unknown[] }; meta: { total: number; totalPages: number } };
    },
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data } = await api.get(`/checkout/orders/${orderId}`);
      return data.data.order;
    },
    enabled: Boolean(orderId),
  });
}
