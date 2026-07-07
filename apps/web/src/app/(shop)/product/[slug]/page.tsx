import type { Metadata } from 'next';
import { productSchema, breadcrumbSchema } from '@/lib/jsonld';
import { ProductView } from './_product-view';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';

type Props = { params: Promise<{ slug: string }> };

async function fetchProduct(slug: string) {
  try {
    const res = await fetch(`${API_URL}/products/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.product ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  if (!product) return {};

  const title = product.name as string;
  const description = ((product.description as string | null) ?? '').slice(0, 160);
  const image = (product.images as { url: string }[])?.[0]?.url;
  const canonicalUrl = `${WEB_URL}/product/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      images: image ? [{ url: image, alt: title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  let jsonLd: string | null = null;
  if (product) {
    const productUrl = `${WEB_URL}/product/${slug}`;
    const breadcrumbs = [
      { name: 'Home', url: WEB_URL },
      { name: 'Shop', url: `${WEB_URL}/shop` },
      ...(product.category
        ? [{ name: product.category.name as string, url: `${WEB_URL}/category/${product.category.slug}` }]
        : []),
      { name: product.name as string, url: productUrl },
    ];
    jsonLd = JSON.stringify([
      productSchema(product, productUrl),
      breadcrumbSchema(breadcrumbs),
    ]);
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      )}
      <ProductView slug={slug} />
    </>
  );
}
