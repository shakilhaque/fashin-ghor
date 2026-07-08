import Link from 'next/link';
import { AccountNav } from '@/components/account/account-nav';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-display text-2xl font-bold text-foreground">
            Fashion <span className="text-primary">Ghor</span>
          </Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-10 md:grid-cols-[200px_1fr]">
        <AccountNav />
        <main>{children}</main>
      </div>
    </div>
  );
}
