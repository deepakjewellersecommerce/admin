/**
 * Price Component API Service
 * Handles API calls for price components and formula validation
 */

import instance from "./instance";

// Types
export interface CalculationType {
  key: string;
  value: string;
  description: string;
}

export interface FormulaVariable {
  key: string;
  label: string;
  description: string;
  example: number;
}

export interface PriceComponent {
  _id: string;
  name: string;
  key: string;
  description?: string;
  calculationType: "PER_GRAM" | "PERCENTAGE" | "FIXED" | "FORMULA";
  defaultValue: number;
  formula?: string | null;
  formulaChips?: string[];
  percentageOf?: string;
  isSystemComponent: boolean;
  allowsFreeze: boolean;
  isActive: boolean;
  isVisible: boolean;
  isDeleted: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormulaValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  testResult?: number;
  parsedFormula?: string;
}

export interface ComponentCalculationResult {
  component: {
    id: string;
    key: string;
    name: string;
    calculationType: string;
  };
  context: {
    grossWeight: number;
    netWeight: number;
    metalRate: number;
    subtotal: number;
  };
  calculatedValue: number;
}

// API Functions

/**
 * Get all calculation types enum
 */
export const getCalculationTypes = async () => {
  const response = await instance.get("/admin/price-components/calculation-types");
  return response.data;
};

/**
 * Get formula variables
 */
export const getFormulaVariables = async () => {
  const response = await instance.get("/admin/price-components/formula-variables");
  return response.data;
};

/**
 * Get all price components
 */
export const getAllComponents = async (params?: {
  includeDeleted?: boolean;
  includeInactive?: boolean;
}) => {
  const response = await instance.get("/admin/price-components", { params });
  return response.data;
};

/**
 * Get system components only
 */
export const getSystemComponents = async () => {
  const response = await instance.get("/admin/price-components/system");
  return response.data;
};

/**
 * Get single component by ID or key
 */
export const getComponent = async (idOrKey: string) => {
  const response = await instance.get(`/admin/price-components/${idOrKey}`);
  return response.data;
};

/**
 * Create new price component
 */
export const createComponent = async (data: Partial<PriceComponent>) => {
  const response = await instance.post("/admin/price-components", data);
  return response.data;
};

/**
 * Update price component
 */
export const updateComponent = async (id: string, data: Partial<PriceComponent>) => {
  const response = await instance.put(`/admin/price-components/${id}`, data);
  return response.data;
};

/**
 * Delete price component
 */
export const deleteComponent = async (id: string, force?: boolean) => {
  const response = await instance.delete(`/admin/price-components/${id}`, {
    params: { force }
  });
  return response.data;
};

/**
 * Validate formula
 */
export const validateFormula = async (
  formula: string,
  testValues?: Record<string, number>
) => {
  const response = await instance.post("/admin/price-components/validate-formula", {
    formula,
    testValues
  });
  return response.data;
};

/**
 * Calculate component value (preview)
 */
export const calculateComponentValue = async (
  id: string,
  context: {
    grossWeight: number;
    netWeight: number;
    metalRate: number;
    subtotal?: number;
  }
) => {
  const response = await instance.post(`/admin/price-components/${id}/calculate`, context);
  return response.data;
};

/**
 * Reorder components
 */
export const reorderComponents = async (order: { id: string }[]) => {
  const response = await instance.put("/admin/price-components/reorder", { order });
  return response.data;
};

export default {
  getCalculationTypes,
  getFormulaVariables,
  getAllComponents,
  getSystemComponents,
  getComponent,
  createComponent,
  updateComponent,
  deleteComponent,
  validateFormula,
  calculateComponentValue,
  reorderComponents
};
