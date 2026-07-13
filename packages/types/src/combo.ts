export interface ComboItemProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  images: { id: string; url: string; altText: string | null }[];
}

export interface ComboItem {
  id: string;
  productId: string;
  product: ComboItemProduct;
  quantity: number;
}

export interface Combo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  comparePrice: number | null;
  discount: number;
  isActive: boolean;
  items: ComboItem[];
  createdAt: string;
}
