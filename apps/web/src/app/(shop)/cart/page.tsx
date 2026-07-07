'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart, useClearCart, useRemoveCartItem, useUpdateCartItem } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const router = useRouter();
  const { data: cart, isLoading } = useCart();
  const removeItem = useRemoveCartItem();
  const updateItem = useUpdateCartItem();
  const clearCart = useClearCart();

  if (isLoading) {
    return <div className="px-4 py-20 text-center text-muted-foreground">Loading cart…</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Your cart is empty</h1>
        <p className="mt-3 text-muted-foreground">Add some items to get started.</p>
        <Button asChild className="mt-8">
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Shopping Cart</h1>
        <button
          onClick={() => clearCart.mutate()}
          className="text-sm text-muted-foreground hover:text-destructive"
          disabled={clearCart.isPending}
        >
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        {/* Item list */}
        <div className="space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="flex gap-4 rounded-xl border border-border bg-card p-4">
              <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-secondary">
                {item.product.imageUrl ? (
                  <Image
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No img
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-1">
                <Link
                  href={`/product/${item.product.slug}`}
                  className="font-medium leading-tight hover:text-primary"
                >
                  {item.product.name}
                </Link>
                {item.variant && (
                  <p className="text-xs text-muted-foreground">
                    {[item.variant.color, item.variant.size].filter(Boolean).join(' / ')}
                  </p>
                )}
                <p className="text-sm font-semibold">{formatPrice(item.unitPrice)}</p>

                <div className="mt-auto flex items-center gap-3">
                  <div className="flex items-center rounded-lg border border-border">
                    <button
                      className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                      disabled={item.quantity <= 1 || updateItem.isPending}
                      onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                      disabled={updateItem.isPending}
                      onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem.mutate(item.id)}
                    disabled={removeItem.isPending}
                    className="ml-auto text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <span className="font-semibold">{formatPrice(item.totalPrice)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="rounded-xl border border-border bg-card p-6 lg:sticky lg:top-24 lg:self-start">
          <h2 className="mb-4 font-display text-lg font-semibold">Order Summary</h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal ({cart.itemCount} items)</span>
              <span>{formatPrice(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-primary">Calculated at checkout</span>
            </div>
          </div>

          <div className="my-4 border-t border-border" />

          <div className="flex justify-between font-semibold">
            <span>Subtotal</span>
            <span>{formatPrice(cart.subtotal)}</span>
          </div>

          <Button className="mt-6 w-full" size="lg" onClick={() => router.push('/checkout')}>
            Proceed to Checkout
          </Button>

          <Link
            href="/shop"
            className="mt-3 block text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
