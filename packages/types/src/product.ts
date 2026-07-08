export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  children?: Category[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  country: string | null;
  website: string | null;
  isActive: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  position: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  color: string | null;
  size: string | null;
  stock: number;
  price: number | null;
  imageUrl: string | null;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  brand: Brand | null;
  category: Category | null;
  gender: string | null;
  season: string | null;
  material: string | null;
  tags: string[];
  price: number;
  comparePrice: number | null;
  discount: number;
  vat: number;
  stock: number;
  images: ProductImage[];
  variants: ProductVariant[];
  isFeatured: boolean;
  isActive: boolean;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
}

export interface ProductListQuery {
  page?: number;
  limit?: number;
  search?: string;
  categorySlug?: string;
  brandSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price' | 'createdAt' | 'name' | 'rating';
  sortOrder?: 'asc' | 'desc';
  gender?: string;
  isFeatured?: boolean;
  isOnSale?: boolean;
}
