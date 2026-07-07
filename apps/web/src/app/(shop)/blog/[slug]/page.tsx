import type { Metadata } from 'next';
import { articleSchema, breadcrumbSchema } from '@/lib/jsonld';
import { BlogView } from './_blog-view';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';

type Props = { params: Promise<{ slug: string }> };

async function fetchPost(slug: string) {
  try {
    const res = await fetch(`${API_URL}/blog/posts/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.post ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) return {};

  const title = (post.metaTitle ?? post.title) as string;
  const description = ((post.metaDesc ?? post.excerpt ?? '') as string).slice(0, 160);
  const image = post.coverImage as string | null;
  const canonicalUrl = `${WEB_URL}/blog/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'article',
      publishedTime: post.publishedAt ?? undefined,
      authors: [post.author?.name ?? 'LuxeMode'],
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

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await fetchPost(slug);

  let jsonLd: string | null = null;
  if (post) {
    const articleUrl = `${WEB_URL}/blog/${slug}`;
    const breadcrumbs = [
      { name: 'Home', url: WEB_URL },
      { name: 'Blog', url: `${WEB_URL}/blog` },
      ...(post.category
        ? [{ name: post.category.name as string, url: `${WEB_URL}/blog?category=${post.category.slug}` }]
        : []),
      { name: post.title as string, url: articleUrl },
    ];
    jsonLd = JSON.stringify([
      articleSchema(post, articleUrl, WEB_URL),
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
      <BlogView slug={slug} />
    </>
  );
}
