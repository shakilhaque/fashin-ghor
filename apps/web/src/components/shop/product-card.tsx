'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Eye } from 'lucide-react';
import type { Product } from '@ecommerce/types';
import { formatPrice, cn } from '@/lib/utils';
import { useAddToCart } from '@/hooks/use-cart';

export function ProductCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false);
  const addToCart = useAddToCart();
  const image = product.images[0];
  const hasVariants = product.variants.length > 0;
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : product.discount;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (hasVariants) return;
    addToCart.mutate({ productId: product.id, quantity: 1 });
  }

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image container */}
      <Link href={`/product/${product.slug}`} className="relative block aspect-[3/4] overflow-hidden bg-secondary">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText ?? product.name}
            fill
            className={cn('object-contain transition-transform duration-500', hovered && 'scale-105')}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ShoppingCart className="h-10 w-10 opacity-20" />
          </div>
        )}

        {/* Save badge */}
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded bg-emerald-600 px-1.5 py-0.5 text-xs font-semibold text-white">
            Save {discount}%
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute left-2 top-2 rounded bg-zinc-500 px-1.5 py-0.5 text-xs font-semibold text-white">
            Out of Stock
          </span>
        )}

        {/* Quick view overlay */}
        <div className={cn(
          'absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-black/50 py-2 transition-all duration-300',
          hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        )}>
          <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-black">
            <Eye className="h-3 w-3" /> Quick View
          </span>
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {product.brand && (
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {product.brand.name}
          </span>
        )}
        <Link href={`/product/${product.slug}`} className="line-clamp-2 text-sm font-medium leading-snug hover:text-primary">
          {product.name}
        </Link>

        <div className="mt-1 flex items-center gap-2">
          <span className="font-semibold text-foreground">{formatPrice(product.price)}</span>
          {product.comparePrice && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.comparePrice)}</span>
          )}
        </div>

        {/* Add to Cart button */}
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0 || addToCart.isPending}
          className={cn(
            'mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-medium transition-colors',
            product.stock === 0
              ? 'cursor-not-allowed border-border text-muted-foreground'
              : hasVariants
                ? 'border-primary text-primary hover:bg-primary hover:text-primary-foreground'
                : 'border-primary bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground',
          )}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          {product.stock === 0 ? 'Out of Stock' : hasVariants ? 'Select Options' : 'Add To Cart'}
        </button>
      </div>
    </div>
  );
}
