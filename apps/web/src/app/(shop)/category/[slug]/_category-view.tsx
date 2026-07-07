'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react';
import { useCategory } from '@/hooks/use-categories';
import { useProducts } from '@/hooks/use-products';
import { useBrands } from '@/hooks/use-brands';
import { ProductCard } from '@/components/shop/product-card';
import { cn } from '@/lib/utils';
import type { Brand, Category } from '@ecommerce/types';

// ── Filter section accordion ──────────────────────────────────────────────────

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border py-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-sm font-semibold uppercase tracking-wider text-foreground"
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
}

// ── Checkbox filter item ──────────────────────────────────────────────────────

function CheckItem({
  label,
  checked,
  onChange,
  count,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  count?: number;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-border accent-primary"
      />
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </label>
  );
}

// ── Sort options ──────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Default Sorting' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A–Z' },
  { value: 'name-desc', label: 'Name: Z–A' },
  { value: 'rating-desc', label: 'Top Rated' },
];

// ── Main view ─────────────────────────────────────────────────────────────────

export function CategoryView({ slug }: { slug: string }) {
  const { data: category, isLoading, isError } = useCategory(slug);
  const { data: brands } = useBrands();

  // Filters
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortKey, setSortKey] = useState('createdAt-desc');
  const [page, setPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [sortBy, sortOrder] = sortKey.split('-') as [string, string];

  const { data: productsData, isLoading: productsLoading } = useProducts({
    categorySlug: slug,
    limit: 12,
    page,
    sortBy: sortBy as 'price' | 'createdAt' | 'name' | 'rating',
    sortOrder: sortOrder as 'asc' | 'desc',
    brandSlug: selectedBrands.length === 1 ? selectedBrands[0] : undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 10000 ? priceRange[1] : undefined,
  });

  const products = productsData?.products ?? [];
  const totalProducts = productsData?.total ?? 0;
  const totalPages = productsData?.totalPages ?? 1;

  const subcategories = useMemo(() => category?.children ?? [], [category]);
  const topBrands = useMemo(() => (brands ?? []).slice(0, 10), [brands]);

  const activeFilterCount =
    selectedBrands.length + (priceRange[0] > 0 || priceRange[1] < 10000 ? 1 : 0);

  function clearFilters() {
    setSelectedBrands([]);
    setPriceRange([0, 10000]);
    setMinPrice(0);
    setMaxPrice(10000);
    setPage(1);
  }

  function toggleBrand(slug: string) {
    setSelectedBrands((prev) =>
      prev.includes(slug) ? prev.filter((b) => b !== slug) : [...prev, slug],
    );
    setPage(1);
  }

  function applyPrice() {
    setPriceRange([minPrice, maxPrice]);
    setPage(1);
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (isError || !category) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">Category not found</h1>
        <Link href="/" className="mt-4 inline-block text-primary hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  // ── Sidebar ──────────────────────────────────────────────────────────────

  const sidebar = (
    <aside className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Filters</h2>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <X className="h-3 w-3" /> Clear all ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Subcategories */}
      {subcategories.length > 0 && (
        <FilterSection title="Filter by Category">
          {subcategories.map((sub: Category) => (
            <Link
              key={sub.id}
              href={`/category/${sub.slug}`}
              className="block text-sm text-muted-foreground hover:text-primary hover:font-medium py-0.5"
            >
              {sub.name}
            </Link>
          ))}
        </FilterSection>
      )}

      {/* Price range */}
      <FilterSection title="Price Range">
        <div className="space-y-3">
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
              <label className="text-xs text-muted-foreground">Min</label>
              <input
                type="number"
                value={minPrice}
                min={0}
                max={maxPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              />
            </div>
            <span className="mt-4 text-muted-foreground">—</span>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Max</label>
              <input
                type="number"
                value={maxPrice}
                min={minPrice}
                max={99999}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              />
            </div>
          </div>
          <button
            onClick={applyPrice}
            className="w-full rounded-lg bg-primary py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Apply
          </button>
          {(priceRange[0] > 0 || priceRange[1] < 10000) && (
            <p className="text-xs text-primary">
              ৳{priceRange[0].toLocaleString()} — ৳{priceRange[1].toLocaleString()}
            </p>
          )}
        </div>
      </FilterSection>

      {/* Brands */}
      {topBrands.length > 0 && (
        <FilterSection title="Brands">
          {topBrands.map((brand: Brand) => (
            <CheckItem
              key={brand.id}
              label={brand.name}
              checked={selectedBrands.includes(brand.slug)}
              onChange={() => toggleBrand(brand.slug)}
            />
          ))}
        </FilterSection>
      )}
    </aside>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* ── Breadcrumb ────────────────────────────────────────── */}
      <div className="border-b border-border bg-secondary/30 px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <nav className="text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span className="mx-1.5 text-border">/</span>
            {category.parent && (
              <>
                <Link href={`/category/${category.parent.slug}`} className="hover:text-foreground">
                  {category.parent.name}
                </Link>
                <span className="mx-1.5 text-border">/</span>
              </>
            )}
            <span className="font-medium text-foreground">{category.name}</span>
          </nav>
          <span className="text-xs text-muted-foreground hidden sm:block">
            {totalProducts} products
          </span>
        </div>
      </div>

      {/* ── Category title ────────────────────────────────────── */}
      <div className="bg-secondary/20 py-8 text-center">
        <h1 className="font-display text-3xl font-bold uppercase tracking-widest text-foreground sm:text-4xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{category.description}</p>
        )}
      </div>

      {/* ── Body: sidebar + grid ──────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">

        {/* Mobile: filter toggle */}
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
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Skeleton */}
            {productsLoading && (
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

            {/* Empty state */}
            {!productsLoading && products.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border py-20 text-center">
                <p className="text-lg font-medium text-muted-foreground">No products found</p>
                <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters</p>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="mt-4 text-sm font-medium text-primary hover:underline">
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {/* Product grid */}
            {!productsLoading && products.length > 0 && (
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
                  className={cn(
                    'rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors',
                    page <= 1 ? 'cursor-not-allowed opacity-40' : 'hover:border-primary hover:text-primary',
                  )}
                >
                  Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      'rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors',
                      p === page
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary hover:text-primary',
                    )}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className={cn(
                    'rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors',
                    page >= totalPages ? 'cursor-not-allowed opacity-40' : 'hover:border-primary hover:text-primary',
                  )}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
