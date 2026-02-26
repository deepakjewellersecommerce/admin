import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productAPI } from "../axios/product-API";
import { toast } from "sonner";

export const useGetLowStockProducts = (threshold?: number) => {
  return useQuery({
    queryKey: ["lowStockProducts", threshold],
    queryFn: () => productAPI.getLowStockProducts(threshold),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateProductPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productAPI.updateProductPricing,
    onSuccess: () => {
      toast.success("Product pricing updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update product pricing");
    },
  });
};

export const useBulkUpdatePricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productAPI.bulkUpdatePricing,
    onSuccess: (data) => {
      const updatedCount = (data as any)?.data?.updatedCount || 0;
      toast.success(`Successfully updated pricing for ${updatedCount} products!`);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update product pricing");
    },
  });
};

export const useGetProducts = (filter: unknown) => {
  return useQuery({
    queryKey: ["products", filter],
    queryFn: () => productAPI.getProducts(filter),
    staleTime: 15 * 60 * 1000,
  });
};

export const useGetProduct = (id: string) => {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => productAPI.getProduct(id),
    enabled: Boolean(id),
    staleTime: 15 * 60 * 1000,
  });
};
export const useUploadProducts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productAPI.uploadProducts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Successfully Uploaded!");
    },
    onError: (error: Error) => {
      toast.error(error.message ?? "Error uploading products");
    },
  });
};

export const useAddProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      // Force immediate console output
      console.clear();
      console.log('%c🚀 Add Product Mutation Start', 'background: #2563eb; color: white; padding: 2px 4px; border-radius: 4px;');
      console.log('%cPayload:', 'font-weight: bold', JSON.stringify(data, null, 2));
      
      try {
        const response = await productAPI.addProduct(data);
        // Log successful response
        console.log('%c✅ API Response Success', 'background: #059669; color: white; padding: 2px 4px; border-radius: 4px;');
        console.log('Response data:', response?.data);
        console.log('Response status:', response?.status);
        console.log('Response headers:', response?.headers);
        return response;
      } catch (error: any) {
        // Enhanced error logging
        console.group('Error Information');
        console.log('Message:', error.message);
        console.log('Response data:', error.response?.data);
        console.log('Status:', error.response?.status);
        console.log('Headers:', error.response?.headers);
        console.log('Request config:', error.config);
        console.groupEnd();
        
        throw error;
      }
    },
    onMutate: (variables) => {
      // Log mutation start with timestamp
      const startTime = new Date().toISOString();
      console.log(`%c⏱️ Mutation started at: ${startTime}`, 'color: #2563eb');
      console.log('Variables:', variables);
      
      // Show loading toast with spinner
      const loadingId = toast.loading('Adding Product', { duration: 0 });
      
      return { loadingId, startTime };
    },
  onSuccess: (response, _variables, context: any) => {
      // Calculate duration
      const endTime = new Date();
      const duration = context.startTime ? 
        (endTime.getTime() - new Date(context.startTime).getTime()) / 1000 : 
        0;
      
      console.log(`%c✨ Mutation succeeded in ${duration.toFixed(2)}s`, 'color: #059669');
      console.log('Final response:', response);
      
      // Clean up loading toast and show success
      toast.dismiss(context.loadingId);
      toast.success(
        <div className="flex flex-col gap-1">
          <strong>Product added successfully!</strong>
          <span className="text-sm text-gray-500">Completed in {duration.toFixed(2)}s</span>
        </div>
      );
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  onError: (error: any, _variables, context: any) => {
      console.log('%c💥 Mutation Error Handler', 'background: #dc2626; color: white; padding: 2px 4px; border-radius: 4px;');
      
      // Clean up loading toast
      if (context?.loadingId) {
        toast.dismiss(context.loadingId);
      }
      
      // Detailed error logging
      let errorMessage = "Failed to add product. ";
      let errorDetails = "";
      
      if (error.response) {
        console.group('API Error Response');
        console.log('Status:', error.response.status);
        console.log('Headers:', error.response.headers);
        console.log('Data:', error.response.data);
        console.groupEnd();
        
        errorMessage += error.response.data?.message || 
                       error.response.data?.error?.message || 
                       error.response.data?.error || 
                       error.message;
        errorDetails = `Status: ${error.response.status}`;
      } else if (error.request) {
        console.group('Network Error');
        console.log('Request:', error.request);
        console.groupEnd();
        
        errorMessage += "No response received from server. Please check your connection.";
        errorDetails = "Network Error";
      } else {
        console.group('Unknown Error');
        console.log('Error:', error);
        console.groupEnd();
        
        errorMessage += error.message;
        errorDetails = "Unknown Error";
      }
      
      // Show error toast with details
      toast.error(
        <div className="flex flex-col gap-1">
          <strong>{errorMessage}</strong>
          <span className="text-sm text-gray-500">{errorDetails}</span>
        </div>,
        { duration: 5000 }  // Show for 5 seconds
      );
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productAPI.updateProduct,
    onSuccess: () => {
      // Invalidate all product-related queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      toast.success("Successfully Updated!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data.error.message ?? "Error updating product"
      );
    },
  });
};

