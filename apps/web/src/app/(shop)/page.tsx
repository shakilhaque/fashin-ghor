'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, ChevronLeft, ChevronRight, Star, Truck, RotateCcw, Shield, Headphones, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProducts, useBestSellers } from '@/hooks/use-products';
import { useBrands } from '@/hooks/use-brands';
import { useCart, useAddToCart } from '@/hooks/use-cart';
import { useStories } from '@/hooks/use-stories';
import { useBanners, type PromoBanner } from '@/hooks/use-banners';
import { StoriesCarousel } from '@/components/stories/story-carousel';
import { StoryViewer } from '@/components/stories/story-viewer';
import { PromoBannerSection } from '@/components/home/promo-banner-section';
import { formatPrice, cn } from '@/lib/utils';
import type { Product, Story } from '@ecommerce/types';

// ── Hero slides ───────────────────────────────────────────────────────────────

const HERO_SLIDES = [
  {
    id: 1,
    tag: 'New Collection 2025',
    title: 'Elevate Your\nStyle Game',
    subtitle: 'Discover premium fashion curated for the modern wardrobe. Free delivery on orders over ৳999.',
    cta: 'Shop Now',
    href: '/shop',
    bg: 'from-emerald-950 via-emerald-900 to-teal-800',
    accent: 'bg-emerald-400',
    img: null,
  },
  {
    id: 2,
    tag: "Women's Fashion",
    title: "This Season's\nMust-Haves",
    subtitle: 'Explore the latest trends in ethnic wear, western wear and everything in between.',
    cta: 'Explore Collection',
    href: '/category/womens-fashion',
    bg: 'from-rose-950 via-rose-900 to-pink-800',
    accent: 'bg-rose-400',
    img: null,
  },
  {
    id: 3,
    tag: "Men's Fashion",
    title: 'Dress Sharp,\nStay Confident',
    subtitle: 'Premium shirts, trousers, blazers and more — built for the discerning gentleman.',
    cta: 'Shop Men',
    href: '/category/mens-fashion',
    bg: 'from-slate-950 via-slate-900 to-zinc-800',
    accent: 'bg-amber-400',
    img: null,
  },
];

