'use client';

import { useState } from 'react';
import { Star, CheckCircle2, XCircle, Clock, Search, CheckCheck } from 'lucide-react';
import { useAdminReviews, useAdminReviewStats, useModerateReview, type Review } from '@/hooks/use-reviews';

const STATUS_TABS = [
  { label: 'Pending', value: 'PENDING', Icon: Clock, color: 'text-amber-600' },
  { label: 'Approved', value: 'APPROVED', Icon: CheckCircle2, color: 'text-emerald-600' },
  { label: 'Rejected', value: 'REJECTED', Icon: XCircle, color: 'text-destructive' },
  { label: 'All', value: '', Icon: CheckCheck, color: 'text-muted-foreground' },
];

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
}

function ReviewRow({ review }: { review: Review }) {
  const moderate = useModerateReview();
  const [expanded, setExpanded] = useState(false);

  const statusStyle = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
  }[review.status];

  return (
    <div className="rounded-lg border border-border bg-background p-4 space-y-3">
      <div className="flex flex-wrap items-start gap-3">
        {/* Avatar */}
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
          {review.user.name.charAt(0).toUpperCase()}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-sm">{review.user.name}</span>
            {review.isVerifiedPurchase && (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </span>
            )}
            <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle}`}>
              {review.status}
            </span>
          </div>

          <StarDisplay rating={review.rating} />

          {review.product && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              on <span className="font-medium text-foreground">{review.product.name}</span>
            </p>
          )}

          {review.title && <p className="mt-1.5 font-semibold text-sm">{review.title}</p>}

          {review.body && (
            <p className={`mt-1 text-sm text-muted-foreground ${!expanded && review.body.length > 150 ? 'line-clamp-2' : ''}`}>
              {review.body}
            </p>
          )}
          {review.body && review.body.length > 150 && (
            <button
              onClick={() => setExpanded((p) => !p)}
              className="text-xs text-primary hover:underline mt-0.5"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}

          <p className="mt-1.5 text-xs text-muted-foreground">
            {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Actions */}
      {review.status !== 'APPROVED' && review.status !== 'REJECTED' && (
        <div className="flex gap-2 pt-1 border-t border-border">
          <button
            disabled={moderate.isPending}
            onClick={() => moderate.mutate({ id: review.id, status: 'APPROVED' })}
            className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
          </button>
          <button
            disabled={moderate.isPending}
            onClick={() => moderate.mutate({ id: review.id, status: 'REJECTED' })}
            className="flex items-center gap-1.5 rounded-md border border-destructive px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            <XCircle className="h-3.5 w-3.5" /> Reject
          </button>
        </div>
      )}

      {review.status === 'APPROVED' && (
        <div className="pt-1 border-t border-border">
          <button
            disabled={moderate.isPending}
            onClick={() => moderate.mutate({ id: review.id, status: 'REJECTED' })}
            className="text-xs text-destructive hover:underline disabled:opacity-50"
          >
            Reject this review
          </button>
        </div>
      )}

      {review.status === 'REJECTED' && (
        <div className="pt-1 border-t border-border">
          <button
            disabled={moderate.isPending}
            onClick={() => moderate.mutate({ id: review.id, status: 'APPROVED' })}
            className="text-xs text-emerald-600 hover:underline disabled:opacity-50"
          >
            Approve this review
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [activeStatus, setActiveStatus] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const { data: statsData } = useAdminReviewStats();
  const stats = statsData ?? { pending: 0, approved: 0, rejected: 0, total: 0 };

  const { data, isLoading } = useAdminReviews({ page, status: activeStatus || undefined, search: search || undefined });
  const reviews = data?.data.reviews ?? [];
  const meta = data?.meta;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleTabChange = (v: string) => {
    setActiveStatus(v);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Star className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-xl font-bold">Reviews</h1>
          <p className="text-sm text-muted-foreground">Moderate customer reviews</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground">Approved</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground">Rejected</p>
          <p className="text-2xl font-bold text-destructive">{stats.rejected}</p>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-border bg-background overflow-hidden">
          {STATUS_TABS.map(({ label, value, Icon, color }) => (
            <button
              key={value}
              onClick={() => handleTabChange(value)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                activeStatus === value ? 'bg-primary text-primary-foreground' : `${color} hover:bg-secondary`
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search reviews…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-lg bg-secondary/50 animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <Star className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="font-medium">No reviews found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => <ReviewRow key={review.id} review={review} />)}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
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
    </div>
  );
}
