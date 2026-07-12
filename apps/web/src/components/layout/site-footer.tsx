import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Container } from './container';

const STORE_PHONE = process.env.NEXT_PUBLIC_STORE_PHONE || '+8801700000000';

const COMPANY_LINKS = [
  { href: '/contact', label: 'Contact Us' },
  { href: '/blog', label: 'The Blog' },
  { href: '/terms', label: 'Terms and Conditions' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/shipping-policy', label: 'Shipping Policy' },
  { href: '/return-policy', label: 'Return & Refund Policy' },
  { href: '/faq', label: 'FAQ' },
];

const ACCOUNT_LINKS = [
  { href: '/account', label: 'My Account' },
  { href: '/account/orders', label: 'My Orders' },
  { href: '/track', label: 'Order Tracking' },
  { href: '/login', label: 'Sign In' },
];

const CATEGORY_LINKS = [
  { href: '/category/cotton-wear', label: 'Cotton Wear' },
  { href: '/category/party-wear', label: 'Party Wear' },
  { href: '/category/premium-wear', label: 'Premium Wear' },
  { href: '/shop', label: 'All Products' },
];

const PAYMENT_METHODS = ['Visa', 'Mastercard', 'bKash', 'Nagad', 'SSLCommerz'];

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-white">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-zinc-400 hover:text-white transition-colors">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-zinc-950 text-zinc-300">
      <Container className="py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="font-display text-2xl font-bold text-white">
              Fashion <span className="text-primary">Ghor</span>
            </Link>
            <p className="mt-3 text-sm text-zinc-400">
              Premium fashion, curated for the modern wardrobe.
            </p>
            <div className="mt-4 space-y-2 text-sm text-zinc-400">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" /> Dhaka, Bangladesh
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                <a href={`tel:${STORE_PHONE}`} className="hover:text-white transition-colors">{STORE_PHONE}</a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <a href="mailto:hello@fashionghor.com" className="hover:text-white transition-colors">hello@fashionghor.com</a>
              </p>
            </div>
          </div>

          <FooterColumn title="Company" links={COMPANY_LINKS} />
          <FooterColumn title="Accounts" links={ACCOUNT_LINKS} />
          <FooterColumn title="Categories" links={CATEGORY_LINKS} />
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 border-t border-zinc-800 pt-8 sm:flex-row sm:justify-between">
          <p className="text-xs text-zinc-500">
            © {new Date().getFullYear()} Fashion Ghor. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {PAYMENT_METHODS.map((method) => (
              <span key={method} className="rounded-md border border-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-400">
                {method}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
