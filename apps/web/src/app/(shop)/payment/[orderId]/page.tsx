'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import { usePaymentByOrder, useInitiatePayment, useSimulatePayment } from '@/hooks/use-payments';
import { useMyOrder } from '@/hooks/use-admin-orders';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';

const STATUS_ICONS = {
  PAID: CheckCircle2,
  FAILED: XCircle,
  PENDING: Clock,
  REFUNDED: RefreshCw,
};

const STATUS_COLORS = {
  PAID: 'text-green-600',
  FAILED: 'text-destructive',
  PENDING: 'text-yellow-600',
  REFUNDED: 'text-muted-foreground',
};

export default function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlStatus = searchParams.get('status'); // 'success' | 'failed' | 'cancelled' set by gateway redirect

  const { data: order, isLoading: orderLoading } = useMyOrder(orderId);
  const { data: payment, isLoading: paymentLoading } = usePaymentByOrder(orderId);
  const initiate = useInitiatePayment();
  const simulate = useSimulatePayment();

  const [initiated, setInitiated] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const isLoading = orderLoading || paymentLoading;
  const paymentStatus = payment?.status ?? (urlStatus === 'success' ? 'PAID' : urlStatus === 'failed' ? 'FAILED' : 'PENDING');
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (urlStatus && !payment) return;
    if (payment?.status !== 'PAID') return;
    const t = setTimeout(() => router.push(`/order/${orderId}`), 3000);
    return () => clearTimeout(t);
  }, [payment?.status, urlStatus, orderId, router]);

  async function handleInitiate() {
    const result = await initiate.mutateAsync(orderId);
    setInitiated(true);
    if (result.redirectUrl) {
      setRedirectUrl(result.redirectUrl);
      // Redirect immediately for gateway-based flows
      window.location.href = result.redirectUrl;
    } else if (result.clientSecret) {
      setClientSecret(result.clientSecret);
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="h-8 w-48 mx-auto animate-pulse rounded bg-muted" />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-muted-foreground">Order not found.</p>
        <Button asChild className="mt-4"><Link href="/account/orders">My Orders</Link></Button>
      </main>
    );
  }

  const StatusIcon = STATUS_ICONS[paymentStatus as keyof typeof STATUS_ICONS] ?? Clock;
  const statusColor = STATUS_COLORS[paymentStatus as keyof typeof STATUS_COLORS] ?? 'text-muted-foreground';

  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-6">
        <StatusIcon className={`mx-auto h-14 w-14 ${statusColor}`} />

        {paymentStatus === 'PAID' && (
          <>
            <h1 className="font-display text-2xl font-bold text-green-600">Payment Confirmed!</h1>
            <p className="text-muted-foreground">Your payment was successful. Redirecting to your order…</p>
          </>
        )}

        {paymentStatus === 'FAILED' && (
          <>
            <h1 className="font-display text-2xl font-bold text-destructive">Payment Failed</h1>
            <p className="text-muted-foreground">Your payment could not be processed. Please try again.</p>
          </>
        )}

        {paymentStatus === 'PENDING' && !initiated && (
          <>
            <h1 className="font-display text-2xl font-bold">Complete Payment</h1>
            <p className="text-muted-foreground">
              Order <code className="rounded bg-secondary px-1.5 text-sm">{order.orderNumber}</code>
            </p>
          </>
        )}

        {paymentStatus === 'PENDING' && initiated && !redirectUrl && !clientSecret && (
          <>
            <h1 className="font-display text-2xl font-bold">Processing…</h1>
            <p className="text-muted-foreground">Connecting to payment gateway…</p>
          </>
        )}

        {/* Order summary */}
        <div className="rounded-xl border border-border bg-secondary/40 p-4 text-left space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order</span>
            <code className="text-xs">{order.orderNumber}</code>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">{formatPrice(order.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Method</span>
            <span>{order.paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className={statusColor}>{paymentStatus}</span>
          </div>
        </div>

        {/* Stripe client secret — placeholder for Stripe.js integration */}
        {clientSecret && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-left text-sm space-y-2">
            <p className="font-medium">Stripe Payment</p>
            <p className="text-xs text-muted-foreground">
              In production, embed Stripe Elements here using the client secret below.
              For now, use the simulate button to confirm the payment.
            </p>
            <code className="block break-all rounded bg-secondary p-2 text-xs">{clientSecret}</code>
          </div>
        )}

        {/* Redirect link */}
        {redirectUrl && (
          <a
            href={redirectUrl}
            className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            Proceed to payment page
          </a>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {paymentStatus === 'PENDING' && !initiated && order.paymentMethod !== 'COD' && (
            <Button className="w-full" size="lg" onClick={handleInitiate} disabled={initiate.isPending}>
              {initiate.isPending ? 'Connecting…' : `Pay ${formatPrice(order.total)} with ${order.paymentMethod}`}
            </Button>
          )}

          {paymentStatus === 'PENDING' && order.paymentMethod === 'COD' && (
            <div className="rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
              This is a Cash on Delivery order. No online payment is required.
            </div>
          )}

          {/* Dev-only simulate button */}
          {isDev && paymentStatus === 'PENDING' && order.paymentMethod !== 'COD' && (
            <Button
              variant="outline"
              className="w-full"
              disabled={simulate.isPending}
              onClick={() => simulate.mutate(orderId)}
            >
              {simulate.isPending ? 'Simulating…' : '(Dev) Simulate Payment Success'}
            </Button>
          )}

          {paymentStatus === 'FAILED' && (
            <Button className="w-full" onClick={handleInitiate} disabled={initiate.isPending}>
              {initiate.isPending ? 'Connecting…' : 'Try Again'}
            </Button>
          )}

          {paymentStatus === 'PAID' && (
            <Button asChild className="w-full">
              <Link href={`/order/${orderId}`}>View Order Confirmation</Link>
            </Button>
          )}

          <Button asChild variant="ghost" className="w-full">
            <Link href="/account/orders">Back to My Orders</Link>
          </Button>
        </div>

        {initiate.isError && (
          <p className="text-sm text-destructive">
            {(initiate.error as any)?.response?.data?.message ?? 'Payment initiation failed. Please try again.'}
          </p>
        )}
      </div>
    </main>
  );
}
