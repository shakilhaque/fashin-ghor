import { describe, it, expect } from 'vitest';
import { cn, formatPrice, slugify, truncate } from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('resolves tailwind conflicts (last wins)', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles undefined/null gracefully', () => {
    expect(cn('a', undefined, null, 'b')).toBe('a b');
  });
});

describe('formatPrice', () => {
  it('formats BDT with taka symbol', () => {
    expect(formatPrice(1000)).toMatch(/৳/);
  });

  it('formats BDT: 0 returns ৳0', () => {
    expect(formatPrice(0)).toBe('৳0');
  });

  it('formats BDT with thousands separator', () => {
    const result = formatPrice(10000);
    expect(result).toMatch(/৳/);
    expect(result).toMatch(/10/);
  });

  it('formats USD with dollar symbol', () => {
    const result = formatPrice(49.99, 'USD');
    expect(result).toMatch(/\$49\.99/);
  });

  it('formats EUR correctly', () => {
    const result = formatPrice(100, 'EUR');
    expect(result).toMatch(/100/);
  });

  it('handles fractional amounts in BDT', () => {
    const result = formatPrice(49.99);
    expect(result).toMatch(/৳/);
    expect(result).toMatch(/49/);
  });
});

describe('slugify', () => {
  it('lowercases text', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('replaces spaces with hyphens', () => {
    expect(slugify('Classic Cotton Shirt')).toBe('classic-cotton-shirt');
  });

  it('removes special characters', () => {
    expect(slugify("Men's T-Shirt & Polo!")).toBe('mens-t-shirt-polo');
  });

  it('collapses multiple spaces', () => {
    expect(slugify('foo   bar')).toBe('foo-bar');
  });

  it('strips leading and trailing hyphens', () => {
    expect(slugify('  hello  ')).toBe('hello');
  });

  it('handles already-valid slug', () => {
    expect(slugify('cool-product')).toBe('cool-product');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });
});

describe('truncate', () => {
  it('returns text unchanged when within limit', () => {
    expect(truncate('Short text', 20)).toBe('Short text');
  });

  it('truncates text exceeding maxLength with ellipsis', () => {
    const result = truncate('This is a long description', 10);
    expect(result).toBe('This is a ...');
    expect(result.length).toBe(13);
  });

  it('returns text unchanged at exact maxLength', () => {
    expect(truncate('exact', 5)).toBe('exact');
  });

  it('handles empty string', () => {
    expect(truncate('', 10)).toBe('');
  });

  it('handles maxLength of 0', () => {
    expect(truncate('hello', 0)).toBe('...');
  });
});
