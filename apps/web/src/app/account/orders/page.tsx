'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMyOrders } from '@/hooks/use-admin-orders';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PACKED: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  RETURNED: 'bg-orange-100 text-orange-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};

export default function AccountOrdersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyOrders(page);
  const orders = data?.data.orders ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">My Orders</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No orders yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Your order history will appear here.</p>
          <Button asChild className="mt-5">
            <Link href="/shop">Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/order/${order.id}`}
              className="block rounded-xl border border-border bg-card p-5 hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">{order.orderNumber}</code>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? 'bg-secondary'}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()} · {order.paymentMethod}
                  </p>
                  {/* Item preview */}
                  {(order.items as any[]).length > 0 && (
                    <p className="mt-1 text-sm text-muted-foreground truncate">
                      {(order.items as any[])[0]?.productName}
                      {(order.items as any[]).length > 1 && ` +${(order.items as any[]).length - 1} more`}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold">{formatPrice(order.total)}</p>
                  {order.trackingNumber && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Track: <span className="font-mono">{order.trackingNumber}</span>
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
