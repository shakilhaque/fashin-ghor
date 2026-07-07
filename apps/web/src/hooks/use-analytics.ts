'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type AnalyticsPeriod = '7d' | '30d' | '90d' | '1y';

export interface AnalyticsOverview {
  period: AnalyticsPeriod;
  kpis: {
    revenue: number;
    revenueChange: number | null;
    orders: number;
    ordersChange: number | null;
    aov: number;
    aovChange: number | null;
    newCustomers: number;
    newCustomersChange: number | null;
  };
  revenueTrend: { date: string; revenue: number }[];
  customerTrend: { date: string; count: number }[];
  topProducts: { name: string; revenue: number; quantity: number }[];
  categoryRevenue: { name: string; revenue: number }[];
  paymentMix: { method: string; count: number; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
}

export function useAnalyticsOverview(period: AnalyticsPeriod) {
  return useQuery({
    queryKey: ['admin', 'analytics', 'overview', period],
    queryFn: async () => {
      const { data } = await api.get(`/analytics/overview?period=${period}`);
      return data.data as AnalyticsOverview;
    },
    staleTime: 120_000,
  });
}
