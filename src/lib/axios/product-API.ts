import instance from './instance';

// Product API service object
export const productAPI = {
  getProducts: async (filter:any) => {
    return instance.get('/product/all', {
      params: {
        page: filter.pageIndex + 1,
        limit: filter.pageSize || undefined,
        search: filter.search || undefined,
        // Use subcategoryId when available (deepest filter), else categoryId
        subcategoryId: filter.subcategoryId || undefined,
        categoryId: !filter.subcategoryId && filter.categoryId ? filter.categoryId : undefined,
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
  getProductVariants: async (id:string, filter: any = {}) => {
    return instance.get(`/product-variant/${id}/all`, {
      params: {
        stockStatus:
          filter.stockStatus && filter.stockStatus !== 'all'
            ? filter.stockStatus
            : undefined,
      },
    });
  },
  addProductVariant: async (payload:any) => {
    const formData = new FormData();
    formData.append('productId', payload.productId);
    formData.append('size', payload.size);
    formData.append('price', String(payload.price));
    formData.append('salePrice', String(payload.salePrice ?? 0));
    formData.append('stock', String(payload.stock));
    if (payload.color) formData.append('color', payload.color);
    if (payload.weight != null) formData.append('weight', String(payload.weight));
    if (payload.isActive !== undefined) formData.append('isActive', String(payload.isActive));
    if (payload.gemstones && payload.gemstones.length > 0) {
      formData.append('gemstones', JSON.stringify(payload.gemstones));
    }
    if (payload.images && payload.images.length > 0) {
      for (const file of payload.images) {
        formData.append('images', file);
      }
    }
    return instance.post('/product-variant/add', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateProductVariant: async (payload:any) => {
    const formData = new FormData();
    formData.append('productId', payload.productId);
    formData.append('size', payload.size);
    formData.append('price', String(payload.price));
    formData.append('salePrice', String(payload.salePrice ?? 0));
    formData.append('stock', String(payload.stock));
    if (payload.color) formData.append('color', payload.color);
    if (payload.weight != null) formData.append('weight', String(payload.weight));
    if (payload.isActive !== undefined) formData.append('isActive', String(payload.isActive));
    if (payload.gemstones) {
      formData.append('gemstones', JSON.stringify(payload.gemstones));
    }
    // Keep existing Cloudinary URLs (filter out base64 previews)
    const existingUrls = (payload.imageUrls || []).filter((url: string) => !url.startsWith('data:'));
    if (existingUrls.length > 0) {
      formData.append('imageUrls', JSON.stringify(existingUrls));
    }
    if (payload.images && payload.images.length > 0) {
      for (const file of payload.images) {
        formData.append('images', file);
      }
    }
    return instance.put(`/product-variant/update/${payload?._id??""}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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
  addProduct: async (payload: unknown) => {
    if (payload instanceof FormData) {
      return instance.post('/admin/product/add', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return instance.post('/admin/product/add', payload);
  },
  addCategory: async (payload:unknown) => {
    return instance.post(`/product/category/add`, payload);
  },
  updateProduct: async (payload:any) => {
    if (payload instanceof FormData) {
      return instance.put(`/admin/product/${payload.get("_id")}/edit`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
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
  deleteCategory: async (categoryId: string) => {
    return instance.delete(`/product/category/${categoryId}/delete`);
  },
  getLowStockProducts: async (threshold = 5) => {
    // Use the inventory admin endpoint for low-stock data (admin UI)
    return instance.get('/admin/inventory/low-stock', { params: { threshold } });
  },
  updateProductPricing: async (productId: string) => {
    // Use admin product pricing update endpoint (PUT)
    return instance.put(`/admin/product/${productId}/update-pricing`);
  },
  bulkUpdatePricing: async () => {
    return instance.post('/admin/product/bulk-update-pricing');
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
