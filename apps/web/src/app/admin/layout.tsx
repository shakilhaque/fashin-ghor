'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Package, Users, Tag, Settings, Truck, Star, BookOpen, BarChart2, ChevronRight, Clapperboard, Receipt, UserCircle, ImageIcon } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard, exact: true },
  { href: '/admin/analytics', label: 'Analytics', Icon: BarChart2 },
  { href: '/admin/orders', label: 'Orders', Icon: ShoppingBag },
  { href: '/admin/products', label: 'Products', Icon: Package },
  { href: '/admin/customers', label: 'Customers', Icon: UserCircle },
  { href: '/admin/users', label: 'Staff', Icon: Users },
  { href: '/admin/coupons', label: 'Coupons', Icon: Tag },
  { href: '/admin/shipping', label: 'Shipping', Icon: Truck },
  { href: '/admin/reviews', label: 'Reviews', Icon: Star },
  { href: '/admin/blog', label: 'Blog', Icon: BookOpen },
  { href: '/admin/stories', label: 'Stories', Icon: Clapperboard },
  { href: '/admin/banners', label: 'Banners', Icon: ImageIcon },
  { href: '/admin/expenses', label: 'Expenses', Icon: Receipt },
  { href: '/admin/settings', label: 'Settings', Icon: Settings },
];

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPPORT', 'WAREHOUSE'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) return;
    if (!isLoading && (!user || !ADMIN_ROLES.includes(user.role))) {
      router.replace('/admin/login');
    }
  }, [isLoading, user, router, isLoginPage]);

  // Login page renders without the admin shell
  if (isLoginPage) return <>{children}</>;

  if (isLoading) return null;
  if (!user || !ADMIN_ROLES.includes(user.role)) return null;

  return (
    <div className="flex min-h-screen bg-secondary/40">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-background md:flex">
        <div className="border-b border-border px-5 py-4">
          <Link href="/" className="font-display text-xl font-bold">
            Luxe<span className="text-primary">Mode</span>
            <span className="ml-2 text-xs font-normal text-muted-foreground">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          {user.name} · {user.role}
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3 md:hidden">
          <Link href="/" className="font-display text-lg font-bold">
            Luxe<span className="text-primary">Mode</span>
          </Link>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {navItems
              .filter(({ href, exact }) => exact ? pathname === href : pathname.startsWith(href))
              .map(({ label }) => label)[0] ?? 'Admin'}
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="hidden items-center gap-1 border-b border-border bg-background px-6 py-2 text-xs text-muted-foreground md:flex">
          <Link href="/admin" className="hover:text-foreground">Admin</Link>
          {pathname !== '/admin' && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground capitalize">{pathname.split('/admin/')[1]?.split('/')[0]}</span>
            </>
          )}
        </div>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
