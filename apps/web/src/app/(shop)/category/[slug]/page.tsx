import type { Metadata } from 'next';
import { breadcrumbSchema } from '@/lib/jsonld';
import { CategoryView } from './_category-view';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';

type Props = { params: Promise<{ slug: string }> };

async function fetchCategory(slug: string) {
  try {
    const res = await fetch(`${API_URL}/categories/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.category ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategory(slug);
  if (!category) return {};

  const name = category.name as string;
  const description = ((category.description ?? `Shop ${name} at LuxeMode — premium fashion curated for you.`) as string).slice(0, 160);
  const canonicalUrl = `${WEB_URL}/category/${slug}`;

  return {
    title: name,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${name} | LuxeMode`,
      description,
      url: canonicalUrl,
      type: 'website',
    },
    twitter: { card: 'summary', title: `${name} | LuxeMode`, description },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await fetchCategory(slug);

  let jsonLd: string | null = null;
  if (category) {
    jsonLd = JSON.stringify(
      breadcrumbSchema([
        { name: 'Home', url: WEB_URL },
        { name: 'Shop', url: `${WEB_URL}/shop` },
        { name: category.name as string, url: `${WEB_URL}/category/${slug}` },
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
      <CategoryView slug={slug} />
    </>
  );
}
