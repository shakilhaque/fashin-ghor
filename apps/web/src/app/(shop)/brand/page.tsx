'use client';

import Link from 'next/link';
import { useBrands } from '@/hooks/use-brands';

export default function BrandListingPage() {
  const { data: brands, isLoading } = useBrands();

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        {' / '}
        <span className="text-foreground">Brands</span>
      </nav>

      <h1 className="font-display text-4xl font-bold text-foreground">All Brands</h1>
      <p className="mt-2 text-muted-foreground">Discover fashion from our curated brand partners.</p>

      {isLoading && <p className="mt-10 text-sm text-muted-foreground">Loading brands…</p>}

      {!isLoading && brands?.length === 0 && (
        <p className="mt-10 text-sm text-muted-foreground">No brands available yet.</p>
      )}

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {brands?.map((brand) => (
          <Link
            key={brand.id}
            href={`/brand/${brand.slug}`}
            className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center transition-colors hover:border-primary"
          >
            {brand.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logoUrl} alt={brand.name} className="h-12 w-12 object-contain" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary font-display text-lg font-semibold">
                {brand.name.charAt(0)}
              </div>
            )}
            <span className="font-medium">{brand.name}</span>
            {brand.country && <span className="text-xs text-muted-foreground">{brand.country}</span>}
          </Link>
        ))}
      </div>
    </main>
  );
}
