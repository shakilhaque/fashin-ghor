'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Package, MapPin, Clock } from 'lucide-react';
import { useOrder } from '@/hooks/use-checkout';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(id);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="h-8 w-48 mx-auto animate-pulse rounded bg-muted" />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Order not found</h1>
        <Button asChild className="mt-8"><Link href="/shop">Go to Shop</Link></Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      {/* Hero */}
      <div className="mb-10 flex flex-col items-center text-center">
        <CheckCircle2 className="mb-4 h-16 w-16 text-primary" />
        <h1 className="font-display text-3xl font-bold">Order Placed!</h1>
        <p className="mt-2 text-muted-foreground">
          Thank you for your order. We&apos;ll send you a confirmation shortly.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Order #</span>
          <code className="rounded bg-secondary px-2 py-1 text-sm font-mono font-semibold">{order.orderNumber}</code>
        </div>
        <div className="mt-2 flex gap-2">
          <StatusBadge label={order.status} colorMap={STATUS_COLORS} />
          <StatusBadge label={order.paymentStatus} colorMap={PAYMENT_STATUS_COLORS} prefix="Payment:" />
        </div>
      </div>

      <div className="space-y-6">
        {/* Items */}
        <Section title="Items" Icon={Package}>
          <div className="divide-y divide-border">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex items-start gap-4 py-4">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="h-16 w-16 rounded-lg object-contain bg-secondary"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium">{item.productName}</p>
                  {item.variantLabel && (
                    <p className="text-sm text-muted-foreground">{item.variantLabel}</p>
                  )}
                  <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatPrice(item.totalPrice)}</p>
                  <p className="text-sm text-muted-foreground">×{item.quantity} @ {formatPrice(item.unitPrice)}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Delivery address */}
        {order.address && (
          <Section title="Delivery Address" Icon={MapPin}>
            <div className="text-sm text-muted-foreground space-y-0.5">
              <p className="font-medium text-foreground">{order.address.recipientName}</p>
              <p>{order.address.phone}</p>
              <p>
                {order.address.addressLine1}
                {order.address.addressLine2 ? `, ${order.address.addressLine2}` : ''}
              </p>
              <p>{order.address.city}, {order.address.state} {order.address.postalCode}</p>
              <p>{order.address.country}</p>
            </div>
          </Section>
        )}

        {/* Order summary */}
        <Section title="Order Summary" Icon={Clock}>
          <div className="space-y-2 text-sm">
            <SummaryRow label="Subtotal" value={formatPrice(order.subtotal)} />
            {order.discount > 0 && (
              <SummaryRow
                label={`Coupon (${order.couponCode})`}
                value={`-${formatPrice(order.discount)}`}
                valueClass="text-primary"
              />
            )}
            <SummaryRow label="Shipping" value={formatPrice(order.shippingCost)} />
            {order.tax > 0 && <SummaryRow label="Tax" value={formatPrice(order.tax)} />}
            <div className="border-t border-border pt-2">
              <SummaryRow label="Total" value={formatPrice(order.total)} labelClass="font-semibold" valueClass="font-semibold" />
            </div>
            <SummaryRow label="Payment Method" value={order.paymentMethod} />
            {order.notes && <SummaryRow label="Notes" value={order.notes} />}
          </div>
        </Section>

        {/* Status history */}
        {order.statusHistory?.length > 0 && (
          <Section title="Order Timeline" Icon={Clock}>
            <ol className="relative ml-3 border-l border-border pl-4 space-y-4">
              {order.statusHistory.map((h: any) => (
                <li key={h.id} className="text-sm">
                  <div className="absolute -left-[5px] h-2.5 w-2.5 rounded-full bg-primary" />
                  <p className="font-medium">{h.status}</p>
                  {h.notes && <p className="text-muted-foreground">{h.notes}</p>}
                  <p className="text-xs text-muted-foreground">
                    {new Date(h.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ol>
          </Section>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild className="flex-1">
          <Link href="/shop">Continue Shopping</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href="/account/orders">View All Orders</Link>
        </Button>
      </div>
    </main>
  );
}

function Section({
  title,
  Icon,
  children,
}: {
  title: string;
  Icon: typeof Package;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2 font-display font-semibold">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </div>
      {children}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  labelClass,
  valueClass,
}: {
  label: string;
  value: string;
  labelClass?: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between">
      <span className={labelClass ?? 'text-muted-foreground'}>{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

function StatusBadge({
  label,
  colorMap,
  prefix,
}: {
  label: string;
  colorMap: Record<string, string>;
  prefix?: string;
}) {
  const cls = colorMap[label] ?? 'bg-gray-100 text-gray-800';
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${cls}`}>
      {prefix ? `${prefix} ${label}` : label}
    </span>
  );
}
