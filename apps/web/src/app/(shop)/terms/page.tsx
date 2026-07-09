import type { Metadata } from 'next';
import { LegalPage } from '@/components/shop/legal-page';

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description: 'The terms and conditions for using Fashion Ghor and placing orders on our platform.',
  alternates: { canonical: `${WEB_URL}/terms` },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms and Conditions" updatedAt="July 2026">
      <p>
        By accessing or placing an order on Fashion Ghor, you agree to be bound by the terms and
        conditions below. Please read them carefully before using our services.
      </p>

      <h2>Orders and Payment</h2>
      <p>
        All orders are subject to product availability. Prices are listed in BDT and may change
        without prior notice. Payment must be completed through one of our supported methods
        before an order is confirmed, except where Cash on Delivery is offered.
      </p>

      <h2>Account Responsibility</h2>
      <p>
        You are responsible for maintaining the confidentiality of your account credentials and
        for all activity that occurs under your account.
      </p>

      <h2>Product Information</h2>
      <p>
        We make every effort to display product colors, sizing, and details accurately. Minor
        variations between the displayed image and the delivered product may occur due to
        photography and screen settings.
      </p>

      <h2>Limitation of Liability</h2>
      <p>
        Fashion Ghor is not liable for indirect or consequential damages arising from the use of
        this website or products purchased through it, to the extent permitted by law.
      </p>

      <h2>Changes to These Terms</h2>
      <p>
        We may update these terms from time to time. Continued use of the site after changes are
        posted constitutes acceptance of the revised terms.
      </p>
    </LegalPage>
  );
}
