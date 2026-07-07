'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PromoBanner } from '@/hooks/use-banners';

interface Props {
  banners: PromoBanner[];
}

function SliderBanner({ banners }: { banners: PromoBanner[] }) {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goNext = useCallback(() => setActive((p) => (p + 1) % banners.length), [banners.length]);
  const goPrev = useCallback(() => setActive((p) => (p - 1 + banners.length) % banners.length), [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    timerRef.current = setInterval(goNext, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [banners.length, goNext]);

  function restart() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(goNext, 4000);
  }

  if (banners.length === 0) return null;

  const banner = banners[active];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-secondary" style={{ aspectRatio: '16/7' }}>
      {/* Slides */}
      {banners.map((b, i) => (
        <div
          key={b.id}
          className={cn(
            'absolute inset-0 transition-opacity duration-700',
            i === active ? 'opacity-100 z-10' : 'opacity-0 z-0',
          )}
        >
          <Image
            src={b.imageUrl}
            alt={b.title ?? 'Banner'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 65vw"
            priority={i === 0}
          />
          {/* Gradient overlay for text */}
          {(b.title || b.subtitle || b.linkUrl) && (
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
          )}
          {/* Text overlay */}
          {(b.title || b.subtitle || b.linkUrl) && (
            <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 text-white">
              {b.badgeText && (
                <span className="mb-2 inline-block w-fit rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
                  {b.badgeText}
                </span>
              )}
              {b.title && (
                <h3 className="font-display text-xl font-bold leading-tight sm:text-2xl lg:text-3xl max-w-xs">
                  {b.title}
                </h3>
              )}
              {b.subtitle && (
                <p className="mt-1.5 max-w-xs text-xs text-white/80 sm:text-sm">{b.subtitle}</p>
              )}
              {b.linkUrl && (
                <Link
                  href={b.linkUrl}
                  className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black hover:bg-white/90 transition-colors"
                >
                  {b.linkLabel ?? 'Shop Now'} <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Arrows — only show if multiple slides */}
      {banners.length > 1 && (
        <>
          <button
            onClick={() => { goPrev(); restart(); }}
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => { goNext(); restart(); }}
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 flex items-center gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => { setActive(i); restart(); }}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === active ? 'w-5 bg-white' : 'w-1.5 bg-white/50',
                )}
              />
            ))}
          </div>
        </>
      )}

      {/* Single banner: wrap in link */}
      {banners.length === 1 && banner.linkUrl && (
        <Link href={banner.linkUrl} className="absolute inset-0 z-20" aria-label={banner.title ?? 'Banner'} />
      )}
    </div>
  );
}

function StaticBanner({ banner }: { banner: PromoBanner }) {
  const content = (
    <div className="relative w-full overflow-hidden rounded-2xl bg-secondary h-full" style={{ minHeight: '180px' }}>
      <Image
        src={banner.imageUrl}
        alt={banner.title ?? 'Promo'}
        fill
        className="object-cover transition-transform duration-500 hover:scale-105"
        sizes="(max-width: 768px) 100vw, 35vw"
      />
      {(banner.title || banner.subtitle || banner.linkUrl) && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      )}
      {(banner.title || banner.subtitle) && (
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          {banner.badgeText && (
            <span className="mb-1.5 inline-block rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
              {banner.badgeText}
            </span>
          )}
          {banner.title && (
            <h3 className="font-display text-lg font-bold leading-tight sm:text-xl">{banner.title}</h3>
          )}
          {banner.subtitle && (
            <p className="mt-1 text-xs text-white/80">{banner.subtitle}</p>
          )}
          {banner.linkUrl && (
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white underline underline-offset-2">
              {banner.linkLabel ?? 'Shop Now'} <ArrowRight className="h-3 w-3" />
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (banner.linkUrl) {
    return (
      <Link href={banner.linkUrl} className="block h-full">
        {content}
      </Link>
    );
  }
  return content;
}

export function PromoBannerSection({ banners }: Props) {
  const sliders = banners.filter((b) => b.type === 'SLIDER');
  const statics = banners.filter((b) => b.type === 'STATIC');

  // Need at least one banner to render the section
  if (banners.length === 0) return null;

  // Layout variants based on available banner types
  if (sliders.length > 0 && statics.length > 0) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 lg:px-12">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <SliderBanner banners={sliders} />
          <div className="flex flex-col gap-4">
            {statics.map((b) => (
              <div key={b.id} className="flex-1" style={{ minHeight: statics.length === 1 ? '100%' : undefined }}>
                <StaticBanner banner={b} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (sliders.length > 0) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 lg:px-12">
        <SliderBanner banners={sliders} />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-8 lg:px-12">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statics.map((b) => (
          <div key={b.id} style={{ aspectRatio: '4/3' }} className="relative">
            <StaticBanner banner={b} />
          </div>
        ))}
      </div>
    </section>
  );
}
