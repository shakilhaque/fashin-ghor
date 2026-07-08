export type MediaType = 'IMAGE' | 'VIDEO';

export interface StorySlide {
  id: string;
  storyId: string;
  mediaUrl: string;
  mediaType: MediaType;
  duration: number;
  caption: string | null;
  productId: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: { url: string }[];
  } | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Story {
  id: string;
  title: string;
  coverImage: string;
  subtitle: string | null;
  isActive: boolean;
  position: number;
  scheduledAt: string | null;
  expiresAt: string | null;
  viewCount: number;
  slides: StorySlide[];
  productId: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: { url: string }[];
  } | null;
  createdAt: string;
  updatedAt: string;
}
