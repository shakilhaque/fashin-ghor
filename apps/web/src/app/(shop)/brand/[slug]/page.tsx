import type { Metadata } from 'next';
import { breadcrumbSchema } from '@/lib/jsonld';
import { BrandView } from './_brand-view';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';

type Props = { params: Promise<{ slug: string }> };

async function fetchBrand(slug: string) {
  try {
    const res = await fetch(`${API_URL}/brands/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.brand ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand = await fetchBrand(slug);
  if (!brand) return {};

  const name = brand.name as string;
  const description = ((brand.description ?? `Shop ${name} at Fashion Ghor — premium fashion curated for you.`) as string).slice(0, 160);
  const canonicalUrl = `${WEB_URL}/brand/${slug}`;

  return {
    title: name,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${name} | Fashion Ghor`,
      description,
      url: canonicalUrl,
      type: 'website',
      images: brand.logoUrl ? [{ url: brand.logoUrl as string, alt: name }] : [],
    },
    twitter: { card: 'summary', title: `${name} | Fashion Ghor`, description },
  };
}

export default async function BrandPage({ params }: Props) {
  const { slug } = await params;
  const brand = await fetchBrand(slug);

  let jsonLd: string | null = null;
  if (brand) {
    jsonLd = JSON.stringify(
      breadcrumbSchema([
        { name: 'Home', url: WEB_URL },
        { name: 'Brands', url: `${WEB_URL}/brand` },
        { name: brand.name as string, url: `${WEB_URL}/brand/${slug}` },
      ]),
    );
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      )}
      <BrandView slug={slug} />
    </>
  );
}
