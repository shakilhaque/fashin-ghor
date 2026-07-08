'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingCart, Star, CheckCircle2 } from 'lucide-react';
import { useProduct } from '@/hooks/use-products';
import { useAddToCart } from '@/hooks/use-cart';
import { useAuth } from '@/contexts/auth-context';
import {
  useProductReviews,
  useProductReviewStats,
  useCreateReview,
  type Review,
} from '@/hooks/use-reviews';
import { Button } from '@/components/ui/button';
import { cn, formatPrice } from '@/lib/utils';

function StarRating({ value, max = 5, size = 'md', onChange }: {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const sz = { sm: 'h-3.5 w-3.5', md: 'h-5 w-5', lg: 'h-6 w-6' }[size];
  const display = hover || value;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <button
          key={i}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(i + 1)}
          onMouseEnter={() => onChange && setHover(i + 1)}
          onMouseLeave={() => onChange && setHover(0)}
          className={cn('transition-colors', onChange ? 'cursor-pointer' : 'cursor-default')}
        >
          <Star
            className={cn(sz, i < display ? 'fill-amber-400 text-amber-400' : 'fill-none text-muted-foreground/40')}
          />
        </button>
      ))}
    </div>
  );
}

function RatingSummary({ productId }: { productId: string }) {
  const { data: stats } = useProductReviewStats(productId);
  if (!stats || stats.total === 0) return null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="text-center sm:pr-6 sm:border-r border-border">
        <p className="font-display text-4xl font-bold">{stats.average.toFixed(1)}</p>
        <StarRating value={Math.round(stats.average)} size="sm" />
        <p className="mt-1 text-xs text-muted-foreground">{stats.total} review{stats.total !== 1 ? 's' : ''}</p>
      </div>
      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = stats.distribution[star] ?? 0;
          const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-right text-muted-foreground">{star}</span>
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-4 text-muted-foreground">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="border-b border-border py-5 last:border-0">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
          {review.user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-sm">{review.user.name}</span>
            {review.isVerifiedPurchase && (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3 w-3" /> Verified Purchase
              </span>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <StarRating value={review.rating} size="sm" />
          {review.title && <p className="mt-1.5 font-semibold text-sm">{review.title}</p>}
          {review.body && <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>}
          {review.images.length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {review.images.map((url, i) => (
                <div key={i} className="relative h-16 w-16 rounded-md overflow-hidden border border-border">
                  <Image src={url} alt="" fill className="object-cover" sizes="64px" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WriteReviewForm({ productId, onDone }: { productId: string; onDone: () => void }) {
  const createReview = useCreateReview();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError('Please select a rating'); return; }
    setError('');
    try {
      await createReview.mutateAsync({ productId, rating, title: title || undefined, body: body || undefined });
      onDone();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to submit review');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Your Rating</label>
        <div className="mt-1.5">
          <StarRating value={rating} size="lg" onChange={setRating} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Title (optional)</label>
        <input
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Sum it up in a sentence"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Review (optional)</label>
        <textarea
          rows={4}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          placeholder="Share your experience with this product"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={createReview.isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {createReview.isPending ? 'Submitting…' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
}

function ReviewsSection({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const { data } = useProductReviews(productId, page);
  const reviews = data?.data.reviews ?? [];
  const meta = data?.meta;

  return (
    <section className="mt-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold">Customer Reviews</h2>
        {user && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            Write a Review
          </button>
        )}
        {!user && (
          <Link href="/login" className="text-sm text-primary hover:underline">
            Sign in to review
          </Link>
        )}
      </div>

      <RatingSummary productId={productId} />

      {showForm && (
        <div className="mt-6 rounded-xl border border-border bg-background p-6">
          <h3 className="font-semibold mb-4">Write a Review</h3>
          <WriteReviewForm productId={productId} onDone={() => setShowForm(false)} />
        </div>
      )}

      <div className="mt-6">
        {reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-12 text-center">
            <Star className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="font-medium">No reviews yet</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to share your thoughts.</p>
          </div>
        ) : (
          <>
            {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
            {meta && meta.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40 hover:bg-secondary"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-muted-foreground">
                  {meta.page} / {meta.totalPages}
                </span>
                <button
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40 hover:bg-secondary"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function ProductRatingBadge({ productId }: { productId: string }) {
  const { data: stats } = useProductReviewStats(productId);
  if (!stats || stats.total === 0) return null;
  return (
    <div className="flex items-center gap-2">
      <StarRating value={Math.round(stats.average)} size="sm" />
      <span className="text-sm text-muted-foreground">
        {stats.average.toFixed(1)} ({stats.total})
      </span>
    </div>
  );
}

export function ProductView({ slug }: { slug: string }) {
  const { data: product, isLoading, isError } = useProduct(slug);
  const router = useRouter();

  const addToCart = useAddToCart();
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const colors = useMemo(
    () => [...new Set(product?.variants.map((v) => v.color).filter(Boolean))] as string[],
    [product],
  );
  const sizes = useMemo(
    () => [...new Set(product?.variants.map((v) => v.size).filter(Boolean))] as string[],
    [product],
  );

  const selectedVariant = product?.variants.find(
    (v) => (!colors.length || v.color === selectedColor) && (!sizes.length || v.size === selectedSize),
  );

  const hasVariants = Boolean(product?.variants.length);
  const inStock = hasVariants ? (selectedVariant?.stock ?? 0) > 0 : (product?.stock ?? 0) > 0;
  const displayPrice = selectedVariant?.price ?? product?.price ?? 0;

  if (isLoading) {
    return <div className="px-4 py-20 text-center text-muted-foreground">Loading…</div>;
  }

  if (isError || !product) {
    return (
      <div className="px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">Product not found</h1>
        <Link href="/shop" className="mt-4 inline-block text-primary hover:underline">
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        {' / '}
        <Link href="/shop" className="hover:text-foreground">Shop</Link>
        {product.category && (
          <>
            {' / '}
            <Link href={`/category/${product.category.slug}`} className="hover:text-foreground">
              {product.category.name}
            </Link>
          </>
        )}
        {' / '}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        {/* Images */}
        <div>
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-secondary">
            {product.images[activeImage] ? (
              <Image
                src={product.images[activeImage].url}
                alt={product.images[activeImage].altText ?? product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setActiveImage(index)}
                  className={cn(
                    'relative h-20 w-16 overflow-hidden rounded-lg border-2',
                    index === activeImage ? 'border-primary' : 'border-transparent',
                  )}
                >
                  <Image src={image.url} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.brand && (
            <Link href={`/brand/${product.brand.slug}`} className="text-sm font-medium text-primary hover:underline">
              {product.brand.name}
            </Link>
          )}
          <h1 className="mt-1 font-display text-3xl font-bold text-foreground">{product.name}</h1>

          <div className="mt-3">
            <ProductRatingBadge productId={product.id} />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className="font-display text-2xl font-semibold">{formatPrice(displayPrice)}</span>
            {product.comparePrice && (
              <span className="text-lg text-muted-foreground line-through">{formatPrice(product.comparePrice)}</span>
            )}
            {product.discount > 0 && (
              <span className="rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                -{product.discount}%
              </span>
            )}
          </div>

          <p className="mt-6 text-muted-foreground">{product.description}</p>

          {colors.length > 0 && (
            <div className="mt-6">
              <span className="text-sm font-medium">Color</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      'rounded-lg border px-4 py-2 text-sm transition-colors',
                      selectedColor === color
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary',
                    )}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div className="mt-6">
              <span className="text-sm font-medium">Size</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      'rounded-lg border px-4 py-2 text-sm transition-colors',
                      selectedSize === size
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary',
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 text-sm">
            {inStock ? (
              <span className="text-primary">In stock</span>
            ) : (
              <span className="text-destructive">Out of stock</span>
            )}
          </div>

          {/* Quantity */}
          <div className="mt-6">
            <span className="text-sm font-medium">Quantity</span>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                <button
                  type="button"
                  onClick={() => {
                    const maxQty = hasVariants ? (selectedVariant?.stock ?? 0) : (product?.stock ?? 0);
                    setQuantity((q) => (maxQty ? Math.min(maxQty, q + 1) : q + 1));
                  }}
                  disabled={!inStock}
                  className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              size="lg"
              variant="outline"
              disabled={!inStock || (hasVariants && !selectedVariant) || addToCart.isPending}
              onClick={async () => {
                if (!product) return;
                await addToCart.mutateAsync({
                  productId: product.id,
                  variantId: selectedVariant?.id,
                  quantity,
                });
                setAddedFeedback(true);
                setTimeout(() => setAddedFeedback(false), 2000);
              }}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {addedFeedback ? 'Added!' : addToCart.isPending ? 'Adding…' : 'Add to Cart'}
            </Button>
            <Button
              size="lg"
              disabled={!inStock || (hasVariants && !selectedVariant) || isBuyingNow}
              onClick={async () => {
                if (!product) return;
                setIsBuyingNow(true);
                try {
                  await addToCart.mutateAsync({
                    productId: product.id,
                    variantId: selectedVariant?.id,
                    quantity,
                  });
                  router.push('/checkout');
                } finally {
                  setIsBuyingNow(false);
                }
              }}
            >
              {isBuyingNow ? 'Please wait…' : 'Buy Now'}
            </Button>
          </div>

          {product.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <ReviewsSection productId={product.id} />
    </main>
  );
}
