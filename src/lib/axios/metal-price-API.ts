/**
 * Metal Price API Service
 * Handles all metal price related API calls
 */

import instance from "./instance";

// Types
export interface MetalType {
  key: string;
  value: string;
  displayName: string;
}

export interface MetalPrice {
  _id: string;
  metalType: string;
  pricePerGram: number;
  lastUpdated: string;
  source: string;
  updatedBy: string;
  affectedProductsCount?: number;
}

export interface PriceHistory {
  _id: string;
  metalType: string;
  pricePerGram: number;
  previousPrice?: number;
  changePercent?: number;
  source: string;
  updatedBy: string;
  reason?: string;
  createdAt: string;
}

export interface BulkRecalculationPreview {
  metalTypes: string[];
  affectedProducts: number;
  currentPrices: Record<string, number>;
  dryRun: boolean;
}

export interface BulkRecalculationResult {
  metalTypes: string[];
  success: number;
  failed: number;
  errors?: string[];
}

// API Functions

/**
 * Get all metal types enum
 */
export const getMetalTypes = async () => {
  const response = await instance.get("/metal-prices/types");
  return response.data;
};

/**
 * Get all current metal prices
 */
export const getAllMetalPrices = async () => {
  const response = await instance.get("/admin/metal-prices");
  return response.data;
};

/**
 * Get single metal price
 */
export const getMetalPrice = async (metalType: string) => {
  const response = await instance.get(`/admin/metal-prices/${metalType}`);
  return response.data;
};

/**
 * Update metal price manually
 */
export const updateMetalPrice = async (metalType: string, pricePerGram: number) => {
  const response = await instance.put(`/admin/metal-prices/${metalType}`, {
    pricePerGram
  });
  return response.data;
};

/**
 * Fetch price from API for single metal
 */
export const fetchMetalPrice = async (metalType: string) => {
  const response = await instance.post(`/admin/metal-prices/${metalType}/fetch`);
  return response.data;
};

/**
 * Bulk fetch all metal prices from API
 */
export const bulkFetchMetalPrices = async (metalTypes?: string[]) => {
  const response = await instance.post("/admin/metal-prices/bulk-fetch", {
    metalTypes
  });
  return response.data;
};

/**
 * Get price history for single metal
 */
export const getMetalPriceHistory = async (
  metalType: string,
  params?: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
    source?: string;
  }
) => {
  const response = await instance.get(`/admin/metal-prices/${metalType}/history`, {
    params
  });
  return response.data;
};

/**
 * Get all price history
 */
export const getAllPriceHistory = async (params?: {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  source?: string;
  metalTypes?: string;
}) => {
  const response = await instance.get("/admin/metal-prices/history", { params });
  return response.data;
};

/**
 * Get affected products for metal type
 */
export const getAffectedProducts = async (
  metalType: string,
  params?: { limit?: number; offset?: number }
) => {
  const response = await instance.get(
    `/admin/metal-prices/${metalType}/affected-products`,
    { params }
  );
  return response.data;
};

/**
 * Preview bulk recalculation
 */
export const previewBulkRecalculation = async (metalTypes: string[]) => {
  const response = await instance.post("/admin/metal-prices/bulk-recalculate/preview", {
    metalTypes
  });
  return response.data;
};

/**
 * Confirm bulk recalculation
 */
export const confirmBulkRecalculation = async (metalTypes: string[]) => {
  const response = await instance.post("/admin/metal-prices/bulk-recalculate/confirm", {
    metalTypes
  });
  return response.data;
};

/**
 * Initialize default metal prices (one-time setup)
 */
export const initializeMetalPrices = async () => {
  const response = await instance.post("/admin/metal-prices/initialize");
  return response.data;
};

export default {
  getMetalTypes,
  getAllMetalPrices,
  getMetalPrice,
  updateMetalPrice,
  fetchMetalPrice,
  bulkFetchMetalPrices,
  getMetalPriceHistory,
  getAllPriceHistory,
  getAffectedProducts,
  previewBulkRecalculation,
  confirmBulkRecalculation,
  initializeMetalPrices
};
