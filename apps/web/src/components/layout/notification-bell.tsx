'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import {
  useNotifications,
  useUnreadCount,
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
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function NotificationItem({ n, onClose }: { n: AppNotification; onClose: () => void }) {
  const markRead = useMarkRead();
  const deleteN = useDeleteNotification();

  const handleClick = () => {
    if (!n.isRead) markRead.mutate(n.id);
    onClose();
  };

  return (
    <div className={`flex gap-3 px-4 py-3 transition-colors hover:bg-secondary/50 ${n.isRead ? 'opacity-70' : ''}`}>
      {/* Unread dot */}
      <div className="mt-1.5 flex-shrink-0">
        {!n.isRead ? (
          <span className="block h-2 w-2 rounded-full bg-primary" />
        ) : (
          <span className="block h-2 w-2 rounded-full bg-transparent" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {n.actionUrl ? (
          <Link
            href={n.actionUrl}
            onClick={handleClick}
            className="block"
          >
            <p className={`text-sm leading-snug ${n.isRead ? 'font-normal' : 'font-semibold'}`}>
              {n.title}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>
            <p className="mt-1 text-xs text-muted-foreground/70">{timeAgo(n.createdAt)}</p>
          </Link>
        ) : (
          <div>
            <p className={`text-sm leading-snug ${n.isRead ? 'font-normal' : 'font-semibold'}`}>
              {n.title}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>
            <p className="mt-1 text-xs text-muted-foreground/70">{timeAgo(n.createdAt)}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1 flex-shrink-0">
        {!n.isRead && (
          <button
            onClick={() => markRead.mutate(n.id)}
            className="rounded p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="Mark as read"
          >
            <Check className="h-3 w-3" />
          </button>
        )}
        <button
          onClick={() => deleteN.mutate(n.id)}
          className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Delete"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: count = 0 } = useUnreadCount();
  const { data, isLoading } = useNotifications(1);
  const markAllRead = useMarkAllRead();

  const notifications = data?.data.notifications ?? [];

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background hover:bg-secondary transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-border bg-background shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <div className="flex items-center gap-1">
              {count > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  All read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-border">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-secondary/50" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-medium">All caught up!</p>
                <p className="text-xs text-muted-foreground mt-1">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem key={n.id} n={n} onClose={() => setOpen(false)} />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border px-4 py-2.5 text-center">
              <Link
                href="/account/notifications"
                onClick={() => setOpen(false)}
                className="text-xs text-primary hover:underline"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
