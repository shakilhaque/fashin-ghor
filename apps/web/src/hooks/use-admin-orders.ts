'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface AdminOrder {
  id: string;
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
  trackingNumber: string | null;
  notes: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; email: string; phone?: string | null };
  address?: Record<string, any> | null;
  items: AdminOrderItem[];
  statusHistory?: { id: string; status: string; notes: string | null; createdAt: string }[];
  payments?: any[];
}

export interface AdminOrderItem {
  id: string;
  productName: string;
  variantLabel: string | null;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl: string | null;
}

export interface OrderStats {
  counts: Record<string, number>;
  revenue: { today: number; week: number; month: number; total: number };
  recentOrders: AdminOrder[];
}

export interface ListOrdersParams {
  status?: string;
  paymentStatus?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export function useAdminOrders(params: ListOrdersParams = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && query.set(k, String(v)));

  return useQuery({
    queryKey: ['admin', 'orders', params],
    queryFn: async () => {
      const { data } = await api.get(`/orders?${query}`);
      return data as {
        data: { orders: AdminOrder[] };
        meta: { total: number; page: number; limit: number; totalPages: number };
      };
    },
  });
}

export function useAdminOrder(id: string) {
  return useQuery({
    queryKey: ['admin', 'order', id],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${id}`);
      return data.data.order as AdminOrder;
    },
    enabled: Boolean(id),
  });
}

export function useOrderStats() {
  return useQuery({
    queryKey: ['admin', 'order-stats'],
    queryFn: async () => {
      const { data } = await api.get('/orders/stats');
      return data.data.stats as OrderStats;
    },
    staleTime: 60_000,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { data } = await api.patch(`/orders/${id}/status`, { status, notes });
      return data.data.order as AdminOrder;
    },
    onSuccess: (order) => {
      qc.setQueryData(['admin', 'order', order.id], order);
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      qc.invalidateQueries({ queryKey: ['admin', 'order-stats'] });
    },
  });
}

export function useUpdateTracking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, trackingNumber, notes }: { id: string; trackingNumber: string; notes?: string }) => {
      const { data } = await api.patch(`/orders/${id}/tracking`, { trackingNumber, notes });
      return data.data.order as AdminOrder;
    },
    onSuccess: (order) => {
      qc.setQueryData(['admin', 'order', order.id], order);
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
}

export function useUpdatePaymentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, paymentStatus }: { id: string; paymentStatus: string }) => {
      const { data } = await api.patch(`/orders/${id}/payment-status`, { paymentStatus });
      return data.data.order as AdminOrder;
    },
    onSuccess: (order) => {
      qc.setQueryData(['admin', 'order', order.id], order);
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
}

// Customer hooks (uses /orders/my/*)
export function useMyOrders(page = 1) {
  return useQuery({
    queryKey: ['my-orders', page],
    queryFn: async () => {
      const { data } = await api.get(`/orders/my/list?page=${page}`);
      return data as {
        data: { orders: AdminOrder[] };
        meta: { total: number; page: number; limit: number; totalPages: number };
      };
    },
  });
}

export function useMyOrder(id: string) {
  return useQuery({
    queryKey: ['my-order', id],
    queryFn: async () => {
      const { data } = await api.get(`/orders/my/${id}`);
      return data.data.order as AdminOrder;
    },
    enabled: Boolean(id),
  });
}
