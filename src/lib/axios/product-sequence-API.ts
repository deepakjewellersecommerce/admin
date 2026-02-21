/**
 * Product Sequence API Service
 * Handles SKU generation and product sequence management
 */

import instance from "./instance";

// Types
export interface SkuPreviewResponse {
  subcategoryId: string;
  boxNumber: number;
  categoryCode: string;
  nextProductNumber: number;
  skuPreview: string;
}

export interface SubcategorySequence {
  boxNumber: number;
  nextProductNumber: number;
  categoryCode: string;
  lastAssignedAt?: string;
}

export interface SubcategorySequencesResponse {
  subcategoryId: string;
  sequences: SubcategorySequence[];
}

// API Functions

/**
 * Get the next SKU preview for a given subcategory and box
 * Returns the SKU preview without incrementing the counter
 */
export const getNextSKU = async (
  subcategoryId: string,
  boxNumber: number
): Promise<SkuPreviewResponse> => {
  const response = await instance.get("/api/product-sequence/next-sku", {
    params: {
      subcategoryId,
      boxNumber,
    },
  });
  return response.data.data;
};

/**
 * Get all product sequences for a subcategory
 * Shows the state of all boxes for a given subcategory
 */
export const getSubcategorySequences = async (
  subcategoryId: string
): Promise<SubcategorySequencesResponse> => {
  const response = await instance.get(
    `/api/product-sequence/${subcategoryId}`
  );
  return response.data.data;
};

/**
 * Increment the product sequence counter (internal use)
 * Called after successful product creation
 */
export const incrementSequence = async (
  subcategoryId: string,
  boxNumber: number,
  categoryCode: string
): Promise<{ message: string; nextProductNumber: number }> => {
  const response = await instance.post("/api/product-sequence/increment", {
    subcategoryId,
    boxNumber,
    categoryCode,
  });
  return response.data.data;
};

export default {
  getNextSKU,
  getSubcategorySequences,
  incrementSequence,
};
