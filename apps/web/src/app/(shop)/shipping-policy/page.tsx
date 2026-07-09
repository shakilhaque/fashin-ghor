import type { Metadata } from 'next';
import { LegalPage } from '@/components/shop/legal-page';

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: 'Delivery timelines, shipping charges, and coverage areas for Fashion Ghor orders.',
  alternates: { canonical: `${WEB_URL}/shipping-policy` },
};

export default function ShippingPolicyPage() {
  return (
    <LegalPage title="Shipping Policy" updatedAt="July 2026">
      <h2>Delivery Timelines</h2>
      <p>
        Orders within Dhaka are typically delivered within 2–3 business days. Orders to other
        districts in Bangladesh may take 3–5 business days, depending on the courier's coverage.
      </p>

      <h2>Shipping Charges</h2>
      <p>
        Shipping charges are calculated at checkout based on your delivery address and order
        value. Orders above a qualifying amount may be eligible for free delivery — the applicable
        threshold is shown on the checkout page.
      </p>

      <h2>Order Tracking</h2>
      <p>
        Once your order is shipped, you'll receive a tracking number that you can use on our
        Order Tracking page to follow its progress.
      </p>

      <h2>Delays</h2>
      <p>
        Occasionally, deliveries may be delayed due to weather, courier disruptions, or high
        demand periods. We'll notify you if your order is significantly delayed.
      </p>
    </LegalPage>
  );
}
