/**
 * Category Hierarchy API Service
 * Handles API calls for Materials, Genders, Items, Categories, and Subcategories
 */

import instance from "./instance";

// Types
export interface Material {
  _id: string;
  name: string;
  slug: string;
  idAttribute: string;
  metalType: string;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Gender {
  _id: string;
  name: string;
  slug: string;
  idAttribute: string;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  _id: string;
  name: string;
  slug: string;
  idAttribute: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  idAttribute: string;
  fullCategoryId: string;
  materialId: Material | string;
  genderId: Gender | string;
  itemId: Item | string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subcategory {
  _id: string;
  name: string;
  slug: string;
  idAttribute: string;
  fullCategoryId: string;
  categoryId: Category | string;
  parentSubcategoryId?: Subcategory | string | null;
  materialId: Material | string;
  genderId?: Gender | string;
  itemId?: Item | string;
  level: number;
  depth: number;
  ancestorPath: string[];
  hasPricingConfig: boolean;
  pricingConfigId?: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
  children?: Subcategory[];
}

export interface SubcategoryFlat extends Omit<Subcategory, 'categoryId' | 'materialId' | 'genderId' | 'itemId' | 'parentSubcategoryId'> {
  displayLabel: string;
  categoryId: string;
  materialId: string;
  genderId: string;
  itemId: string;
  parentSubcategoryId?: string | null;
}

export interface SubcategoryPricing {
  _id: string;
  subcategoryId: string;
  components: PricingComponent[];
  lastUpdatedBy: string;
  affectedProductsCount: number;
  freezeHistory: FreezeHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface PricingComponent {
  componentKey: string;
  componentName: string;
  calculationType: string;
  value: number;
  formula?: string;
  formulaChips?: string[];
  percentageOf?: string;
  isFrozen: boolean;
  frozenValue?: number | null;
  frozenAt?: string | null;
  metalRateAtFreeze?: number | null;
  freezeReason?: string | null;
  frozenBy?: string | null;
  originalCalculationType?: string | null;
  originalValue?: number | null;
  originalFormula?: string | null;
  // UI flags (optional)
  isVisible?: boolean;
  isActive?: boolean;
}

export interface FreezeHistoryEntry {
  componentKey: string;
  action: "freeze" | "unfreeze";
  frozenValue?: number;
  metalRateAtFreeze?: number;
  reason?: string;
  timestamp: string;
  adminId?: string;
  adminName?: string;
}

export interface HierarchyTree {
  materials: Material[];
  genders: Gender[];
  items: Item[];
  categories: Category[];
}

// ==================== MATERIALS ====================

export const getAllMaterials = async (params?: { includeInactive?: boolean }) => {
  const response = await instance.get("/admin/categories/materials", { params });
  return response.data;
};

export const getMaterial = async (id: string) => {
  const response = await instance.get(`/admin/categories/materials/${id}`);
  return response.data;
};

export const createMaterial = async (data: Partial<Material>) => {
  const response = await instance.post("/admin/categories/materials", data);
  return response.data;
};

export const updateMaterial = async (id: string, data: Partial<Material>) => {
  const response = await instance.put(`/admin/categories/materials/${id}`, data);
  return response.data;
};

// ==================== GENDERS ====================

export const getAllGenders = async (params?: { includeInactive?: boolean }) => {
  const response = await instance.get("/admin/categories/genders", { params });
  return response.data;
};

export const getGender = async (id: string) => {
  const response = await instance.get(`/admin/categories/genders/${id}`);
  return response.data;
};

export const createGender = async (data: Partial<Gender>) => {
  const response = await instance.post("/admin/categories/genders", data);
  return response.data;
};

export const updateGender = async (id: string, data: Partial<Gender>) => {
  const response = await instance.put(`/admin/categories/genders/${id}`, data);
  return response.data;
};

// ==================== ITEMS ====================

export const getAllItems = async (params?: { includeInactive?: boolean }) => {
  const response = await instance.get("/admin/categories/items", { params });
  return response.data;
};

export const getItem = async (id: string) => {
  const response = await instance.get(`/admin/categories/items/${id}`);
  return response.data;
};

export const createItem = async (data: Partial<Item>) => {
  const response = await instance.post("/admin/categories/items", data);
  return response.data;
};

export const updateItem = async (id: string, data: Partial<Item>) => {
  const response = await instance.put(`/admin/categories/items/${id}`, data);
  return response.data;
};

// ==================== CATEGORIES ====================

export const getAllCategories = async (params?: {
  materialId?: string;
  genderId?: string;
  itemId?: string;
  includeInactive?: boolean;
}) => {
  const response = await instance.get("/admin/categories/categories", { params });
  return response.data;
};

export const getCategory = async (id: string) => {
  const response = await instance.get(`/admin/categories/categories/${id}`);
  return response.data;
};

export const createCategory = async (data: Partial<Category>) => {
  const response = await instance.post("/admin/categories/categories", data);
  return response.data;
};

export const updateCategory = async (id: string, data: Partial<Category>) => {
  const response = await instance.put(`/admin/categories/categories/${id}`, data);
  return response.data;
};
export const deleteCategory = async (id: string) => {
  const response = await instance.delete(`/admin/product/category/${id}/delete`);
  return response.data;
};
export const getCategoryImpact = async (id: string) => {
  const response = await instance.get(`/admin/categories/categories/${id}/impact`);
  return response.data;
};

// ==================== HIERARCHY HELPERS ====================

export const getFullHierarchy = async () => {
  const response = await instance.get("/admin/categories/hierarchy");
  return response.data;
};

export const getCascadeOptions = async (params?: {
  materialId?: string;
  genderId?: string;
  itemId?: string;
}) => {
  const response = await instance.get("/admin/categories/cascade", { params });
  return response.data;
};

export const quickCreate = async (level: number | string, data: Record<string, unknown>) => {
  const response = await instance.post("/admin/categories/quick-create", {
    level,
    data
  });
  return response.data;
};

// ==================== SUBCATEGORIES ====================

export const getAllSubcategories = async (params?: {
  categoryId?: string;
  materialId?: string;
  parentSubcategoryId?: string | null;
  hasPricingConfig?: boolean;
  includeInactive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}) => {
  const response = await instance.get("/admin/subcategories", { params });
  return response.data;
};

export const getSubcategory = async (id: string) => {
  const response = await instance.get(`/admin/subcategories/${id}`);
  return response.data;
};

export const createSubcategory = async (data: Partial<Subcategory> & {
  configurePricing?: boolean;
  pricingConfig?: { components: PricingComponent[] };
}) => {
  const response = await instance.post("/admin/subcategories", data);
  return response.data;
};

export const updateSubcategory = async (id: string, data: Partial<Subcategory>) => {
  const response = await instance.put(`/admin/subcategories/${id}`, data);
  return response.data;
};

export const getSubcategoryImpact = async (id: string) => {
  const response = await instance.get(`/admin/subcategories/${id}/impact`);
  return response.data;
};

export const deleteSubcategory = async (id: string, force?: boolean) => {
  const response = await instance.delete(`/admin/subcategories/${id}`, {
    params: { force }
  });
  return response.data;
};

export const getSubcategoryTree = async (categoryId: string) => {
  const response = await instance.get(`/admin/subcategories/tree/${categoryId}`);
  return response.data;
};

export const searchSubcategories = async (q: string, params?: {
  categoryId?: string;
  limit?: number;
}) => {
  const response = await instance.get("/admin/subcategories/search", {
    params: { q, ...params }
  });
  return response.data;
};

export const checkSubcategoryAvailability = async (params: { categoryId: string; parentSubcategoryId?: string | null; idAttribute: string }) => {
  // Clean params: omit parentSubcategoryId when null/undefined or the string 'null'
  const cleanParams: Record<string, any> = {
    categoryId: params.categoryId,
    idAttribute: params.idAttribute,
  };
  if (params.parentSubcategoryId && params.parentSubcategoryId !== "null") {
    cleanParams.parentSubcategoryId = params.parentSubcategoryId;
  }

  // Debugging: log the exact params used for the request
  if (import.meta.env.DEV) {
    console.debug("checkSubcategoryAvailability: outgoing params=", cleanParams);
  }

  const response = await instance.get("/admin/subcategories/check-availability", {
    params: cleanParams,
  });
  return response.data;
};

export const getSubcategoryAncestors = async (id: string) => {
  const response = await instance.get(`/admin/subcategories/${id}/ancestors`);
  return response.data;
};

export const getSubcategoryDescendants = async (id: string) => {
  const response = await instance.get(`/admin/subcategories/${id}/descendants`);
  return response.data;
};

// ==================== SUBCATEGORY PRICING ====================

export const getSubcategoryPricing = async (id: string) => {
  const response = await instance.get(`/admin/subcategories/${id}/pricing`);
  return response.data;
};

export const updateSubcategoryPricing = async (
  id: string,
  components: PricingComponent[]
) => {
  const response = await instance.put(`/admin/subcategories/${id}/pricing`, {
    components
  });
  return response.data;
};

export const createDefaultSubcategoryPricing = async (id: string) => {
  const response = await instance.post(`/admin/subcategories/${id}/pricing/default`);
  return response.data;
};

export const removeSubcategoryPricing = async (id: string) => {
  const response = await instance.delete(`/admin/subcategories/${id}/pricing`);
  return response.data;
};

export const previewSubcategoryPricingChanges = async (
  id: string,
  components: PricingComponent[]
) => {
  const response = await instance.post(`/admin/subcategories/${id}/pricing/preview`, {
    components
  });
  return response.data;
};

export const getSubcategoryFreezeHistory = async (id: string) => {
  const response = await instance.get(`/admin/subcategories/${id}/pricing/freeze-history`);
  return response.data;
};

export const freezeSubcategoryComponent = async (
  id: string,
  componentKey: string,
  reason: string
) => {
  const response = await instance.patch(
    `/admin/subcategories/${id}/pricing/components/${componentKey}/freeze`,
    { reason }
  );
  return response.data;
};

export const unfreezeSubcategoryComponent = async (id: string, componentKey: string) => {
  const response = await instance.patch(
    `/admin/subcategories/${id}/pricing/components/${componentKey}/unfreeze`
  );
  return response.data;
};

export const getSubcategoryAffectedProducts = async (
  id: string,
  params?: { limit?: number; offset?: number }
) => {
  const response = await instance.get(`/admin/subcategories/${id}/affected-products`, {
    params
  });
  return response.data;
};

export default {
  // Materials
  getAllMaterials,
  getMaterial,
  createMaterial,
  updateMaterial,
  // Genders
  getAllGenders,
  getGender,
  createGender,
  updateGender,
  // Items
  getAllItems,
  getItem,
  createItem,
  updateItem,
  // Categories
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryImpact,
  // Hierarchy
  getFullHierarchy,
  getCascadeOptions,
  quickCreate,
  // Subcategories
  getAllSubcategories,
  getSubcategory,
  createSubcategory,
  updateSubcategory,
  getSubcategoryImpact,
  deleteSubcategory,
  checkSubcategoryAvailability,
  getSubcategoryTree,
  searchSubcategories,
  getSubcategoryAncestors,
  getSubcategoryDescendants,
  // Subcategory Pricing
  getSubcategoryPricing,
  updateSubcategoryPricing,
  createDefaultSubcategoryPricing,
  removeSubcategoryPricing,
  previewSubcategoryPricingChanges,
  getSubcategoryFreezeHistory,
  freezeSubcategoryComponent,
  unfreezeSubcategoryComponent,
  getSubcategoryAffectedProducts
};
