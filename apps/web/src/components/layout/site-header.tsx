'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, User as UserIcon, LogOut, LayoutDashboard, ShoppingBag, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { CategoryMegaMenu } from './category-mega-menu';
import { NotificationBell } from './notification-bell';
import { cn } from '@/lib/utils';

const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPPORT', 'WAREHOUSE'];

export function SiteHeader() {
  const { user, isLoading, logout } = useAuth();
  const { data: cart } = useCart();
  const cartCount = cart?.itemCount ?? 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    setMenuOpen(false);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  }

  const isStaff = user && STAFF_ROLES.includes(user.role);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4">
        <Link href="/" className="shrink-0 font-display text-2xl font-bold text-foreground">
          Luxe<span className="text-primary">Mode</span>
        </Link>

        <div className="hidden flex-1 items-center gap-1 md:flex">
          <CategoryMegaMenu />
          <Link
            href="/brand"
            className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Brands
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="relative">
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </Button>

          {!isLoading && user && <NotificationBell />}

          {!isLoading && !user && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">
                <UserIcon className="h-4 w-4" />
                Sign in
              </Link>
            </Button>
          )}

          {!isLoading && user && (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary',
                  menuOpen && 'bg-secondary',
                )}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
                <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', menuOpen && 'rotate-180')} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-background shadow-lg ring-1 ring-black/5">
                  {/* User info */}
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>

                  <div className="py-1.5">
                    <Link
                      href="/account/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-secondary transition-colors"
                    >
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      My Profile
                    </Link>
                    <Link
                      href="/account/orders"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-secondary transition-colors"
                    >
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      My Orders
                    </Link>
                    {isStaff && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-secondary transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        Admin Panel
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-border py-1.5">
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    >
                      <LogOut className="h-4 w-4" />
                      {loggingOut ? 'Signing out…' : 'Sign out'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
