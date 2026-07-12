'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useProducts } from '@/hooks/use-products';
import { useCategoryTree } from '@/hooks/use-categories';
import { useBrands } from '@/hooks/use-brands';
import { ProductCard } from '@/components/shop/product-card';
import { Container } from '@/components/layout/container';
import { cn } from '@/lib/utils';
import type { Brand, Category } from '@ecommerce/types';

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Default Sorting' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A–Z' },
  { value: 'name-desc', label: 'Name: Z–A' },
  { value: 'rating-desc', label: 'Top Rated' },
];

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border py-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-sm font-semibold uppercase tracking-wider"
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
}

function CheckItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded border-border accent-primary" />
      <span>{label}</span>
    </label>
  );
}

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: categories } = useCategoryTree();
  const { data: brands } = useBrands();

  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get('categorySlug') ? [searchParams.get('categorySlug')!] : [],
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    searchParams.get('brandSlug') ? [searchParams.get('brandSlug')!] : [],
  );
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortKey, setSortKey] = useState(
    `${searchParams.get('sortBy') ?? 'createdAt'}-${searchParams.get('sortOrder') ?? 'desc'}`,
  );
  const [page, setPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [sortBy, sortOrder] = sortKey.split('-') as [string, string];

  const isOnSale = searchParams.get('isOnSale') === 'true';
  const isBundle = searchParams.get('isBundle') === 'true';

  const { data, isLoading } = useProducts({
    page,
    limit: 12,
    search: search || undefined,
    categorySlug: selectedCategories[0] || undefined,
    brandSlug: selectedBrands[0] || undefined,
    sortBy: sortBy as 'price' | 'createdAt' | 'name' | 'rating',
    sortOrder: sortOrder as 'asc' | 'desc',
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 10000 ? priceRange[1] : undefined,
    isOnSale: isOnSale || undefined,
    isBundle: isBundle || undefined,
  });

  const products = data?.products ?? [];
  const totalProducts = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const activeFilterCount =
    selectedCategories.length + selectedBrands.length + (priceRange[0] > 0 || priceRange[1] < 10000 ? 1 : 0) + (search ? 1 : 0);

  function clearFilters() {
    setSearch('');
    setSelectedCategories([]);
    setSelectedBrands([]);
    setPriceRange([0, 10000]);
    setMinPrice(0);
    setMaxPrice(10000);
    setPage(1);
    router.push('/shop');
  }

  const sidebar = (
    <aside>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider">Filters</h2>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-primary hover:underline">
            <X className="h-3 w-3" /> Clear ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Search */}
      <FilterSection title="Search">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            placeholder="Search products…"
            className="w-full rounded-lg border border-input bg-background py-2 pl-8 pr-3 text-sm"
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') setPage(1); }}
          />
        </div>
      </FilterSection>

      {/* Categories */}
      {(categories ?? []).length > 0 && (
        <FilterSection title="Category">
          {(categories ?? []).map((cat: Category) => (
            <CheckItem
              key={cat.id}
              label={cat.name}
              checked={selectedCategories.includes(cat.slug)}
              onChange={() => {
                setSelectedCategories((prev) =>
                  prev.includes(cat.slug) ? prev.filter((s) => s !== cat.slug) : [cat.slug],
                );
                setPage(1);
              }}
            />
          ))}
        </FilterSection>
      )}

      {/* Price */}
      <FilterSection title="Price Range">
        <input
          type="range"
          min={0}
          max={10000}
          step={50}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Min ৳</label>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(Number(e.target.value))}
              className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
          </div>
          <span className="mt-4 text-muted-foreground">—</span>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Max ৳</label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            />
          </div>
        </div>
        <button
          onClick={() => { setPriceRange([minPrice, maxPrice]); setPage(1); }}
          className="w-full rounded-lg bg-primary py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Apply
        </button>
      </FilterSection>

      {/* Brands */}
      {(brands ?? []).length > 0 && (
        <FilterSection title="Brands">
          {(brands ?? []).slice(0, 10).map((brand: Brand) => (
            <CheckItem
              key={brand.id}
              label={brand.name}
              checked={selectedBrands.includes(brand.slug)}
              onChange={() => {
                setSelectedBrands((prev) =>
                  prev.includes(brand.slug) ? prev.filter((s) => s !== brand.slug) : [brand.slug],
                );
                setPage(1);
              }}
            />
          ))}
        </FilterSection>
      )}
    </aside>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <div className="border-b border-border bg-secondary/30 py-4">
        <Container>
          <h1 className="font-display text-3xl font-bold uppercase tracking-widest">
            {isOnSale ? 'Offer Zone' : isBundle ? 'Exclusive Combo Deals' : 'All Products'}
          </h1>
          <nav className="mt-1 text-sm text-muted-foreground">
            <a href="/" className="hover:text-foreground">Home</a>
            <span className="mx-1.5">/</span>
            <span className="text-foreground">Shop</span>
          </nav>
        </Container>
      </div>

      <Container className="py-8">
        {/* Mobile filter toggle */}
        <div className="mb-4 flex items-center justify-between sm:hidden">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          <select
            value={sortKey}
            onChange={(e) => { setSortKey(e.target.value); setPage(1); }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 sm:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-background p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-semibold">Filters</span>
                <button onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
              </div>
              {sidebar}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-[240px_1fr]">
          {/* Desktop sidebar */}
          <div className="hidden sm:block">{sidebar}</div>

          {/* Product area */}
          <div>
            {/* Sort bar */}
            <div className="mb-6 hidden items-center justify-between sm:flex">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{products.length}</span> of{' '}
                <span className="font-medium text-foreground">{totalProducts}</span> products
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort By:</span>
                <select
                  value={sortKey}
                  onChange={(e) => { setSortKey(e.target.value); setPage(1); }}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                >
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* Skeleton */}
            {isLoading && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="aspect-[3/4] animate-pulse rounded-xl bg-secondary" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-secondary" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!isLoading && products.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border py-20 text-center">
                <p className="text-lg font-medium text-muted-foreground">No products found</p>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="mt-3 text-sm text-primary hover:underline">
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {/* Grid */}
            {!isLoading && products.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className={cn('rounded-lg border border-border px-3 py-2 text-sm font-medium', page <= 1 && 'cursor-not-allowed opacity-40')}
                >
                  Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      'rounded-lg border px-3.5 py-2 text-sm font-medium',
                      p === page ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary hover:text-primary',
                    )}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className={cn('rounded-lg border border-border px-3 py-2 text-sm font-medium', page >= totalPages && 'cursor-not-allowed opacity-40')}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense>
      <ShopContent />
    </Suspense>
  );
}
