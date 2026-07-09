'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAQS = [
  {
    q: 'How long does delivery take?',
    a: 'Orders within Dhaka usually arrive in 2–3 business days, and 3–5 business days elsewhere in Bangladesh.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept bKash, Nagad, major debit/credit cards via SSLCommerz, and Cash on Delivery in select areas.',
  },
  {
    q: 'Can I return or exchange a product?',
    a: 'Yes — unused items in original packaging can be returned or exchanged within 7 days of delivery. See our Return & Refund Policy for details.',
  },
  {
    q: 'How do I track my order?',
    a: 'Once your order ships, you\'ll get a tracking number by email/SMS. You can also check status anytime from the Order Tracking page or My Orders.',
  },
  {
    q: 'Do you deliver outside Dhaka?',
    a: 'Yes, we deliver nationwide across Bangladesh through our courier partners.',
  },
  {
    q: 'How can I contact customer support?',
    a: 'Reach us via the Contact Us page, WhatsApp, or call the number listed on any product page.',
  },
];

export function FaqView() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mt-10 divide-y divide-border rounded-2xl border border-border">
      {FAQS.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.q}>
            <button
              onClick={() => setOpenIndex(open ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-medium">{item.q}</span>
              <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
            </button>
            {open && (
              <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
