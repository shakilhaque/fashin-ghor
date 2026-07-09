import type { Metadata } from 'next';
import { FaqView } from './_faq-view';

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Answers to common questions about orders, delivery, payments, and returns at Fashion Ghor.',
  alternates: { canonical: `${WEB_URL}/faq` },
};

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-8">
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold">Frequently Asked Questions</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Can't find what you're looking for? <a href="/contact" className="text-primary hover:underline">Contact us</a>.
        </p>
      </div>
      <FaqView />
    </main>
  );
}
