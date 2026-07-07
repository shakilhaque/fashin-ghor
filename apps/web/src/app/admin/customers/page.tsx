'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, Users, ShoppingBag, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn, formatPrice } from '@/lib/utils';
import type { User } from '@ecommerce/types';

function useCustomers(page: number, search: string) {
  return useQuery({
    queryKey: ['admin', 'customers', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20', role: 'CUSTOMER' });
      if (search) params.set('search', search);
      const { data } = await api.get(`/users?${params}`);
      return data as { data: User[]; meta: { total: number; totalPages: number; page: number } };
    },
  });
}

function useCustomerDetail(id: string | null) {
  return useQuery({
    queryKey: ['admin', 'customer', id],
    queryFn: async () => {
      const [userRes, ordersRes] = await Promise.all([
        api.get(`/users/${id}`),
        api.get(`/orders?customerId=${id}&limit=5`),
      ]);
      return {
        user: userRes.data.data.user as User,
        orders: ordersRes.data.data?.orders ?? [],
        totalOrders: ordersRes.data.meta?.total ?? 0,
      };
    },
    enabled: Boolean(id),
  });
}

const ROLE_BADGE: Record<string, string> = {
  CUSTOMER: 'bg-blue-100 text-blue-700',
  ADMIN: 'bg-rose-100 text-rose-700',
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  MANAGER: 'bg-amber-100 text-amber-700',
  SUPPORT: 'bg-teal-100 text-teal-700',
  WAREHOUSE: 'bg-orange-100 text-orange-700',
};

export default function AdminCustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useCustomers(page, search);
  const { data: detail, isLoading: detailLoading } = useCustomerDetail(selectedId);

  const customers = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="flex gap-6 h-full">
      {/* Left — list */}
      <div className={cn('flex-1 min-w-0 space-y-4', selectedId && 'hidden lg:block')}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Customers</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {meta?.total ?? 0} total customers
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
            placeholder="Search by name or email…"
            className="pl-9"
          />
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Role</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Joined</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={4} className="px-4 py-3">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
                      </td>
                    </tr>
                  ))
                : customers.map((c) => (
                    <tr
                      key={c.id}
                      className={cn(
                        'hover:bg-secondary/30 transition-colors cursor-pointer',
                        selectedId === c.id && 'bg-primary/5',
                      )}
                      onClick={() => setSelectedId(c.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                            {c.name?.charAt(0).toUpperCase() ?? '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{c.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', ROLE_BADGE[c.role] ?? ROLE_BADGE.CUSTOMER)}>
                          {c.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedId(c.id); }}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {meta.page} of {meta.totalPages}
            </p>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border disabled:opacity-40 hover:bg-secondary transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border disabled:opacity-40 hover:bg-secondary transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right — detail panel */}
      {selectedId && (
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedId(null)}
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-secondary"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="font-semibold">Customer Details</h2>
          </div>

          {detailLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-secondary" />
              ))}
            </div>
          ) : detail ? (
            <>
              {/* Profile card */}
              <div className="rounded-xl border border-border bg-card p-5 text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                  {detail.user.name?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <h3 className="mt-3 font-semibold text-lg">{detail.user.name}</h3>
                <p className="text-sm text-muted-foreground">{detail.user.email}</p>
                {detail.user.phone && (
                  <p className="text-sm text-muted-foreground">{detail.user.phone}</p>
                )}
                <span className={cn('mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold', ROLE_BADGE[detail.user.role] ?? ROLE_BADGE.CUSTOMER)}>
                  {detail.user.role}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { Icon: ShoppingBag, label: 'Orders', value: detail.totalOrders },
                  { Icon: Users, label: 'Member since', value: new Date(detail.user.createdAt).toLocaleDateString('en', { month: 'short', year: 'numeric' }) },
                ].map(({ Icon, label, value }) => (
                  <div key={label} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-xs">{label}</span>
                    </div>
                    <p className="font-semibold">{value}</p>
                  </div>
                ))}
              </div>

              {/* Recent orders */}
              {detail.orders.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <h4 className="text-sm font-semibold mb-3">Recent Orders</h4>
                  <div className="space-y-2">
                    {detail.orders.map((order: { id: string; orderNumber?: string; status: string; totalAmount: number; createdAt: string }) => (
                      <div key={order.id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">#{order.orderNumber ?? order.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatPrice(order.totalAmount)}</p>
                          <span className="text-xs text-muted-foreground">{order.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
