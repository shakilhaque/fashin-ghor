import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-secondary/40 px-4 py-12">
      <Link href="/" className="mb-8 font-display text-3xl font-bold text-foreground">
        Fashion <span className="text-primary">Ghor</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
