'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const links = [
  { href: '/account/profile', label: 'Profile' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/orders', label: 'Orders' },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            pathname === link.href
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground hover:bg-secondary',
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