export const useAddCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productAPI.addCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Successfully Added!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data.error.message ?? "Error adding category"
      );
    },
  });
};

export const useGetProductVariants = (id: string) => {
  return useQuery({
    queryKey: ["productVariants", id],
    queryFn: () => productAPI.getProductVariants(id),
    enabled: Boolean(id),
    staleTime: 15 * 60 * 1000,
  });
};

export const useAddProductVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productAPI.addProductVariant,
    onSuccess: () => {
      toast.success("Successfully Added!");
      queryClient.invalidateQueries({
        queryKey: ["productVariants"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data.message ??
          error.response?.data.error.message ??
          "Error adding product variant"
      );
    },
  });
};

export const useAddVariantBulk = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productAPI.addVariantBulk,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productVariants"] });
      toast.success("Successfully Added!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data.error.message ?? "Error adding product variant"
      );
    },
  });
};

export const useUpdateProductVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productAPI.updateProductVariant,
    onSuccess: () => {
      toast.success("Successfully Updated!");
      queryClient.invalidateQueries({
        queryKey: ["productVariants"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data.error.message ??
          error.response?.data.error ??
          "Error updating product variant"
      );
    },
  });
};

export const useDeleteProductVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productAPI.deleteProductVariant,
    onSuccess: () => {
      toast.success("Successfully Deleted!");
      queryClient.invalidateQueries({
        queryKey: ["productVariants"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data.error.message ??
          error.response?.data.error ??
          "Error deleting product variant"
      );
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => productAPI.deleteProduct(productId),
    onSuccess: () => {
      toast.success("Product deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete product");
    },
  });
};

export const useGetVariant = (id: string | undefined) => {
  return useQuery({
    queryKey: ["productVariants", id],
    queryFn: () => productAPI.getVariant(id ?? ""),
    enabled: Boolean(id),
    staleTime: 15 * 60 * 1000,
  });
};

export const useUpsertProductImages = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productAPI.upsertProductImages,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productImages"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      toast.success("Successfully Added!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data.error.message ?? "Error adding product images"
      );
    },
  });
};



export const useGetProductImages = (productId: string, colorId: string) => {
  return useQuery({
    queryKey: ["productImages", productId, colorId],
    queryFn: () => productAPI.getProductImages(productId, colorId),
    enabled: Boolean(productId && colorId),
    staleTime: 15 * 60 * 1000,
  });
};

/**
 * Hook to get all products with dynamic pricing enabled
 */
// Dynamic pricing hook removed - not applicable for this catalog

/**
 * Hook to update inventory levels for a product
 */
export const useUpdateProductStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ inventoryId, stockCount }: { inventoryId: string, stockCount: number }) => 
      productAPI.updateProductStock(inventoryId, stockCount),
    onSuccess: () => {
      toast.success("Product stock updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      // Invalidate product detail and low stock caches
      queryClient.invalidateQueries({ queryKey: ["product"] });
      queryClient.invalidateQueries({ queryKey: ["lowStockProducts"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update product stock");
    },
  });
};
