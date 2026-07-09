import type { Metadata } from 'next';
import { Truck, RotateCcw, Shield, Headphones } from 'lucide-react';

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Fashion Ghor — our story, our values, and why customers trust us for premium fashion.',
  alternates: { canonical: `${WEB_URL}/about` },
};

const VALUES = [
  { Icon: Truck, title: 'Fast Delivery', desc: 'Reliable, tracked delivery across Bangladesh.' },
  { Icon: RotateCcw, title: 'Easy Returns', desc: '7-day hassle-free return policy on every order.' },
  { Icon: Shield, title: 'Secure Payments', desc: 'SSL-encrypted checkout with trusted payment partners.' },
  { Icon: Headphones, title: '24/7 Support', desc: 'Our team is always here to help with your order.' },
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-8">
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold">About Fashion Ghor</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Premium fashion, curated for the modern wardrobe.
        </p>
      </div>

      <div className="mt-12 space-y-6 text-muted-foreground leading-relaxed">
        <p>
          Fashion Ghor is a destination for curated style — bringing together premium clothing,
          accessories, and everyday essentials for men, women, and kids. We believe great fashion
          should be accessible, affordable, and delivered right to your door.
        </p>
        <p>
          From cotton wear to party wear and premium collections, every product on Fashion Ghor
          is selected with quality and comfort in mind. We work directly with trusted brands and
          manufacturers to bring you the best value without compromising on style.
        </p>
      </div>

      <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4">
        {VALUES.map(({ Icon, title, desc }) => (
          <div key={title} className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
