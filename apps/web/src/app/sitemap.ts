import type { MetadataRoute } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';

// Safely fetch — returns fallback if the API is unreachable (build-time safety)
async function safeFetch<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

interface ApiEnvelope<T> {
  data: T;
}

function flattenCategories(cats: Array<{ slug: string; updatedAt?: string; children?: unknown[] }>): Array<{ slug: string; updatedAt?: string }> {
  const out: Array<{ slug: string; updatedAt?: string }> = [];
  for (const c of cats) {
    out.push(c);
    if (Array.isArray(c.children) && c.children.length) {
      out.push(...flattenCategories(c.children as typeof cats));
    }
  }
  return out;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  const [products, categories, posts, brands] = await Promise.all([
    safeFetch<ApiEnvelope<{ products: Array<{ slug: string; updatedAt?: string }> }>>(
      `${API_URL}/products?limit=500`,
      { data: { products: [] } },
    ),
    safeFetch<ApiEnvelope<{ categories: Array<{ slug: string; updatedAt?: string; children?: unknown[] }> }>>(
      `${API_URL}/categories`,
      { data: { categories: [] } },
    ),
    safeFetch<ApiEnvelope<{ posts: Array<{ slug: string; updatedAt?: string }> }>>(
      `${API_URL}/blog?limit=500&status=PUBLISHED`,
      { data: { posts: [] } },
    ),
    safeFetch<ApiEnvelope<{ brands: Array<{ slug: string; updatedAt?: string }> }>>(
      `${API_URL}/brands`,
      { data: { brands: [] } },
    ),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: WEB_URL,                 lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${WEB_URL}/shop`,       lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${WEB_URL}/blog`,       lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${WEB_URL}/brand`,      lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
  ];

  const productRoutes: MetadataRoute.Sitemap = (products.data.products).map((p) => ({
    url: `${WEB_URL}/product/${p.slug}`,
    lastModified: p.updatedAt ?? now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = flattenCategories(categories.data.categories).map((c) => ({
    url: `${WEB_URL}/category/${c.slug}`,
    lastModified: c.updatedAt ?? now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const postRoutes: MetadataRoute.Sitemap = (posts.data.posts).map((p) => ({
    url: `${WEB_URL}/blog/${p.slug}`,
    lastModified: p.updatedAt ?? now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const brandRoutes: MetadataRoute.Sitemap = (brands.data.brands).map((b) => ({
    url: `${WEB_URL}/brand/${b.slug}`,
    lastModified: b.updatedAt ?? now,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...postRoutes, ...brandRoutes];
}
