'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface PaymentRecord {
  id: string;
  orderId: string;
  method: string;
  status: string;
  amount: number;
  currency: string;
  gatewayTxnId: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface InitiatePaymentResult {
  method: string;
  status: string;
  redirectUrl?: string;
  clientSecret?: string;
  gatewayTxnId?: string;
  message?: string;
}

export function usePaymentByOrder(orderId: string, enabled = true) {
  return useQuery({
    queryKey: ['payment', orderId],
    queryFn: async () => {
      const { data } = await api.get(`/payments/order/${orderId}`);
      return data.data.payment as PaymentRecord | null;
    },
    enabled: Boolean(orderId) && enabled,
    refetchInterval: (query) => {
      // Poll every 3s if payment is still pending
      const data = query.state.data;
      return data && data.status === 'PENDING' ? 3000 : false;
    },
  });
}

export function useInitiatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.post('/payments/initiate', { orderId });
      return data.data.payment as InitiatePaymentResult;
    },
    onSuccess: (_, orderId) => {
      qc.invalidateQueries({ queryKey: ['payment', orderId] });
    },
  });
}

export function useSimulatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await api.post(`/payments/simulate/${orderId}`);
      return data.data.result;
    },
    onSuccess: (_, orderId) => {
      qc.invalidateQueries({ queryKey: ['payment', orderId] });
      qc.invalidateQueries({ queryKey: ['my-order', orderId] });
      qc.invalidateQueries({ queryKey: ['order', orderId] });
      qc.invalidateQueries({ queryKey: ['admin', 'order', orderId] });
    },
  });
}
