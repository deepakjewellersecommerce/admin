import instance from './instance';

// Product API service object
export const productAPI = {
  getProducts: async (filter:any) => {
    return instance.get('/product/all',{
      params: {
        page:filter.pageIndex+1,
        search:filter.search,
        // Add filter for jewelry categories if needed
        category: filter.category,
      }
    });
  },
  getProduct: async (id:string) => {
    return instance.get(`/product/${id}`);
  },
  upsertProductImages: async (payload:any) => {
    // If payload is FormData (contains files), send multipart/form-data and let backend handle upload
    try {
      if (payload instanceof FormData) {
        return await instance.put(`/product/image/${payload.get("productId")}/${payload.get("color")}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
    } catch (err) {
      // fall through to default JSON PUT
    }
    return instance.put(`/product/image/${payload.productId}/${payload.color}`, payload);
  },
  getProductImages: async (productId : string, colorId : string) => {
    return instance.get(`/product/image/${productId}/${colorId}`);
   } ,

  getCategories: async () => {
    return instance.get('/product/category/all');
  },
  uploadProducts: async (payload:unknown) => {
    return instance.post('/admin/product/bulk', payload);
  },
  getProductVariants: async (id:string) => {
    return instance.get(`/product-variant/${id}/all`);
  },
  addProductVariant: async (payload:unknown) => {
    return instance.post('/product-variant/add', payload);
  },
  updateProductVariant: async (payload:any) => {
    return instance.put(`/product-variant/update/${payload?._id??""}`, payload);
  },
  deleteProductVariant: async (id:string) => {
    return instance.delete(`/product-variant/delete/${id}`);
  },
  getVariant: async (id:string) => {
    return instance.get(`/product-variant/${id}`);
  },
  addVariantBulk: async (payload:unknown) => {
    return instance.post('/admin/product/bulk/variant', payload);
  },
  addProduct: async (payload:unknown) => {
    try {
      console.log("Attempting to add product with payload:", payload instanceof FormData ? "<FormData>" : JSON.stringify(payload, null, 2));

      // If payload is FormData (files included), send directly to admin endpoint
      if (payload instanceof FormData) {
        const response = await instance.post('/admin/product/add', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response;
      }

      // For admin UI, use admin endpoint first for JSON payloads
      try {
        const adminResponse = await instance.post('/admin/product/add', payload);
        console.log("Product added successfully via admin endpoint:", adminResponse);
        return adminResponse;
      } catch (adminError: any) {
        console.log("Admin endpoint failed:", adminError.message);
        // If admin endpoint fails with 404, fallback to public endpoint
        if (adminError.response && adminError.response.status !== 404) {
          throw adminError;
        }
        try {
          const response = await instance.post('/product', payload);
          console.log("Product added successfully via /product:", response);
          return response;
        } catch (productError: any) {
          console.error("Public product endpoint failed:", productError.message);
          throw productError;
        }
      }
    } catch (error: any) {
      console.error("Product add failed completely:", error);
      throw error;
    }
  },
  addCategory: async (payload:unknown) => {
    return instance.post(`/product/category/add`, payload);
  },
  updateProduct: async (payload:any) => {
    return instance.put(`/admin/product/${payload._id}/edit`, payload);
  },
  deleteProduct: async (id: string) => {
    return instance.delete(`/admin/product/${id}/delete`);
  },
  updateCategory: async (payload:any) => {
    console.log("updateCategory called with payload:", payload);
    return instance.put(`/product/category/${payload._id}`, payload);
  },
  updateCategoryWithFormData: async (formData: FormData, categoryId: string) => {
    console.log("updateCategoryWithFormData called with categoryId:", categoryId);
    console.log("FormData contents:");
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }
    return instance.put(`/product/category/${categoryId}`, formData);
  },
  getWalletBalance: () => instance.get('/user/wallet'),
  getLowStockProducts: async (threshold = 5) => {
    // Use the inventory admin endpoint for low-stock data (admin UI)
    return instance.get('/admin/inventory/low-stock', { params: { threshold } });
  },
  updateProductPricing: async (productId: string) => {
    // Use admin product pricing update endpoint (PUT)
    return instance.put(`/admin/product/${productId}/update-pricing`);
  },
  bulkUpdatePricing: async () => {
    // Removed bulk update pricing endpoint (not used for skin care products)
    return Promise.resolve({ data: { message: 'Not implemented' } });
  },
  // Dynamic pricing endpoints removed
  /**
   * Updates inventory levels for a product
   * @param productId The product ID
   * @param stockCount New stock count
   * @returns Promise with updated product data
   */
  updateProductStock: async (inventoryId: string, stockCount: number) => {
    // Inventory update endpoint expects an inventoryId
    return instance.put(`/admin/inventory/${inventoryId}/stock`, { stock: stockCount });
  },
};
