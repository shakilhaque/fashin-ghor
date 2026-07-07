'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
  useDeleteNotification,
  type AppNotification,
} from '@/hooks/use-notifications';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotificationRow({ n }: { n: AppNotification }) {
  const markRead = useMarkRead();
  const deleteN = useDeleteNotification();

  return (
    <div className={`flex gap-4 rounded-xl border border-border bg-background p-4 transition-colors ${n.isRead ? 'opacity-70' : 'border-primary/20 bg-primary/5'}`}>
      <div className="mt-1 flex-shrink-0">
        {!n.isRead ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Bell className="h-4 w-4 text-primary" />
          </span>
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm ${n.isRead ? 'font-normal' : 'font-semibold'}`}>{n.title}</p>
          <span className="text-xs text-muted-foreground shrink-0">{timeAgo(n.createdAt)}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
        {n.actionUrl && (
          <Link
            href={n.actionUrl}
            onClick={() => { if (!n.isRead) markRead.mutate(n.id); }}
            className="mt-2 inline-block text-xs text-primary hover:underline"
          >
            View details →
          </Link>
        )}
      </div>

      <div className="flex gap-1 flex-shrink-0">
        {!n.isRead && (
          <button
            onClick={() => markRead.mutate(n.id)}
            disabled={markRead.isPending}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
            title="Mark as read"
          >
            <Check className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => deleteN.mutate(n.id)}
          disabled={deleteN.isPending}
          className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useNotifications(page);
  const markAllRead = useMarkAllRead();

  const notifications = data?.data.notifications ?? [];
  const meta = data?.meta;
  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Notifications</h1>
          {unread > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">{unread} unread</p>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary disabled:opacity-50 transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-secondary/50" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-lg">No notifications</p>
          <p className="mt-2 text-sm text-muted-foreground">You're all caught up!</p>
          <Link href="/" className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <NotificationRow key={n.id} n={n} />
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40 hover:bg-secondary"
          >
            Previous
          </button>
          <span className="px-3 py-2 text-sm text-muted-foreground">{meta.page} / {meta.totalPages}</span>
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
