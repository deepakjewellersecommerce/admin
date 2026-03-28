// blog.ts
export interface Blog {
  _id: string;
  blogId: string;
  title: string;
  content: string;
  status: "DRAFT" | "PUBLISHED";
  displayImage: { url: string }[];
  createdAt: Date;
  updatedAt: Date;
}
