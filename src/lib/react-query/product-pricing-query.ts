/**
 * Product Pricing React Query Hooks
 * Provides hooks for product pricing management
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import productPricingAPI, { ProductPricingComponent } from "../axios/product-pricing-API";
import { toast } from "sonner";

/**
 * Hook to get pricing modes enum
 */
export const useGetPricingModes = () => {
  return useQuery({
    queryKey: ["productPricing", "modes"],
    queryFn: productPricingAPI.getPricingModes,
    staleTime: Infinity,
  });
};

/**
 * Hook to calculate and update product price
 */
export const useCalculateProductPrice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => productPricingAPI.calculateProductPrice(productId),
    onSuccess: (_, productId) => {
      toast.success("Price calculated successfully!");
      queryClient.invalidateQueries({ queryKey: ["products", productId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to calculate price");
    },
  });
};

/**
 * Hook to get price breakdown preview
 */
export const useGetPricePreview = () => {
  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data?: {
        grossWeight?: number;
        netWeight?: number;
        metalRate?: number;
        pricingConfig?: { components: ProductPricingComponent[] };
      };
    }) => productPricingAPI.getPricePreview(productId, data),
  });
};

/**
 * Hook to get pricing summary
 */
export const useGetPricingSummary = (productId: string) => {
  return useQuery({
    queryKey: ["productPricing", productId, "summary"],
    queryFn: () => productPricingAPI.getPricingSummary(productId),
    enabled: Boolean(productId),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to update pricing mode
 */
export const useUpdatePricingMode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: { pricingMode: string; staticPrice?: number };
    }) => productPricingAPI.updatePricingMode(productId, data),
    onSuccess: (_, variables) => {
      toast.success("Pricing mode updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["products", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["productPricing", variables.productId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update pricing mode");
    },
  });
};

/**
 * Hook to customize pricing (switch to CUSTOM_DYNAMIC)
 */
export const useCustomizePricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => productPricingAPI.customizePricing(productId),
    onSuccess: (_, productId) => {
      toast.success("Pricing customized! Product now has its own pricing config.");
      queryClient.invalidateQueries({ queryKey: ["products", productId] });
      queryClient.invalidateQueries({ queryKey: ["productPricing", productId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to customize pricing");
    },
  });
};

/**
 * Hook to revert to subcategory pricing
 */
export const useRevertToSubcategoryPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) =>
      productPricingAPI.revertToSubcategoryPricing(productId),
    onSuccess: (_, productId) => {
      toast.success("Reverted to subcategory pricing!");
      queryClient.invalidateQueries({ queryKey: ["products", productId] });
      queryClient.invalidateQueries({ queryKey: ["productPricing", productId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to revert pricing");
    },
  });
};

/**
 * Hook to update pricing config
 */
export const useUpdateProductPricingConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      components,
    }: {
      productId: string;
      components: ProductPricingComponent[];
    }) => productPricingAPI.updatePricingConfig(productId, components),
    onSuccess: (_, variables) => {
      toast.success("Pricing config updated!");
      queryClient.invalidateQueries({ queryKey: ["products", variables.productId] });
      queryClient.invalidateQueries({
        queryKey: ["productPricing", variables.productId],
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update pricing config");
    },
  });
};

/**
 * Hook to validate gemstones
 */
export const useValidateGemstones = () => {
  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: {
        gemstones: Array<{
          type: string;
          caratWeight: number;
          count: number;
          pricePerCarat: number;
        }>;
        grossWeight?: number;
      };
    }) => productPricingAPI.validateGemstones(productId, data),
  });
};

/**
 * Hook to freeze component (product-level)
 */
export const useFreezeProductComponent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      componentKey,
      reason,
    }: {
      productId: string;
      componentKey: string;
      reason?: string;
    }) => productPricingAPI.freezeComponent(productId, componentKey, reason),
    onSuccess: (_, variables) => {
      toast.success(`Component "${variables.componentKey}" frozen!`);
      queryClient.invalidateQueries({ queryKey: ["products", variables.productId] });
      queryClient.invalidateQueries({
        queryKey: ["productPricing", variables.productId],
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to freeze component");
    },
  });
};

/**
 * Hook to unfreeze component (product-level)
 */
export const useUnfreezeProductComponent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      componentKey,
    }: {
      productId: string;
      componentKey: string;
    }) => productPricingAPI.unfreezeComponent(productId, componentKey),
    onSuccess: (_, variables) => {
      toast.success(`Component "${variables.componentKey}" unfrozen!`);
      queryClient.invalidateQueries({ queryKey: ["products", variables.productId] });
      queryClient.invalidateQueries({
        queryKey: ["productPricing", variables.productId],
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to unfreeze component");
    },
  });
};

/**
 * Hook to bulk recalculate prices
 */
export const useBulkRecalculatePrices = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (metalType: string) => productPricingAPI.bulkRecalculatePrices(metalType),
    onSuccess: (response: any) => {
      const data = response.data || response;
      toast.success(
        `Bulk recalculation complete! ${data.success || 0} products updated, ${data.failed || 0} failed.`
      );
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Bulk recalculation failed");
    },
  });
};

/**
 * Hook to get products by subcategory with pricing info
 */
export const useGetProductsBySubcategory = (
  subcategoryId: string,
  params?: { limit?: number; offset?: number; pricingMode?: string }
) => {
  return useQuery({
    queryKey: ["products", "bySubcategory", subcategoryId, params],
    queryFn: () => productPricingAPI.getProductsBySubcategory(subcategoryId, params),
    enabled: Boolean(subcategoryId),
    staleTime: 5 * 60 * 1000,
  });
};
