'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Gift, MessageCircle, Phone, ShoppingBag } from 'lucide-react';
import { useCombo } from '@/hooks/use-combos';
import { Container } from '@/components/layout/container';
import { formatPrice } from '@/lib/utils';

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';
const STORE_WHATSAPP = (process.env.NEXT_PUBLIC_STORE_WHATSAPP || '+8801700000000').replace(/[^\d]/g, '');
const STORE_PHONE = process.env.NEXT_PUBLIC_STORE_PHONE || '+8801700000000';

export function ComboView({ slug }: { slug: string }) {
  const { data: combo, isLoading, isError } = useCombo(slug);

  if (isLoading) {
    return (
      <Container className="py-20 text-center text-muted-foreground">
        Loading…
      </Container>
    );
  }

  if (isError || !combo) {
    return (
      <Container className="py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">Combo not found</h1>
        <Link href="/combo" className="mt-4 inline-block text-primary hover:underline">
          Back to all combos
        </Link>
      </Container>
    );
  }

  const image = combo.imageUrl ?? combo.items[0]?.product.images[0]?.url;
  const discount = combo.comparePrice
    ? Math.round(((combo.comparePrice - combo.price) / combo.comparePrice) * 100)
    : combo.discount;

  return (
    <Container as="main" className="py-12">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        {' / '}
        <Link href="/combo" className="hover:text-foreground">Combo Deals</Link>
        {' / '}
        <span className="text-foreground">{combo.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-secondary">
          {image ? (
            <Image src={image} alt={combo.name} fill className="object-contain" sizes="(max-width: 1024px) 100vw, 50vw" priority />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Gift className="h-16 w-16 opacity-20" />
            </div>
          )}
          {discount > 0 && (
            <span className="absolute left-4 top-4 rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white">
              Save {discount}%
            </span>
          )}
        </div>

        <div>
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Combo Offer
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold">{combo.name}</h1>

          <div className="mt-4 flex items-center gap-3">
            <span className="font-display text-2xl font-semibold text-foreground">{formatPrice(combo.price)}</span>
            {combo.comparePrice && (
              <span className="text-muted-foreground line-through">{formatPrice(combo.comparePrice)}</span>
            )}
          </div>

          {combo.description && <p className="mt-4 text-muted-foreground">{combo.description}</p>}

          <div className="mt-8">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground">
              <ShoppingBag className="h-4 w-4" />
              Items in This Combo ({combo.items.length} products)
            </h2>
            <div className="mt-3 overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {combo.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-secondary">
                            {item.product.images[0] && (
                              <Image
                                src={item.product.images[0].url}
                                alt={item.product.images[0].altText ?? item.product.name}
                                fill
                                className="object-contain"
                                sizes="40px"
                              />
                            )}
                          </div>
                          <Link href={`/product/${item.product.slug}`} className="font-medium hover:text-primary">
                            {item.product.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <a
              href={`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(`Hi, I'm interested in the combo "${combo.name}" (${WEB_URL}/combo/${combo.slug})`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Order on WhatsApp
            </a>
            <a
              href={`tel:${STORE_PHONE}`}
              className="flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 transition-colors"
            >
              <Phone className="h-4 w-4" />
              Call for Order
            </a>
          </div>
        </div>
      </div>
    </Container>
  );
}
