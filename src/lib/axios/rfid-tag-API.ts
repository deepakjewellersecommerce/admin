import instance from "./instance";

export interface RfidTag {
  _id: string;
  rfidCode: string;
  product: string;
  variant?: string;
  skuNo: string;
  serialNumber: number;
  status: "ACTIVE" | "SOLD" | "RETURNED" | "DEACTIVATED";
  productTitle: string;
  metalType: string;
  grossWeight: number;
  netWeight: number;
  calculatedPrice: number;
  variantSize?: string;
  createdAt: string;
}

export interface RfidSummary {
  total: number;
  active: number;
  sold: number;
  returned: number;
  deactivated: number;
}

export const rfidTagAPI = {
  generateTags: async (payload: {
    productId: string;
    variantId?: string;
    quantity: number;
  }) => {
    return instance.post("/admin/rfid-tags/generate", payload);
  },

  getTagsByProduct: async (
    productId: string,
    params?: {
      variantId?: string;
      status?: string;
      page?: number;
      limit?: number;
      search?: string;
    }
  ) => {
    return instance.get(`/admin/rfid-tags/${productId}`, { params });
  },

  downloadTagsCsv: async (
    productId: string,
    params?: { variantId?: string; status?: string }
  ) => {
    return instance.get(`/admin/rfid-tags/${productId}/download`, {
      params,
      responseType: "blob",
    });
  },

  getTagsSummary: async (productId: string) => {
    return instance.get(`/admin/rfid-tags/${productId}/summary`);
  },

  updateTagStatus: async (tagId: string, status: string) => {
    return instance.put(`/admin/rfid-tags/${tagId}/status`, { status });
  },
};
