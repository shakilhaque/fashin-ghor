'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, MapPin, Clock, CreditCard, Truck } from 'lucide-react';
import {
  useAdminOrder,
  useUpdateOrderStatus,
  useUpdateTracking,
  useUpdatePaymentStatus,
} from '@/hooks/use-admin-orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/lib/utils';

const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];

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

const PAYMENT_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'RETURNED'],
  DELIVERED: ['RETURNED', 'REFUNDED'],
  RETURNED: ['REFUNDED'],
};

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useAdminOrder(id);
  const updateStatus = useUpdateOrderStatus();
  const updateTracking = useUpdateTracking();
  const updatePayment = useUpdatePaymentStatus();

  const [statusNotes, setStatusNotes] = useState('');
  const [tracking, setTracking] = useState('');
  const [trackingNotes, setTrackingNotes] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Order not found</p>
        <Button asChild className="mt-4"><Link href="/admin/orders">Back to orders</Link></Button>
      </div>
    );
  }

  const allowedNext = VALID_TRANSITIONS[order.status] ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/orders"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="font-display text-xl font-bold">{order.orderNumber}</h1>
          <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <StatusChip label={order.status} colorMap={STATUS_COLORS} />
          <StatusChip label={order.paymentStatus} colorMap={PAYMENT_COLORS} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Items */}
          <Section title="Order Items" Icon={Package}>
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-start gap-4 py-4">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.productName} className="h-14 w-14 rounded-lg object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.productName}</p>
                    {item.variantLabel && <p className="text-xs text-muted-foreground">{item.variantLabel}</p>}
                    <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">{formatPrice(item.totalPrice)}</p>
                    <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatPrice(order.subtotal)} />
              {order.discount > 0 && <Row label={`Coupon (${order.couponCode})`} value={`-${formatPrice(order.discount)}`} cls="text-primary" />}
              <Row label="Shipping" value={formatPrice(order.shippingCost)} />
              {order.tax > 0 && <Row label="Tax" value={formatPrice(order.tax)} />}
              <Row label="Total" value={formatPrice(order.total)} bold />
            </div>
          </Section>

          {/* Customer + Address */}
          <Section title="Customer" Icon={MapPin}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Customer</p>
                <p className="font-medium">{order.user?.name}</p>
                <p className="text-sm text-muted-foreground">{order.user?.email}</p>
                {order.user?.phone && <p className="text-sm text-muted-foreground">{order.user.phone}</p>}
              </div>
              {order.address && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Delivery Address</p>
                  <p className="font-medium">{(order.address as any).recipientName}</p>
                  <p className="text-sm text-muted-foreground">{(order.address as any).phone}</p>
                  <p className="text-sm text-muted-foreground">
                    {(order.address as any).addressLine1}, {(order.address as any).city}, {(order.address as any).state}
                  </p>
                </div>
              )}
            </div>
            {order.notes && (
              <div className="mt-3 rounded-lg bg-secondary p-3 text-sm">
                <span className="font-medium">Notes: </span>{order.notes}
              </div>
            )}
          </Section>

          {/* Status history */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <Section title="Status Timeline" Icon={Clock}>
              <ol className="relative ml-3 border-l border-border pl-4 space-y-4">
                {order.statusHistory.map((h) => (
                  <li key={h.id} className="text-sm">
                    <div className="absolute -left-[5px] h-2.5 w-2.5 rounded-full bg-primary" />
                    <div className="flex items-center gap-2">
                      <StatusChip label={h.status} colorMap={STATUS_COLORS} />
                    </div>
                    {h.notes && <p className="mt-0.5 text-muted-foreground">{h.notes}</p>}
                    <p className="text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleString()}</p>
                  </li>
                ))}
              </ol>
            </Section>
          )}
        </div>

        {/* Action panel */}
        <div className="space-y-4">
          {/* Update status */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="font-medium">Update Status</h3>
            {allowedNext.length === 0 ? (
              <p className="text-sm text-muted-foreground">No further status transitions available.</p>
            ) : (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Notes (optional)</Label>
                  <Input
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    placeholder="Add a note…"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  {allowedNext.map((next) => (
                    <Button
                      key={next}
                      variant={next === 'CANCELLED' || next === 'RETURNED' ? 'outline' : 'default'}
                      size="sm"
                      disabled={updateStatus.isPending}
                      onClick={() => updateStatus.mutate({ id: order.id, status: next, notes: statusNotes || undefined })}
                    >
                      Mark as {next}
                    </Button>
                  ))}
                </div>
                {updateStatus.isError && (
                  <p className="text-xs text-destructive">
                    {(updateStatus.error as any)?.response?.data?.message ?? 'Failed to update status'}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Tracking number */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="flex items-center gap-2 font-medium">
              <Truck className="h-4 w-4" /> Tracking
            </h3>
            {order.trackingNumber && (
              <p className="rounded bg-secondary px-2 py-1 font-mono text-sm">{order.trackingNumber}</p>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Tracking Number</Label>
              <Input
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder={order.trackingNumber ?? 'Enter tracking #…'}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Note (optional)</Label>
              <Input
                value={trackingNotes}
                onChange={(e) => setTrackingNotes(e.target.value)}
                placeholder="e.g. Shipped via Sundarban Courier"
              />
            </div>
            <Button
              size="sm"
              className="w-full"
              disabled={!tracking || updateTracking.isPending}
              onClick={() => {
                updateTracking.mutate({ id: order.id, trackingNumber: tracking, notes: trackingNotes || undefined });
                setTracking('');
                setTrackingNotes('');
              }}
            >
              Save Tracking
            </Button>
          </div>

          {/* Payment status */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="flex items-center gap-2 font-medium">
              <CreditCard className="h-4 w-4" /> Payment
            </h3>
            <p className="text-sm text-muted-foreground">Method: <span className="font-medium text-foreground">{order.paymentMethod}</span></p>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_STATUSES.map((ps) => (
                <Button
                  key={ps}
                  size="sm"
                  variant={order.paymentStatus === ps ? 'default' : 'outline'}
                  disabled={order.paymentStatus === ps || updatePayment.isPending}
                  onClick={() => updatePayment.mutate({ id: order.id, paymentStatus: ps })}
                >
                  {ps}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, Icon, children }: { title: string; Icon: typeof Package; children: React.ReactNode }) {
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

function Row({ label, value, bold, cls }: { label: string; value: string; bold?: boolean; cls?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${bold ? 'font-semibold' : ''} ${cls ?? ''}`}>{value}</span>
    </div>
  );
}

function StatusChip({ label, colorMap }: { label: string; colorMap: Record<string, string> }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[label] ?? 'bg-secondary'}`}>
      {label}
    </span>
  );
}
