interface ProductVariant {
  size: string;
  price: number;
  salePrice?: number;
  stock: number;
  color: string;
  image: string;
}

interface Product {
  _id?: string;
  productTitle: string;
  productSlug: string;
  skuNo: string;

  // Category hierarchy
  categoryId?: { _id: string; name: string; description?: string; displayImage?: string } | string;
  subcategoryId?: string;
  materialId?: string;
  genderId?: string;
  itemId?: string;
  categoryHierarchyPath?: string;

  // Metal / weights
  metalType?: string;
  grossWeight?: number;
  netWeight?: number;

  // Pricing (new jewelry system)
  pricingMode?: "SUBCATEGORY_DYNAMIC" | "CUSTOM_DYNAMIC" | "STATIC_PRICE";
  staticPrice?: number;
  calculatedPrice?: number;
  salePrice?: number;
  regularPrice?: number;

  // Detailed price breakdown (populated by calculatePrice())
  priceBreakdown?: {
    components: Array<{
      componentKey: string;
      componentName: string;
      value: number;
      isFrozen?: boolean;
      isVisible?: boolean;
    }>;
    metalType?: string;
    metalRate?: number;
    metalCost?: number;
    gemstoneCost?: number;
    subtotal?: number;
    totalPrice?: number;
    lastCalculated?: string;
  };

  // Gemstones
  gemstones?: Array<{
    name: string;
    customName?: string;
    weight: number;
    pricePerCarat: number;
    totalCost?: number;
  }>;

  // Status
  isActive: boolean;
  isFeatured?: boolean;

  // Content
  productDescription?: string;
  careHandling?: string;

  // Images
  productImageUrl?: string[];
  images?: any[];

  // SEO
  seoTitle?: string;
  seoDescription?: string;

  // GST (legacy / static products)
  gst?: number;

  // Legacy fields (kept for backwards-compat with old product records)
  brand?: string;
  varients?: ProductVariant[];
  ingredients?: string;
  benefits?: string;
  shlok?: { shlokText?: string; shlokMeaning?: string };
  amazonLink?: string;
}

export default Product;
