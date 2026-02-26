interface ProductVariant {
  productId: string;
  _id: string;
  size: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  isActive?: boolean;
  imageUrls: string[];
  color?: { _id: string; color_name: string; hexcode: string } | string;
  weight?: number;
}

export default ProductVariant;
