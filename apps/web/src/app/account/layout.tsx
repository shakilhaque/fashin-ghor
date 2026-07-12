import Link from 'next/link';
import { AccountNav } from '@/components/account/account-nav';
import { Container } from '@/components/layout/container';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-background">
        <Container className="flex items-center justify-between py-4">
          <Link href="/" className="font-display text-2xl font-bold text-foreground">
            Fashion <span className="text-primary">Ghor</span>
          </Link>
        </Container>
      </header>
      <Container className="grid grid-cols-1 gap-8 py-10 md:grid-cols-[200px_1fr]">
        <AccountNav />
        <main>{children}</main>
      </Container>
    </div>
  );
}
