'use client';

import Link from 'next/link';
import {
  TrendingUp, ShoppingBag, Users, Package, Star,
  AlertTriangle, ArrowRight, Clock, CheckCircle, RefreshCw,
} from 'lucide-react';
import { useDashboardStats, type SalesChartPoint } from '@/hooks/use-dashboard';
import { formatPrice } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  PENDING:   'text-amber-700  bg-amber-50  border-amber-200',
  CONFIRMED: 'text-blue-700   bg-blue-50   border-blue-200',
  PACKED:    'text-purple-700 bg-purple-50 border-purple-200',
  SHIPPED:   'text-indigo-700 bg-indigo-50 border-indigo-200',
  DELIVERED: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  CANCELLED: 'text-red-700    bg-red-50    border-red-200',
  RETURNED:  'text-orange-700 bg-orange-50 border-orange-200',
  REFUNDED:  'text-gray-700   bg-gray-50   border-gray-200',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? 'bg-secondary text-muted-foreground border-border'}`}>
      {status}
    </span>
  );
}

function KpiCard({
  label, value, sub, icon: Icon, iconBg, loading,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconBg: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-36 animate-pulse rounded bg-secondary/60" />
      ) : (
        <p className="font-display text-2xl font-bold tracking-tight">{value}</p>
      )}
      {sub && (
        <p className="text-xs text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}

function RevenueBarChart({ data }: { data: SalesChartPoint[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const barW = 28;
  const gap = 6;
  const chartH = 72;
  const totalW = data.length * (barW + gap) - gap;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${totalW + 8} ${chartH + 18}`}
        className="w-full"
        style={{ minWidth: totalW }}
      >
        {data.map((d, i) => {
          const barH = Math.max((d.revenue / max) * chartH, 2);
          const x = i * (barW + gap) + 4;
          const y = chartH - barH;
          const label = new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
          return (
            <g key={d.date}>
              <rect x={x} y={y} width={barW} height={barH} rx={3} className="fill-primary/75" />
              <text
                x={x + barW / 2}
                y={chartH + 13}
                textAnchor="middle"
                fontSize={9}
                className="fill-muted-foreground"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED'];

export default function AdminDashboardPage() {
  const { data: stats, isLoading, refetch, isFetching } = useDashboardStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your store performance.</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Total Revenue"
          value={formatPrice(stats?.revenue.total ?? 0)}
          sub={`Today: ${formatPrice(stats?.revenue.today ?? 0)} · Month: ${formatPrice(stats?.revenue.month ?? 0)}`}
          icon={TrendingUp}
          iconBg="bg-emerald-100 text-emerald-600"
          loading={isLoading}
        />
        <KpiCard
          label="Total Orders"
          value={String(stats?.orders.total ?? 0)}
          sub={`${stats?.orders.pending ?? 0} pending confirmation`}
          icon={ShoppingBag}
          iconBg="bg-blue-100 text-blue-600"
          loading={isLoading}
        />
        <KpiCard
          label="Customers"
          value={String(stats?.customers.total ?? 0)}
          sub={`+${stats?.customers.newThisMonth ?? 0} this month · +${stats?.customers.newToday ?? 0} today`}
          icon={Users}
          iconBg="bg-purple-100 text-purple-600"
          loading={isLoading}
        />
        <KpiCard
          label="Active Products"
          value={String(stats?.products.total ?? 0)}
          sub={`${stats?.products.lowStock ?? 0} low stock · ${stats?.products.outOfStock ?? 0} out of stock`}
          icon={Package}
          iconBg="bg-amber-100 text-amber-600"
          loading={isLoading}
        />
      </div>

      {/* Alerts bar */}
      {!isLoading && (
        <div className="flex flex-wrap gap-2">
          {(stats?.products.outOfStock ?? 0) > 0 && (
            <Link
              href="/admin/products"
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 hover:bg-red-100 transition-colors"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {stats!.products.outOfStock} out-of-stock products
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
          {(stats?.products.lowStock ?? 0) > 0 && (
            <Link
              href="/admin/products"
              className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {stats!.products.lowStock} low-stock products
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
          {(stats?.pendingReviews ?? 0) > 0 && (
            <Link
              href="/admin/reviews"
              className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs text-purple-700 hover:bg-purple-100 transition-colors"
            >
              <Star className="h-3.5 w-3.5" />
              {stats!.pendingReviews} reviews pending moderation
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      )}

      {/* Revenue chart + Order status */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-background p-5">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-sm">Revenue — Last 7 Days</h2>
              {isLoading ? (
                <div className="mt-1 h-7 w-32 animate-pulse rounded bg-secondary/60" />
              ) : (
                <p className="mt-1 font-display text-2xl font-bold">{formatPrice(stats?.revenue.week ?? 0)}</p>
              )}
            </div>
            <span className="text-xs text-muted-foreground">This week</span>
          </div>
          {isLoading ? (
            <div className="h-20 animate-pulse rounded-lg bg-secondary/50" />
          ) : (
            <RevenueBarChart data={stats?.salesChart ?? []} />
          )}
        </div>

        {/* Orders by status */}
        <div className="rounded-xl border border-border bg-background p-5">
          <h2 className="font-semibold text-sm mb-4">Orders by Status</h2>
          <div className="space-y-1.5">
            {ORDER_STATUSES.map((s) => (
              <Link
                key={s}
                href={`/admin/orders?status=${s}`}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-secondary/60 transition-colors group"
              >
                <StatusBadge status={s} />
                <span className="text-sm font-semibold tabular-nums">
                  {isLoading ? '—' : (stats?.orders.counts[s] ?? 0)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Top selling + Recent orders */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top selling */}
        <div className="rounded-xl border border-border bg-background p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-sm">Top Selling Products</h2>
            <span className="text-xs text-muted-foreground">Last 30 days</span>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-11 animate-pulse rounded-lg bg-secondary/50" />
              ))}
            </div>
          ) : !stats?.topSelling.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ShoppingBag className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No sales data yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {stats.topSelling.map((p, i) => (
                <div key={p.productId} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-secondary/40 transition-colors">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.productName}</p>
                    <p className="text-xs text-muted-foreground">{p.quantitySold} units</p>
                  </div>
                  <span className="text-sm font-semibold shrink-0">{formatPrice(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="rounded-xl border border-border bg-background p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-sm">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-secondary/50" />
              ))}
            </div>
          ) : !stats?.recentOrders.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Package className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {stats.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between rounded-lg px-2 py-2.5 hover:bg-secondary/40 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground truncate">{order.user.name}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <StatusBadge status={order.status} />
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatPrice(order.total)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick action links */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/admin/orders?status=PENDING"
          className="flex items-center gap-4 rounded-xl border border-border bg-background p-4 hover:border-primary transition-colors group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 group-hover:bg-amber-100 transition-colors">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="font-medium text-sm">Pending Orders</p>
            <p className="text-xs text-muted-foreground">
              {isLoading ? '—' : stats?.orders.counts['PENDING'] ?? 0} need confirmation
            </p>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
        </Link>
        <Link
          href="/admin/orders?status=SHIPPED"
          className="flex items-center gap-4 rounded-xl border border-border bg-background p-4 hover:border-primary transition-colors group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
            <ShoppingBag className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-medium text-sm">Shipped Orders</p>
            <p className="text-xs text-muted-foreground">
              {isLoading ? '—' : stats?.orders.counts['SHIPPED'] ?? 0} out for delivery
            </p>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
        </Link>
        <Link
          href="/admin/orders?status=DELIVERED"
          className="flex items-center gap-4 rounded-xl border border-border bg-background p-4 hover:border-primary transition-colors group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-medium text-sm">Delivered Orders</p>
            <p className="text-xs text-muted-foreground">
              {isLoading ? '—' : stats?.orders.counts['DELIVERED'] ?? 0} completed
            </p>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
        </Link>
      </div>
    </div>
  );
}
