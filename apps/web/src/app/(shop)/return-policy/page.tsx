import type { Metadata } from 'next';
import { LegalPage } from '@/components/shop/legal-page';

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Return & Refund Policy',
  description: 'How to return a product and how refunds are processed at Fashion Ghor.',
  alternates: { canonical: `${WEB_URL}/return-policy` },
};

export default function ReturnPolicyPage() {
  return (
    <LegalPage title="Return & Refund Policy" updatedAt="July 2026">
      <h2>Return Window</h2>
      <p>
        You can request a return within 7 days of delivery, provided the product is unused, in its
        original packaging, and with tags attached.
      </p>

      <h2>Non-Returnable Items</h2>
      <p>
        For hygiene reasons, innerwear and swimwear cannot be returned unless defective. Items
        marked as final sale are also non-returnable.
      </p>

      <h2>How to Start a Return</h2>
      <p>
        Go to My Orders, select the order, and choose "Request Return." Our team will arrange a
        pickup or provide return instructions within 24–48 hours.
      </p>

      <h2>Refunds</h2>
      <p>
        Once the returned item is received and inspected, refunds are issued to your original
        payment method (or as store credit for Cash on Delivery orders) within 5–7 business days.
      </p>

      <h2>Exchanges</h2>
      <p>
        Need a different size or color instead? Select "Exchange" during the return request and
        we'll ship the replacement once the original item is picked up.
      </p>
    </LegalPage>
  );
}
