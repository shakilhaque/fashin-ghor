'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface DashboardStats {
  revenue: {
    today: number;
    week: number;
    month: number;
    total: number;
  };
  orders: {
    total: number;
    counts: Record<string, number>;
    pending: number;
  };
  customers: {
    total: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  products: {
    total: number;
    lowStock: number;
    outOfStock: number;
  };
  pendingReviews: number;
  recentOrders: RecentOrder[];
  topSelling: TopProduct[];
  salesChart: SalesChartPoint[];
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

export interface TopProduct {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface SalesChartPoint {
  date: string;
  revenue: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/stats');
      return data.data.stats as DashboardStats;
    },
    staleTime: 60_000,
    refetchInterval: 300_000,
  });
}
