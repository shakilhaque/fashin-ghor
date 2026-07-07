'use client';

import { useState } from 'react';
import { Search, Truck, Package, CheckCircle2, Clock, AlertCircle, MapPin } from 'lucide-react';
import { useTrackShipment } from '@/hooks/use-shipping';

const STATUS_ICONS: Record<string, React.ReactNode> = {
  DISPATCHED: <Truck className="h-4 w-4" />,
  IN_TRANSIT: <Truck className="h-4 w-4" />,
  OUT_FOR_DELIVERY: <Truck className="h-4 w-4 text-amber-500" />,
  DELIVERED: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  FAILED: <AlertCircle className="h-4 w-4 text-destructive" />,
  RETURNED: <Package className="h-4 w-4 text-destructive" />,
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    DISPATCHED: 'bg-blue-100 text-blue-700',
    IN_TRANSIT: 'bg-amber-100 text-amber-700',
    OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
    DELIVERED: 'bg-emerald-100 text-emerald-700',
    FAILED: 'bg-red-100 text-red-700',
    RETURNED: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${colors[status] ?? 'bg-muted text-muted-foreground'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function TrackingResult({ trackingNumber }: { trackingNumber: string }) {
  const { data, isLoading, isError, error } = useTrackShipment(trackingNumber);

  if (isLoading) {
    return (
      <div className="mt-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-secondary/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-8 flex flex-col items-center gap-3 rounded-lg border border-border bg-background py-12 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium">Tracking not found</p>
        <p className="text-sm text-muted-foreground">
          {(error as any)?.response?.data?.message ?? 'No shipment found for this tracking number.'}
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mt-8 space-y-6">
      {/* Header card */}
      <div className="rounded-xl border border-border bg-background p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tracking Number</p>
            <p className="font-mono text-lg font-bold">{data.trackingNumber}</p>
            {data.orderNumber && (
              <p className="mt-1 text-sm text-muted-foreground">Order #{data.orderNumber}</p>
            )}
          </div>
          <div className="text-right">
            <StatusBadge status={data.currentStatus} />
            <p className="mt-2 text-xs text-muted-foreground">
              via {data.courier.replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        {data.estimatedDelivery && !data.deliveredAt && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary/60 px-4 py-3 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Estimated delivery:</span>
            <span className="font-medium">
              {new Date(data.estimatedDelivery).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        )}

        {data.deliveredAt && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-muted-foreground">Delivered on</span>
            <span className="font-medium text-emerald-700">
              {new Date(data.deliveredAt).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Timeline */}
      {data.events.length > 0 && (
        <div className="rounded-xl border border-border bg-background p-6">
          <h3 className="font-semibold mb-4">Tracking History</h3>
          <ol className="relative border-l-2 border-border ml-3 space-y-6">
            {data.events.map((ev, idx) => (
              <li key={idx} className="ml-6">
                <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full border-2 border-border bg-background text-xs">
                  {STATUS_ICONS[ev.status] ?? <Package className="h-3 w-3" />}
                </span>
                <div>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-medium text-sm">{ev.status.replace(/_/g, ' ')}</span>
                    {ev.location && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {ev.location}
                      </span>
                    )}
                  </div>
                  {ev.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{ev.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(ev.occurredAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(input.trim());
  };

  return (
    <div className="min-h-screen bg-secondary/30 py-16 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Hero */}
        <div className="text-center mb-10">
          <Truck className="mx-auto h-10 w-10 text-primary mb-4" />
          <h1 className="font-display text-3xl font-bold">Track Your Order</h1>
          <p className="mt-2 text-muted-foreground">
            Enter your tracking number to see real-time shipping updates.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSubmit} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            className="w-full rounded-xl border border-border bg-background py-3.5 pl-12 pr-32 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g. LM-A1B2C3D4"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Track
          </button>
        </form>

        {/* Result */}
        {query && <TrackingResult trackingNumber={query} />}

        {!query && (
          <div className="mt-10 text-center text-sm text-muted-foreground">
            <p>Your tracking number can be found in your order confirmation email.</p>
          </div>
        )}
      </div>
    </div>
  );
}
