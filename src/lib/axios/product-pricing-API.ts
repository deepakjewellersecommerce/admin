/**
 * Product Pricing API Service
 * Handles API calls for product pricing management
 */

import instance from "./instance";

// Types
export interface PricingMode {
  key: string;
  value: string;
  description: string;
}

export interface ProductPricingComponent {
  componentId?: string;
  componentKey: string;
  componentName: string;
  calculationType: "PER_GRAM" | "PERCENTAGE" | "FIXED";
  value: number;
  percentageOf?: "metalCost" | "subtotal";
  metalPriceMode?: "AUTO" | "MANUAL";
  manualMetalPrice?: number | null;
  isFrozen: boolean;
  frozenValue?: number | null;
  frozenAt?: string | null;
  metalRateAtFreeze?: number | null;
  freezeReason?: string | null;
  frozenBy?: string | null;
  originalCalculationType?: string | null;
  originalValue?: number | null;
}

export interface ProductPricingConfig {
  components: ProductPricingComponent[];
}

export interface PriceBreakdownItem {
  key: string;
  name: string;
  value: number;
  isFrozen: boolean;
  calculationType: string;
}

export interface PriceBreakdown {
  metalCost: number;
  components: PriceBreakdownItem[];
  subtotal: number;
  total: number;
}

export interface ProductPricingSummary {
  product: {
    id: string;
    productTitle: string;
    skuNo: string;
    metalType: string;
    grossWeight: number;
    netWeight: number;
    pricingMode: string;
    staticPrice?: number;
    calculatedPrice: number;
    allComponentsFrozen: boolean;
  };
  pricing: {
    mode: string;
    source: string;
    sourceSubcategory: { id: string; name: string } | null;
    allComponentsFrozen: boolean;
  };
  metalRate: {
    metalType: string;
    pricePerGram: number;
    lastUpdated: string;
  };
  pricingConfig: { components: ProductPricingComponent[] } | null;
  breakdown: PriceBreakdown | null;
  calculatedPrice: number;
}

export interface BulkRecalculateResult {
  metalType: string;
  success: number;
  failed: number;
  errors?: string[];
}

// API Functions

/**
 * Get pricing modes enum
 */
export const getPricingModes = async () => {
  const response = await instance.get("/admin/products/pricing-modes");
  return response.data;
};

/**
 * Calculate and update product price
 */
export const calculateProductPrice = async (productId: string) => {
  const response = await instance.post(`/admin/products/${productId}/calculate-price`);
  return response.data;
};

/**
 * Get price breakdown preview
 */
export const getPricePreview = async (
  productId: string,
  data?: {
    grossWeight?: number;
    netWeight?: number;
    metalRate?: number;
    pricingConfig?: ProductPricingConfig;
  }
) => {
  const response = await instance.post(`/admin/products/${productId}/price-preview`, data);
  return response.data;
};

/**
 * Get pricing summary
 */
export const getPricingSummary = async (productId: string) => {
  const response = await instance.get(`/admin/products/${productId}/pricing-summary`);
  return response.data;
};

/**
 * Update pricing mode
 */
export const updatePricingMode = async (
  productId: string,
  data: {
    pricingMode: string;
    staticPrice?: number;
  }
) => {
  const response = await instance.put(`/admin/products/${productId}/pricing-mode`, data);
  return response.data;
};

/**
 * Customize pricing (switch to CUSTOM_DYNAMIC)
 */
export const customizePricing = async (productId: string) => {
  const response = await instance.post(`/admin/products/${productId}/customize-pricing`);
  return response.data;
};

/**
 * Revert to subcategory pricing
 */
export const revertToSubcategoryPricing = async (productId: string) => {
  const response = await instance.post(`/admin/products/${productId}/revert-pricing`);
  return response.data;
};

/**
 * Update pricing config (for CUSTOM_DYNAMIC)
 */
export const updatePricingConfig = async (
  productId: string,
  components: ProductPricingComponent[]
) => {
  const response = await instance.put(`/admin/products/${productId}/pricing-config`, {
    components
  });
  return response.data;
};

/**
 * Validate gemstones
 */
export const validateGemstones = async (
  productId: string,
  data: {
    gemstones: Array<{
      type: string;
      caratWeight: number;
      count: number;
      pricePerCarat: number;
    }>;
    grossWeight?: number;
  }
) => {
  const response = await instance.post(
    `/admin/products/${productId}/validate-gemstones`,
    data
  );
  return response.data;
};

/**
 * Freeze component (product-level)
 */
export const freezeComponent = async (
  productId: string,
  componentKey: string,
  reason?: string
) => {
  const response = await instance.patch(
    `/admin/products/${productId}/pricing/components/${componentKey}/freeze`,
    { reason }
  );
  return response.data;
};

/**
 * Unfreeze component (product-level)
 */
export const unfreezeComponent = async (productId: string, componentKey: string) => {
  const response = await instance.patch(
    `/admin/products/${productId}/pricing/components/${componentKey}/unfreeze`
  );
  return response.data;
};

/**
 * Bulk recalculate prices
 */
export const bulkRecalculatePrices = async (metalType: string) => {
  const response = await instance.post("/admin/products/bulk-recalculate", {
    metalType
  });
  return response.data;
};

/**
 * Get products by subcategory with pricing info
 */
export const getProductsBySubcategory = async (
  subcategoryId: string,
  params?: {
    limit?: number;
    offset?: number;
    pricingMode?: string;
  }
) => {
  const response = await instance.get(
    `/admin/products/by-subcategory/${subcategoryId}`,
    { params }
  );
  return response.data;
};

export default {
  getPricingModes,
  calculateProductPrice,
  getPricePreview,
  getPricingSummary,
  updatePricingMode,
  customizePricing,
  revertToSubcategoryPricing,
  updatePricingConfig,
  validateGemstones,
  freezeComponent,
  unfreezeComponent,
  bulkRecalculatePrices,
  getProductsBySubcategory
};
