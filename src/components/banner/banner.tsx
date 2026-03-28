// banner.ts
export interface Banner {
  _id: string;
  bannerImages: string[];
  title: string;
  content: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
