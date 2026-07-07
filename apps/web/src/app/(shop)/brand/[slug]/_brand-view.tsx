'use client';

import Link from 'next/link';
import { useBrand } from '@/hooks/use-brands';
import { useProducts } from '@/hooks/use-products';
import { ProductCard } from '@/components/shop/product-card';

export function BrandView({ slug }: { slug: string }) {
  const { data: brand, isLoading, isError } = useBrand(slug);
  const { data: productsData, isLoading: productsLoading } = useProducts({
    brandSlug: slug,
    limit: 20,
  });

  if (isLoading) {
    return <div className="px-4 py-20 text-center text-muted-foreground">Loading…</div>;
  }

  if (isError || !brand) {
    return (
      <div className="px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">Brand not found</h1>
        <Link href="/brand" className="mt-4 inline-block text-primary hover:underline">
          Back to all brands
        </Link>
      </div>
    );
  }

  const products = productsData?.products ?? [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        {' / '}
        <Link href="/brand" className="hover:text-foreground">Brands</Link>
        {' / '}
        <span className="text-foreground">{brand.name}</span>
      </nav>

      <div className="flex items-center gap-4">
        {brand.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={brand.logoUrl} alt={brand.name} className="h-16 w-16 object-contain" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary font-display text-2xl font-semibold">
            {brand.name.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="font-display text-4xl font-bold text-foreground">{brand.name}</h1>
          {brand.country && <p className="text-sm text-muted-foreground">{brand.country}</p>}
        </div>
      </div>

      {brand.description && <p className="mt-6 max-w-2xl text-muted-foreground">{brand.description}</p>}

      <div className="mt-10">
        <h2 className="mb-4 font-display text-xl font-semibold">Products</h2>
        {productsLoading && <p className="text-sm text-muted-foreground">Loading products…</p>}
        {!productsLoading && products.length === 0 && (
          <p className="text-sm text-muted-foreground">No products from this brand yet.</p>
        )}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </main>
  );
}
