import { describe, it, expect } from 'vitest';
import { organizationSchema, productSchema, articleSchema, breadcrumbSchema } from './jsonld';

const SITE_URL = 'https://luxemode.com';

describe('organizationSchema', () => {
  it('sets required schema.org fields', () => {
    const schema = organizationSchema(SITE_URL);
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('Organization');
    expect(schema.name).toBe('LuxeMode');
    expect(schema.url).toBe(SITE_URL);
  });

  it('includes logo URL derived from siteUrl', () => {
    const schema = organizationSchema(SITE_URL);
    expect(schema.logo).toBe(`${SITE_URL}/logo.png`);
  });
});

describe('productSchema', () => {
  const product = {
    name: 'Classic Shirt',
    price: 49.99,
    stock: 10,
    images: [{ url: 'https://cdn.test/shirt.jpg', altText: 'A shirt' }],
    brand: { name: 'LuxeBrand' },
  };
  const url = `${SITE_URL}/product/classic-shirt`;

  it('sets required schema.org fields', () => {
    const schema = productSchema(product, url);
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('Product');
    expect(schema.name).toBe('Classic Shirt');
  });

  it('sets offers with BDT currency', () => {
    const schema = productSchema(product, url);
    const offers = schema.offers as Record<string, unknown>;
    expect(offers['@type']).toBe('Offer');
    expect(offers.priceCurrency).toBe('BDT');
    expect(offers.price).toBe('49.99');
    expect(offers.url).toBe(url);
  });

  it('marks in-stock products with InStock availability', () => {
    const schema = productSchema({ ...product, stock: 5 }, url);
    const offers = schema.offers as Record<string, unknown>;
    expect(offers.availability).toBe('https://schema.org/InStock');
  });

  it('marks zero-stock products as OutOfStock', () => {
    const schema = productSchema({ ...product, stock: 0 }, url);
    const offers = schema.offers as Record<string, unknown>;
    expect(offers.availability).toBe('https://schema.org/OutOfStock');
  });

  it('defaults to InStock when stock is not provided', () => {
    const { stock: _s, ...noStock } = product;
    const schema = productSchema(noStock, url);
    const offers = schema.offers as Record<string, unknown>;
    expect(offers.availability).toBe('https://schema.org/InStock');
  });

  it('includes brand when provided', () => {
    const schema = productSchema(product, url);
    const brand = schema.brand as Record<string, unknown>;
    expect(brand['@type']).toBe('Brand');
    expect(brand.name).toBe('LuxeBrand');
  });

  it('omits brand when not provided', () => {
    const { brand: _b, ...noBrand } = product;
    const schema = productSchema(noBrand, url);
    expect(schema.brand).toBeUndefined();
  });

  it('maps image URLs from the images array', () => {
    const schema = productSchema(product, url);
    expect(schema.image).toEqual(['https://cdn.test/shirt.jpg']);
  });

  it('uses empty array when no images provided', () => {
    const schema = productSchema({ name: 'Shirt', price: 10 }, url);
    expect(schema.image).toEqual([]);
  });

  it('includes priceValidUntil set ~30 days in the future', () => {
    const schema = productSchema(product, url);
    const offers = schema.offers as Record<string, unknown>;
    const validUntil = new Date(offers.priceValidUntil as string);
    const now = new Date();
    const diffDays = (validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThan(28);
    expect(diffDays).toBeLessThan(32);
  });
});

describe('articleSchema', () => {
  const post = {
    title: 'How to Style a Shirt',
    excerpt: 'Tips on styling.',
    coverImage: 'https://cdn.test/cover.jpg',
    publishedAt: '2024-06-01T00:00:00Z',
    author: { name: 'Jane Doe' },
  };
  const url = `${SITE_URL}/blog/how-to-style-a-shirt`;

  it('sets required schema.org fields', () => {
    const schema = articleSchema(post, url, SITE_URL);
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('Article');
    expect(schema.headline).toBe(post.title);
  });

  it('sets author as Person', () => {
    const schema = articleSchema(post, url, SITE_URL);
    const author = schema.author as Record<string, unknown>;
    expect(author['@type']).toBe('Person');
    expect(author.name).toBe('Jane Doe');
  });

  it('sets publisher as Organization with logo', () => {
    const schema = articleSchema(post, url, SITE_URL);
    const publisher = schema.publisher as Record<string, unknown>;
    expect(publisher['@type']).toBe('Organization');
    expect(publisher.name).toBe('LuxeMode');
    const logo = publisher.logo as Record<string, unknown>;
    expect(logo['@type']).toBe('ImageObject');
    expect(logo.url).toBe(`${SITE_URL}/logo.png`);
  });

  it('includes description when excerpt is provided', () => {
    const schema = articleSchema(post, url, SITE_URL);
    expect(schema.description).toBe('Tips on styling.');
  });

  it('omits description when no excerpt', () => {
    const { excerpt: _e, ...noExcerpt } = post;
    const schema = articleSchema(noExcerpt, url, SITE_URL);
    expect(schema.description).toBeUndefined();
  });

  it('includes coverImage as image', () => {
    const schema = articleSchema(post, url, SITE_URL);
    expect(schema.image).toBe('https://cdn.test/cover.jpg');
  });

  it('omits image when no coverImage', () => {
    const { coverImage: _c, ...noCover } = post;
    const schema = articleSchema(noCover, url, SITE_URL);
    expect(schema.image).toBeUndefined();
  });

  it('includes datePublished when publishedAt is provided', () => {
    const schema = articleSchema(post, url, SITE_URL);
    expect(schema.datePublished).toBe('2024-06-01T00:00:00Z');
  });

  it('sets mainEntityOfPage to the article URL', () => {
    const schema = articleSchema(post, url, SITE_URL);
    const main = schema.mainEntityOfPage as Record<string, unknown>;
    expect(main['@id']).toBe(url);
  });
});

describe('breadcrumbSchema', () => {
  const items = [
    { name: 'Home', url: SITE_URL },
    { name: 'Shop', url: `${SITE_URL}/shop` },
    { name: 'Classic Shirt', url: `${SITE_URL}/product/classic-shirt` },
  ];

  it('sets BreadcrumbList type', () => {
    const schema = breadcrumbSchema(items);
    expect(schema['@type']).toBe('BreadcrumbList');
  });

  it('creates correct number of list items', () => {
    const schema = breadcrumbSchema(items);
    const list = schema.itemListElement as unknown[];
    expect(list).toHaveLength(3);
  });

  it('sets 1-based position on each item', () => {
    const schema = breadcrumbSchema(items);
    const list = schema.itemListElement as Array<Record<string, unknown>>;
    expect(list[0].position).toBe(1);
    expect(list[1].position).toBe(2);
    expect(list[2].position).toBe(3);
  });

  it('sets name and item URL on each ListItem', () => {
    const schema = breadcrumbSchema(items);
    const list = schema.itemListElement as Array<Record<string, unknown>>;
    expect(list[0].name).toBe('Home');
    expect(list[0].item).toBe(SITE_URL);
    expect(list[2].name).toBe('Classic Shirt');
  });

  it('handles empty array', () => {
    const schema = breadcrumbSchema([]);
    const list = schema.itemListElement as unknown[];
    expect(list).toHaveLength(0);
  });

  it('handles single breadcrumb', () => {
    const schema = breadcrumbSchema([{ name: 'Home', url: SITE_URL }]);
    const list = schema.itemListElement as Array<Record<string, unknown>>;
    expect(list[0].position).toBe(1);
  });
});
