interface ProductVariant {
  size: string;
  price: number;
  salePrice?: number;
  stock: number;
  color: string;
  image: string;
}

interface Product {
  brand?: string;
  productTitle: string;
  productSlug: string;
  skuNo: string;
  categoryId?: { _id: string; name: string; description?: string; displayImage?: string } | string;
  regularPrice: number;
  salePrice: number;
  images?: any[];
  isActive: boolean;
  productDescription: string;
  _id?: string;
  varients?: ProductVariant[];
  gst?: number;
  productImageUrl?: string[];
  isFeatured?: boolean;
  ingredients?: string;
  benefits?: string;
  shlok?: {
    shlokText?: string;
    shlokMeaning?: string;
  };
  amazonLink?: string;
}

export default Product;
