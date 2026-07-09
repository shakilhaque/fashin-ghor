import type { Metadata } from 'next';
import { LegalPage } from '@/components/shop/legal-page';

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Fashion Ghor collects, uses, and protects your personal information.',
  alternates: { canonical: `${WEB_URL}/privacy` },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updatedAt="July 2026">
      <p>
        This Privacy Policy explains how Fashion Ghor collects, uses, and safeguards your
        information when you use our website and services.
      </p>

      <h2>Information We Collect</h2>
      <p>
        We collect information you provide directly, such as your name, email, phone number, and
        delivery address when you create an account or place an order. We also collect basic
        usage data to improve our services.
      </p>

      <h2>How We Use Your Information</h2>
      <p>
        Your information is used to process orders, provide customer support, send order updates,
        and — where you've opted in — share promotions and offers.
      </p>

      <h2>Data Sharing</h2>
      <p>
        We share order details only with the courier and payment partners needed to fulfill your
        purchase. We do not sell your personal information to third parties.
      </p>

      <h2>Data Security</h2>
      <p>
        We use industry-standard measures, including encrypted checkout and secure password
        storage, to protect your data.
      </p>

      <h2>Your Rights</h2>
      <p>
        You may request access to, correction of, or deletion of your personal data at any time by
        contacting our support team.
      </p>
    </LegalPage>
  );
}
