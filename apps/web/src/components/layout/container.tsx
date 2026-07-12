import { cn } from '@/lib/utils';

/**
 * Single shared content container for the whole storefront. Caps content at
 * 1400px and centers it, so on very large screens (~2000px+) the margins
 * approach ~15% per side as requested, while on standard desktop/laptop
 * widths it just uses the padding gutters. Long-form reading pages (blog
 * articles, legal pages) intentionally keep their own narrower max-w-3xl —
 * this is for grid/section layouts (header, hero, product grids, footer).
 */
export function Container({
  children,
  className,
  as: As = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'main';
}) {
  return (
    <As className={cn('mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8', className)}>
      {children}
    </As>
  );
}
