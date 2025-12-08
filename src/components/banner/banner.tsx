// banner.ts
export interface Banner {
  _id: string;
  bannerImages: string[];
  title: string;
  content: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}
