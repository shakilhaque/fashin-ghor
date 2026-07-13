'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Gift } from 'lucide-react';
import { useCombos } from '@/hooks/use-combos';
import { Container } from '@/components/layout/container';
import { formatPrice } from '@/lib/utils';

export default function ComboListingPage() {
  const { data: combos, isLoading } = useCombos();

  return (
    <Container as="main" className="py-12">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        {' / '}
        <span className="text-foreground">Combo Deals</span>
      </nav>

      <h1 className="font-display text-4xl font-bold text-foreground">Combo Deals</h1>
      <p className="mt-2 text-muted-foreground">Bundled outfits at a special combined price.</p>

      {isLoading && <p className="mt-10 text-sm text-muted-foreground">Loading combos…</p>}

      {!isLoading && (combos ?? []).length === 0 && (
        <p className="mt-10 text-sm text-muted-foreground">No combo deals available right now.</p>
      )}

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {(combos ?? []).map((combo) => {
          const image = combo.imageUrl ?? combo.items[0]?.product.images[0]?.url;
          const discount = combo.comparePrice
            ? Math.round(((combo.comparePrice - combo.price) / combo.comparePrice) * 100)
            : combo.discount;

          return (
            <Link
              key={combo.id}
              href={`/combo/${combo.slug}`}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg"
            >
              <div className="relative aspect-[4/5] w-full bg-secondary">
                {image ? (
                  <Image
                    src={image}
                    alt={combo.name}
                    fill
                    className="object-contain transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <Gift className="h-10 w-10 opacity-20" />
                  </div>
                )}
                {discount > 0 && (
                  <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">
                    Save {discount}%
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-sm font-medium leading-snug">{combo.name}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="font-semibold text-foreground">{formatPrice(combo.price)}</span>
                  {combo.comparePrice && (
                    <span className="text-xs text-muted-foreground line-through">{formatPrice(combo.comparePrice)}</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Container>
  );
}
