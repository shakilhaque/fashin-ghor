export type JsonLd = Record<string, unknown>;

export function organizationSchema(siteUrl: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Fashion Ghor',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: 'Discover premium fashion with Fashion Ghor — your destination for curated style.',
    sameAs: [],
  };
}

export function productSchema(
  product: {
    name: string;
    description?: string | null;
    price: number;
    comparePrice?: number | null;
    stock?: number;
    images?: { url: string; altText?: string | null }[];
    brand?: { name: string } | null;
  },
  productUrl: string,
): JsonLd {
  const inStock = (product.stock ?? 1) > 0;
  const thirtyDaysOut = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    ...(product.description ? { description: product.description } : {}),
    image: product.images?.map((i) => i.url) ?? [],
    ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand.name } } : {}),
    offers: {
      '@type': 'Offer',
      url: productUrl,
      price: product.price.toFixed(2),
      priceCurrency: 'BDT',
      priceValidUntil: thirtyDaysOut,
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };
}

export function articleSchema(
  post: {
    title: string;
    excerpt?: string | null;
    coverImage?: string | null;
    publishedAt?: string | null;
    author: { name: string };
  },
  articleUrl: string,
  siteUrl: string,
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    ...(post.excerpt ? { description: post.excerpt } : {}),
    ...(post.coverImage ? { image: post.coverImage } : {}),
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    author: { '@type': 'Person', name: post.author.name },
    publisher: {
      '@type': 'Organization',
      name: 'Fashion Ghor',
      logo: { '@type': 'ImageObject', url: `${siteUrl}/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
