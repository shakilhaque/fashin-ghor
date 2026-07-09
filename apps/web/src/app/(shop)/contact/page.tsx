import type { Metadata } from 'next';
import { Mail, Phone, MapPin } from 'lucide-react';

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';
const STORE_PHONE = process.env.NEXT_PUBLIC_STORE_PHONE || '+8801700000000';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the Fashion Ghor team — we usually reply within 24 hours.',
  alternates: { canonical: `${WEB_URL}/contact` },
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-8">
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold">Contact Us</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Have a question about an order or a product? We're here to help.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border p-6 text-center">
          <Phone className="h-6 w-6 text-primary" />
          <p className="text-sm font-semibold">Call Us</p>
          <a href={`tel:${STORE_PHONE}`} className="text-sm text-muted-foreground hover:text-primary">{STORE_PHONE}</a>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border p-6 text-center">
          <Mail className="h-6 w-6 text-primary" />
          <p className="text-sm font-semibold">Email Us</p>
          <a href="mailto:hello@fashionghor.com" className="text-sm text-muted-foreground hover:text-primary">hello@fashionghor.com</a>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border p-6 text-center">
          <MapPin className="h-6 w-6 text-primary" />
          <p className="text-sm font-semibold">Location</p>
          <p className="text-sm text-muted-foreground">Dhaka, Bangladesh</p>
        </div>
      </div>

      <p className="mt-12 text-center text-sm text-muted-foreground">
        For order-related queries, please include your order number so we can help faster.
      </p>
    </main>
  );
}
