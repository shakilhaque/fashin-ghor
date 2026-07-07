export interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string;
    price: number;
    stock: number;
  };
  variant: {
    id: string;
    color: string | null;
    size: string | null;
    sku: string;
  } | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Cart {
  id: string | null;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode: string | null;
}
