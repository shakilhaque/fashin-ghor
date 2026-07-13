import type { Metadata } from 'next';
import { breadcrumbSchema } from '@/lib/jsonld';
import { ComboView } from './_combo-view';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';

type Props = { params: Promise<{ slug: string }> };

async function fetchCombo(slug: string) {
  try {
    const res = await fetch(`${API_URL}/combos/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.combo ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const combo = await fetchCombo(slug);
  if (!combo) return {};

  const name = combo.name as string;
  const description = ((combo.description ?? `${name} — a bundled combo deal at Fashion Ghor.`) as string).slice(0, 160);
  const canonicalUrl = `${WEB_URL}/combo/${slug}`;

  return {
    title: name,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${name} | Fashion Ghor`,
      description,
      url: canonicalUrl,
      type: 'website',
      images: combo.imageUrl ? [{ url: combo.imageUrl as string, alt: name }] : [],
    },
    twitter: { card: 'summary', title: `${name} | Fashion Ghor`, description },
  };
}

export default async function ComboPage({ params }: Props) {
  const { slug } = await params;
  const combo = await fetchCombo(slug);

  let jsonLd: string | null = null;
  if (combo) {
    jsonLd = JSON.stringify(
      breadcrumbSchema([
        { name: 'Home', url: WEB_URL },
        { name: 'Combo Deals', url: `${WEB_URL}/combo` },
        { name: combo.name as string, url: `${WEB_URL}/combo/${slug}` },
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
      <ComboView slug={slug} />
    </>
  );
}