// ── Product card ──────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  const addToCart = useAddToCart();
  const { data: cart } = useCart();
  const inCart = cart?.items.some((i: { productId: string }) => i.productId === product.id);

  const image = (product.images as { url: string; altText?: string | null }[] | undefined)?.[0];
  const hasVariants = (product.variants as unknown[])?.length > 0;
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-lg">
      {/* Badge */}
      {discount > 0 && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
          -{discount}%
        </span>
      )}
      {product.stock === 0 && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-zinc-500 px-2 py-0.5 text-xs font-semibold text-white">
          Out of Stock
        </span>
      )}

      {/* Image */}
      <Link href={`/product/${product.slug}`} className="relative block aspect-[3/4] w-full overflow-hidden bg-secondary">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText ?? product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ShoppingBag className="h-12 w-12 opacity-20" />
          </div>
        )}

        {/* Quick add overlay */}
        {!hasVariants && product.stock > 0 && (
          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-foreground/90 py-3 text-center text-sm font-medium text-background transition-transform duration-300 group-hover:translate-y-0">
            {inCart ? '✓ In Cart' : 'Quick Add'}
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link href={`/product/${product.slug}`} className="line-clamp-2 text-sm font-medium leading-snug hover:text-primary">
          {product.name}
        </Link>

        {/* Rating placeholder */}
        <div className="flex items-center gap-1">
          {[1,2,3,4,5].map((s) => (
            <Star key={s} className={cn('h-3 w-3', s <= 4 ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground')} />
          ))}
          <span className="text-xs text-muted-foreground">(24)</span>
        </div>

        <div className="mt-auto flex items-center gap-2">
          <span className="font-semibold text-foreground">{formatPrice(product.price)}</span>
          {product.comparePrice && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.comparePrice)}</span>
          )}
        </div>

        {hasVariants ? (
          <Button asChild size="sm" className="mt-1 w-full" variant="outline">
            <Link href={`/product/${product.slug}`}>Select Options</Link>
          </Button>
        ) : (
          <Button
            size="sm"
            className="mt-1 w-full"
            disabled={product.stock === 0 || addToCart.isPending}
            onClick={() => addToCart.mutate({ productId: product.id, quantity: 1 })}
          >
            {inCart ? '✓ Added' : 'Add to Cart'}
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Top selling card (wide layout: image left, details right) ──────────────────

function TopSellingCard({ product }: { product: Product }) {
  const addToCart = useAddToCart();
  const image = (product.images as { url: string; altText?: string | null }[] | undefined)?.[0];
  const hasVariants = (product.variants as unknown[])?.length > 0;
  const saveAmount = product.comparePrice ? Math.round(product.comparePrice - product.price) : 0;

  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-card p-3 sm:gap-6 sm:p-4">
      <Link href={`/product/${product.slug}`} className="relative block aspect-square w-32 shrink-0 overflow-hidden rounded-xl bg-secondary sm:w-44">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText ?? product.name}
            fill
            className="object-cover"
            sizes="176px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ShoppingBag className="h-8 w-8 opacity-20" />
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-center min-w-0">
        <Link href={`/product/${product.slug}`} className="line-clamp-2 font-medium leading-snug hover:text-primary">
          {product.name}
        </Link>

        <div className="mt-2 flex items-center gap-2">
          <span className="font-display text-lg font-semibold text-foreground">{formatPrice(product.price)}</span>
          {product.comparePrice && (
            <span className="text-sm text-muted-foreground line-through">{formatPrice(product.comparePrice)}</span>
          )}
        </div>

        {saveAmount > 0 && (
          <span className="mt-2 inline-block w-fit rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            Save {formatPrice(saveAmount)}
          </span>
        )}

        {hasVariants ? (
          <Button asChild size="sm" variant="outline" className="mt-3 w-fit">
            <Link href={`/product/${product.slug}`}>
              <ShoppingBag className="mr-1.5 h-3.5 w-3.5" /> Select Options
            </Link>
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="mt-3 w-fit"
            disabled={product.stock === 0 || addToCart.isPending}
            onClick={() => addToCart.mutate({ productId: product.id, quantity: 1 })}
          >
            <ShoppingBag className="mr-1.5 h-3.5 w-3.5" />
            {product.stock === 0 ? 'Out of Stock' : 'Order Now'}
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Combo deal card ──────────────────────────────────────────────────────────

function ComboDealCard({ product }: { product: Product }) {
  const image = (product.images as { url: string; altText?: string | null }[] | undefined)?.[0];
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : product.discount;

  return (
    <div className="w-64 shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-card sm:w-72">
      <div className="relative aspect-[4/5] w-full bg-secondary">
        {image ? (
          <Image src={image.url} alt={image.altText ?? product.name} fill className="object-cover" sizes="288px" />
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
        <span className="absolute right-3 top-3 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
          Combo Offer
        </span>
      </div>
      <div className="p-4">
        <Link href={`/product/${product.slug}`} className="line-clamp-2 font-medium leading-snug hover:text-primary">
          {product.name}
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <span className="font-display text-lg font-semibold">{formatPrice(product.price)}</span>
          {product.comparePrice && (
            <span className="text-sm text-muted-foreground line-through">{formatPrice(product.comparePrice)}</span>
          )}
        </div>
        <Button asChild size="sm" variant="outline" className="mt-3 w-full">
          <Link href={`/product/${product.slug}`}>View Details</Link>
        </Button>
      </div>
    </div>
  );
}

function ComboDealsCarousel({ products }: { products: Product[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);
  const perPage = 4;
  const pageCount = Math.ceil(products.length / perPage);

  function scrollToPage(page: number) {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / products.length;
    el.scrollTo({ left: cardWidth * perPage * page, behavior: 'smooth' });
    setActivePage(page);
  }

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / products.length;
    const page = Math.round(el.scrollLeft / (cardWidth * perPage));
    setActivePage(Math.min(page, pageCount - 1));
  }

  return (
    <div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <ComboDealCard key={product.id} product={product} />
        ))}
      </div>
      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToPage(i)}
              aria-label={`Go to page ${i + 1}`}
              className={cn('h-2 rounded-full transition-all', i === activePage ? 'w-6 bg-primary' : 'w-2 bg-border')}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Hero carousel ─────────────────────────────────────────────────────────────
// Renders admin-uploaded HERO banners as real photo slides when available,
// falling back to the built-in gradient slides so the homepage never looks
// empty before an admin configures anything.

const HERO_HEIGHT_CLASSES: Record<'SMALL' | 'MEDIUM' | 'LARGE', string> = {
  SMALL: 'min-h-[220px] sm:min-h-[260px]',
  MEDIUM: 'min-h-[320px] sm:min-h-[380px]',
  LARGE: 'min-h-[480px] sm:min-h-[560px]',
};

function HeroCarousel({ banners }: { banners: PromoBanner[] }) {
  const [active, setActive] = useState(0);
  const slideCount = banners.length > 0 ? banners.length : HERO_SLIDES.length;

  useEffect(() => {
    setActive(0);
  }, [banners.length]);

  useEffect(() => {
    const t = setInterval(() => setActive((p) => (p + 1) % slideCount), 5000);
    return () => clearInterval(t);
  }, [slideCount]);

  if (banners.length > 0) {
    const banner = banners[active];
    const heightClass = HERO_HEIGHT_CLASSES[banner.size ?? 'LARGE'];
    return (
      <section className="relative overflow-hidden bg-secondary">
        <div className={cn('relative w-full', heightClass)}>
          <Image
            src={banner.imageUrl}
            alt={banner.title ?? 'Hero banner'}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

          <div className={cn('relative mx-auto flex max-w-7xl items-center px-4 py-16 sm:px-8 lg:px-12', heightClass)}>
            <div className="max-w-xl">
              {banner.badgeText && (
                <span className="mb-4 inline-block rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-black">
                  {banner.badgeText}
                </span>
              )}
              {banner.title && (
                <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl whitespace-pre-line">
                  {banner.title}
                </h1>
              )}
              {banner.subtitle && (
                <p className="mt-4 max-w-sm text-white/70 text-base sm:text-lg">
                  {banner.subtitle}
                </p>
              )}
              <div className="mt-8 flex gap-3">
                {banner.linkUrl && (
                  <Button asChild size="lg" className="rounded-full bg-white text-black hover:bg-white/90 font-semibold">
                    <Link href={banner.linkUrl}>
                      {banner.linkLabel ?? 'Shop Now'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
                <Button asChild size="lg" variant="ghost" className="rounded-full text-white border-white/30 border hover:bg-white/10">
                  <Link href="/shop">View All</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {banners.length > 1 && (
          <HeroControls active={active} count={banners.length} onPrev={() => setActive((p) => (p - 1 + banners.length) % banners.length)} onNext={() => setActive((p) => (p + 1) % banners.length)} onSelect={setActive} />
        )}
      </section>
    );
  }

  const slide = HERO_SLIDES[active];

  return (
    <section className={`relative overflow-hidden bg-gradient-to-br ${slide.bg} transition-all duration-700`}>
      <div className="mx-auto flex min-h-[480px] max-w-7xl items-center px-4 py-16 sm:min-h-[560px] sm:px-8 lg:px-12">
        <div className="max-w-xl">
          {/* Tag */}
          <span className={`inline-block rounded-full ${slide.accent} px-3 py-1 text-xs font-semibold text-black mb-4`}>
            {slide.tag}
          </span>

          {/* Title */}
          <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl whitespace-pre-line">
            {slide.title}
          </h1>

          {/* Subtitle */}
          <p className="mt-4 max-w-sm text-white/70 text-base sm:text-lg">
            {slide.subtitle}
          </p>

          {/* CTA */}
          <div className="mt-8 flex gap-3">
            <Button asChild size="lg" className="rounded-full bg-white text-black hover:bg-white/90 font-semibold">
              <Link href={slide.href}>
                {slide.cta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="rounded-full text-white border-white/30 border hover:bg-white/10">
              <Link href="/shop">View All</Link>
            </Button>
          </div>
        </div>

        {/* Decorative circle */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-white/5 blur-3xl pointer-events-none" />
      </div>

      <HeroControls active={active} count={HERO_SLIDES.length} onPrev={() => setActive((p) => (p - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)} onNext={() => setActive((p) => (p + 1) % HERO_SLIDES.length)} onSelect={setActive} />
    </section>
  );
}

function HeroControls({ active, count, onPrev, onNext, onSelect }: { active: number; count: number; onPrev: () => void; onNext: () => void; onSelect: (i: number) => void }) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4">
      <button onClick={onPrev} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40">
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="flex gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={cn('h-2 rounded-full transition-all', i === active ? 'w-6 bg-white' : 'w-2 bg-white/40')}
          />
        ))}
      </div>

      <button onClick={onNext} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Trust badges ──────────────────────────────────────────────────────────────

function TrustBadges() {
  const items = [
    { Icon: Truck, title: 'Free Delivery', sub: 'On orders over ৳999' },
    { Icon: RotateCcw, title: 'Easy Returns', sub: '7-day hassle-free returns' },
    { Icon: Shield, title: 'Secure Payment', sub: 'SSL encrypted checkout' },
    { Icon: Headphones, title: '24/7 Support', sub: 'Always here to help' },
  ];

  return (
    <section className="border-b border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {items.map(({ Icon, title, sub }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle, href, linkLabel = 'View All' }: { title: string; subtitle?: string; href: string; linkLabel?: string }) {
  return (
    <div className="mb-8 flex items-end justify-between">
      <div>
        <h2 className="font-display text-2xl font-bold sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <Link href={href} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline shrink-0">
        {linkLabel} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { data: featuredData } = useProducts({ limit: 8, sortBy: 'createdAt', sortOrder: 'desc' });
  const { data: newArrivalsData } = useProducts({ limit: 8, sortBy: 'createdAt', sortOrder: 'desc' });
  const { data: premiumData } = useProducts({ categorySlug: 'premium-wear', limit: 8, sortBy: 'createdAt', sortOrder: 'desc' });
  const { data: bestSellers } = useBestSellers(6);
  const { data: comboData } = useProducts({ isBundle: true, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' });
  const { data: brands } = useBrands();
  const { data: storiesData } = useStories();
  const { data: bannersData } = useBanners();

  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  const featuredProducts = featuredData?.products ?? [];
  const premiumProducts = premiumData?.products ?? [];
  const comboProducts = comboData?.products ?? [];
  const newArrivals = (newArrivalsData?.products ?? []).slice(4, 8);
  const topBrands = (brands ?? []).slice(0, 6);
  const activeStories = storiesData ?? [];
  const activeBanners = bannersData ?? [];
  const offerZoneBanners = activeBanners.filter((b) => b.type === 'OFFER_ZONE');

  return (
    <div className="flex flex-col">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <HeroCarousel banners={activeBanners.filter((b) => b.type === 'HERO')} />

      {/* ── Stories ──────────────────────────────────────────── */}
      {activeStories.length > 0 && (
        <StoriesCarousel
          stories={activeStories}
          onStoryClick={(_story: Story, index: number) => {
            setActiveStoryIndex(index);
            setViewerOpen(true);
          }}
        />
      )}

      {/* ── Promo Banners (slider + static) ──────────────────── */}
      <PromoBannerSection banners={activeBanners} />

      {/* ── Trust badges ─────────────────────────────────────── */}
      <TrustBadges />

      {/* ── Promo banner ─────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-12">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-8 text-white">
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-200">Special Offer</p>
            <h3 className="mt-2 font-display text-2xl font-bold">Up to 50% Off<br />Women's Collection</h3>
            <Button asChild size="sm" className="mt-4 rounded-full bg-white text-emerald-700 hover:bg-white/90 font-semibold">
              <Link href="/shop?gender=women">Shop Now <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 -right-6 h-28 w-28 rounded-full bg-white/10" />
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-white">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">New Arrivals</p>
            <h3 className="mt-2 font-display text-2xl font-bold">Men's Premium<br />Formal Wear</h3>
            <Button asChild size="sm" className="mt-4 rounded-full bg-amber-400 text-black hover:bg-amber-300 font-semibold">
              <Link href="/shop?gender=men">Explore Now <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-6 -right-6 h-28 w-28 rounded-full bg-white/5" />
          </div>
        </div>
      </section>

      {/* ── Premium ────────────────────────────────────────────── */}
      {premiumProducts.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-8 lg:px-12">
          <SectionHeader
            title="Premium"
            subtitle="Our finest premium wear collection"
            href="/category/premium-wear"
            linkLabel="View All Items"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
            {premiumProducts.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ── Top Selling Products ─────────────────────────────── */}
      {bestSellers && bestSellers.length > 0 && (
        <section className="bg-secondary/40 py-14">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-12">
            <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">Top Selling Products</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {bestSellers.map((product: Product) => (
                <TopSellingCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Exclusive Combo Deals ─────────────────────────────── */}
      {comboProducts.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-8 lg:px-12">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Gift className="h-5 w-5" />
              </div>
              <h2 className="font-display text-2xl font-bold sm:text-3xl">Exclusive Combo Deals</h2>
            </div>
            <Button asChild size="sm" className="rounded-full">
              <Link href="/shop?isBundle=true">
                View All Combos <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <ComboDealsCarousel products={comboProducts} />
        </section>
      )}

      {/* ── Offer Zone banners ────────────────────────────────── */}
      {offerZoneBanners.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-8 lg:px-12">
          <div className="grid gap-4 sm:grid-cols-2">
            {offerZoneBanners.map((banner) => (
              <Link
                key={banner.id}
                href={banner.linkUrl || '/shop?isOnSale=true'}
                className="group relative mx-auto block w-fit overflow-hidden rounded-2xl bg-secondary"
              >
                <Image
                  src={banner.imageUrl}
                  alt={banner.title ?? 'Offer'}
                  width={400}
                  height={533}
                  className="h-64 w-auto transition-transform duration-500 group-hover:scale-105 sm:h-80"
                />
                {(banner.title || banner.subtitle) && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent">
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      {banner.title && <p className="font-display text-lg font-bold">{banner.title}</p>}
                      {banner.subtitle && <p className="text-sm text-white/80">{banner.subtitle}</p>}
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured Products ─────────────────────────────────── */}
      {featuredProducts.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-8 lg:px-12">
          <SectionHeader
            title="Featured Products"
            subtitle="Handpicked styles for every occasion"
            href="/shop"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
            {featuredProducts.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ── New Arrivals ──────────────────────────────────────── */}
      {newArrivals.length > 0 && (
        <section className="bg-secondary/40 py-14">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-12">
            <SectionHeader
              title="New Arrivals"
              subtitle="Fresh styles added every week"
              href="/shop?sortBy=createdAt&sortOrder=desc"
              linkLabel="See All New"
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {newArrivals.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Brands ───────────────────────────────────────────── */}
      {topBrands.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-8 lg:px-12">
          <SectionHeader title="Our Brands" subtitle="Curated labels you can trust" href="/brand" />
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
            {topBrands.map((brand) => (
              <Link
                key={brand.id}
                href={`/brand/${brand.slug}`}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center transition-all hover:border-primary hover:shadow-md"
              >
                {brand.logoUrl ? (
                  <Image src={brand.logoUrl} alt={brand.name} width={56} height={56} className="h-14 w-14 object-contain" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                    {brand.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium">{brand.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Newsletter ────────────────────────────────────────── */}
      <section className="bg-foreground py-16 text-background">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-8">
          <h2 className="font-display text-3xl font-bold">Stay in the Loop</h2>
          <p className="mt-2 text-background/60">Get the latest arrivals, exclusive offers and style inspiration delivered to your inbox.</p>
          <form className="mt-6 flex gap-2 mx-auto max-w-md" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-full border border-background/20 bg-background/10 px-4 py-2.5 text-sm text-background placeholder-background/40 outline-none focus:border-primary"
            />
            <Button type="submit" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
              Subscribe
            </Button>
          </form>
        </div>
      </section>

      {/* ── Story Viewer ──────────────────────────────────────── */}
      {viewerOpen && activeStories.length > 0 && (
        <StoryViewer
          stories={activeStories}
          initialStoryIndex={activeStoryIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}
