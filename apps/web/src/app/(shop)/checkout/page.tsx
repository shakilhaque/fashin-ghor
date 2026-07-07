'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ChevronRight, MapPin, Package, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useCart } from '@/hooks/use-cart';
import { useAddresses, useCreateAddress, type AddressInput } from '@/hooks/use-addresses';
import { useShippingRates, useCheckoutSummary, usePlaceOrder } from '@/hooks/use-checkout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn, formatPrice } from '@/lib/utils';
import type { Address } from '@ecommerce/types';
import type { ShippingRate } from '@/hooks/use-checkout';

type Step = 'address' | 'shipping' | 'review';
type PaymentMethod = 'COD' | 'SSLCOMMERZ' | 'BKASH' | 'NAGAD' | 'STRIPE';

const PAYMENT_METHODS: { value: PaymentMethod; label: string; description: string }[] = [
  { value: 'COD', label: 'Cash on Delivery', description: 'Pay when your order arrives' },
  { value: 'BKASH', label: 'bKash', description: 'Mobile banking (integration in Phase 10)' },
  { value: 'NAGAD', label: 'Nagad', description: 'Mobile banking (integration in Phase 10)' },
  { value: 'SSLCOMMERZ', label: 'Card / SSLCommerz', description: 'Credit/Debit card (integration in Phase 10)' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data: cart } = useCart();
  const { data: addresses } = useAddresses();
  const { data: rates } = useShippingRates();
  const summaryMutation = useCheckoutSummary();
  const placeOrderMutation = usePlaceOrder();
  const createAddress = useCreateAddress();

  const [step, setStep] = useState<Step>('address');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [selectedRateId, setSelectedRateId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [couponCode, setCouponCode] = useState('');
  const [notes, setNotes] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<AddressInput>({
    label: 'Home',
    recipientName: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'BD',
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login?redirect=/checkout');
  }, [authLoading, user, router]);

  // Auto-select default address
  useEffect(() => {
    if (addresses?.length && !selectedAddressId) {
      const def = addresses.find((a) => a.isDefault) ?? addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [addresses, selectedAddressId]);

  // Auto-select cheapest shipping rate
  useEffect(() => {
    if (rates?.length && !selectedRateId) {
      setSelectedRateId(rates[0].id);
    }
  }, [rates, selectedRateId]);

  if (authLoading || !user) return null;
  if (!cart || cart.items.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Your cart is empty</h1>
        <Button asChild className="mt-8"><a href="/shop">Go to Shop</a></Button>
      </main>
    );
  }

  const steps: { key: Step; label: string; Icon: typeof MapPin }[] = [
    { key: 'address', label: 'Address', Icon: MapPin },
    { key: 'shipping', label: 'Shipping', Icon: Package },
    { key: 'review', label: 'Review', Icon: CreditCard },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  async function handleAddressNext() {
    if (!selectedAddressId) return;
    setStep('shipping');
  }

  async function handleShippingNext() {
    if (!selectedRateId) return;
    await summaryMutation.mutateAsync({ shippingRateId: selectedRateId, couponCode: couponCode || undefined });
    setStep('review');
  }

  async function handlePlaceOrder() {
    try {
      const order = await placeOrderMutation.mutateAsync({
        addressId: selectedAddressId,
        shippingRateId: selectedRateId,
        paymentMethod: paymentMethod as any,
        couponCode: couponCode || undefined,
        notes: notes || undefined,
      });
      // COD → straight to confirmation; online payments → payment page
      if (paymentMethod === 'COD') {
        router.push(`/order/${order.orderId}`);
      } else {
        router.push(`/payment/${order.orderId}`);
      }
    } catch {
      // Error handled by mutation state
    }
  }

  const summary = summaryMutation.data;
  const selectedRate = rates?.find((r) => r.id === selectedRateId);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 font-display text-3xl font-bold">Checkout</h1>

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <button
              onClick={() => i < currentStepIndex && setStep(s.key)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                s.key === step
                  ? 'bg-primary text-primary-foreground'
                  : i < currentStepIndex
                    ? 'cursor-pointer bg-secondary text-foreground hover:bg-secondary/80'
                    : 'cursor-default text-muted-foreground',
              )}
            >
              <s.Icon className="h-4 w-4" />
              {s.label}
            </button>
            {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        {/* Step content */}
        <div>
          {/* ── STEP 1: ADDRESS ─────────────────────────── */}
          {step === 'address' && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold">Delivery Address</h2>
              {addresses?.map((addr: Address) => (
                <AddressCard
                  key={addr.id}
                  address={addr}
                  selected={selectedAddressId === addr.id}
                  onSelect={() => setSelectedAddressId(addr.id)}
                />
              ))}
              {showAddressForm ? (
                <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                  <h3 className="font-medium">New Address</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { field: 'recipientName', label: 'Full Name', span: 2 },
                      { field: 'phone', label: 'Phone', span: 1 },
                      { field: 'label', label: 'Label (Home/Work)', span: 1 },
                      { field: 'addressLine1', label: 'Address Line 1', span: 2 },
                      { field: 'addressLine2', label: 'Address Line 2 (optional)', span: 2 },
                      { field: 'city', label: 'City', span: 1 },
                      { field: 'state', label: 'State / Division', span: 1 },
                      { field: 'postalCode', label: 'Postal Code', span: 1 },
                    ].map(({ field, label, span }) => (
                      <div key={field} className={cn('space-y-1', span === 2 && 'col-span-2')}>
                        <Label>{label}</Label>
                        <Input
                          value={(newAddress as any)[field] ?? ''}
                          onChange={(e) => setNewAddress((p) => ({ ...p, [field]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        const addr = await createAddress.mutateAsync(newAddress);
                        setSelectedAddressId(addr.id);
                        setShowAddressForm(false);
                      }}
                      disabled={createAddress.isPending}
                    >
                      Save Address
                    </Button>
                    <Button variant="ghost" onClick={() => setShowAddressForm(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="w-full rounded-xl border border-dashed border-border py-4 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  + Add new address
                </button>
              )}
              <Button className="w-full" disabled={!selectedAddressId} onClick={handleAddressNext}>
                Continue to Shipping
              </Button>
            </div>
          )}

          {/* ── STEP 2: SHIPPING ────────────────────────── */}
          {step === 'shipping' && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold">Shipping Method</h2>
              {rates?.map((rate: ShippingRate) => {
                const eligible = cart.subtotal >= rate.minOrderAmt;
                return (
                  <button
                    key={rate.id}
                    disabled={!eligible}
                    onClick={() => setSelectedRateId(rate.id)}
                    className={cn(
                      'w-full rounded-xl border p-4 text-left transition-colors',
                      selectedRateId === rate.id ? 'border-primary bg-primary/5' : 'border-border',
                      !eligible && 'opacity-40 cursor-not-allowed',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{rate.name}</p>
                        {rate.minOrderAmt > 0 && !rate.isFree && (
                          <p className="text-xs text-muted-foreground">Min order: {formatPrice(rate.minOrderAmt)}</p>
                        )}
                        {rate.isFree && rate.minOrderAmt > 0 && (
                          <p className="text-xs text-primary">Orders ≥ {formatPrice(rate.minOrderAmt)}</p>
                        )}
                      </div>
                      <span className="font-semibold">{rate.isFree ? 'FREE' : formatPrice(rate.rate)}</span>
                    </div>
                  </button>
                );
              })}
              <Button
                className="w-full"
                disabled={!selectedRateId || summaryMutation.isPending}
                onClick={handleShippingNext}
              >
                {summaryMutation.isPending ? 'Calculating…' : 'Continue to Review'}
              </Button>
            </div>
          )}

          {/* ── STEP 3: REVIEW ──────────────────────────── */}
          {step === 'review' && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-semibold">Review & Place Order</h2>

              {/* Payment method */}
              <div className="space-y-2">
                <h3 className="font-medium">Payment Method</h3>
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.value}
                    onClick={() => setPaymentMethod(pm.value)}
                    className={cn(
                      'w-full rounded-xl border p-4 text-left transition-colors',
                      paymentMethod === pm.value ? 'border-primary bg-primary/5' : 'border-border',
                    )}
                  >
                    <p className="font-medium">{pm.label}</p>
                    <p className="text-xs text-muted-foreground">{pm.description}</p>
                  </button>
                ))}
              </div>

              {/* Coupon */}
              <div className="space-y-2">
                <Label>Coupon Code</Label>
                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME10"
                  />
                  <Button
                    variant="outline"
                    onClick={() => summaryMutation.mutate({ shippingRateId: selectedRateId, couponCode: couponCode || undefined })}
                    disabled={summaryMutation.isPending}
                  >
                    Apply
                  </Button>
                </div>
                {summary?.couponCode && (
                  <p className="text-xs text-primary">✓ Coupon applied: -{formatPrice(summary.discount)}</p>
                )}
                {summaryMutation.isError && (
                  <p className="text-xs text-destructive">Invalid coupon code</p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <Label>Order Notes (optional)</Label>
                <textarea
                  className="h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special delivery instructions?"
                />
              </div>

              {placeOrderMutation.isError && (
                <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {(placeOrderMutation.error as any)?.response?.data?.message ?? 'Failed to place order. Please try again.'}
                </p>
              )}

              <Button
                className="w-full"
                size="lg"
                disabled={placeOrderMutation.isPending}
                onClick={handlePlaceOrder}
              >
                {placeOrderMutation.isPending ? 'Placing Order…' : `Place Order · ${formatPrice(summary?.total ?? cart.subtotal)}`}
              </Button>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="rounded-xl border border-border bg-card p-6 lg:sticky lg:top-24 lg:self-start">
          <h2 className="mb-4 font-display text-lg font-semibold">Order Summary</h2>
          <div className="space-y-2 text-sm">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-2">
                <span className="text-muted-foreground truncate">
                  {item.product.name}
                  {item.variant && <span className="ml-1">({[item.variant.color, item.variant.size].filter(Boolean).join('/')})</span>}
                  {' ×'}{item.quantity}
                </span>
                <span className="shrink-0">{formatPrice(item.totalPrice)}</span>
              </div>
            ))}
          </div>
          <div className="my-3 border-t border-border" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(summary?.subtotal ?? cart.subtotal)}</span>
            </div>
            {summary?.discount ? (
              <div className="flex justify-between text-primary">
                <span>Coupon ({summary.couponCode})</span>
                <span>-{formatPrice(summary.discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{summary ? formatPrice(summary.shippingCost) : selectedRate ? formatPrice(selectedRate.isFree ? 0 : selectedRate.rate) : '—'}</span>
            </div>
          </div>
          <div className="my-3 border-t border-border" />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatPrice(summary?.total ?? cart.subtotal)}</span>
          </div>
        </div>
      </div>
    </main>
  );
}

function AddressCard({ address, selected, onSelect }: { address: Address; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full rounded-xl border p-4 text-left transition-colors',
        selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-medium">{address.recipientName}</span>
            <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">{address.label}</span>
            {address.isDefault && (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">Default</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{address.phone}</p>
          <p className="text-sm text-muted-foreground">
            {address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}, {address.city}, {address.state} {address.postalCode}
          </p>
        </div>
        {selected && <CheckCircle className="h-5 w-5 shrink-0 text-primary" />}
      </div>
    </button>
  );
}
