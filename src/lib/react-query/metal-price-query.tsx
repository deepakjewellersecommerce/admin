/**
 * Metal Price React Query Hooks
 * Provides hooks for metal price management with caching and invalidation
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import metalPriceAPI from "../axios/metal-price-API";
import { toast } from "sonner";

/**
 * Hook to fetch all metal types
 */
export const useGetMetalTypes = () => {
  return useQuery({
    queryKey: ["metalPrices", "types"],
    queryFn: metalPriceAPI.getMetalTypes,
    staleTime: Infinity, // Types don't change
  });
};

/**
 * Hook to fetch all current metal prices
 */
export const useGetAllMetalPrices = () => {
  return useQuery({
    queryKey: ["metalPrices", "all"],
    queryFn: metalPriceAPI.getAllMetalPrices,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch single metal price
 */
export const useGetMetalPrice = (metalType: string) => {
  return useQuery({
    queryKey: ["metalPrices", metalType],
    queryFn: () => metalPriceAPI.getMetalPrice(metalType),
    enabled: Boolean(metalType),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to update metal price manually
 */
export const useUpdateMetalPrice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ metalType, pricePerGram }: { metalType: string; pricePerGram: number }) =>
      metalPriceAPI.updateMetalPrice(metalType, pricePerGram),
    onSuccess: (_, variables) => {
      toast.success(`${variables.metalType} price updated successfully!`);
      queryClient.invalidateQueries({ queryKey: ["metalPrices"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update metal price");
    },
  });
};

/**
 * Hook to fetch metal price from API
 */
export const useFetchMetalPrice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (metalType: string) => metalPriceAPI.fetchMetalPrice(metalType),
    onSuccess: (_, metalType) => {
      toast.success(`${metalType} price fetched from API!`);
      queryClient.invalidateQueries({ queryKey: ["metalPrices"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to fetch price from API");
    },
  });
};

/**
 * Hook to bulk fetch all metal prices from API
 */
export const useBulkFetchMetalPrices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (metalTypes?: string[]) => metalPriceAPI.bulkFetchMetalPrices(metalTypes),
    onSuccess: () => {
      toast.success("All metal prices fetched from API!");
      queryClient.invalidateQueries({ queryKey: ["metalPrices"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to fetch prices from API");
    },
  });
};

/**
 * Hook to get metal price history for single metal
 */
export const useGetMetalPriceHistory = (
  metalType: string,
  params?: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
    source?: string;
  }
) => {
  return useQuery({
    queryKey: ["metalPrices", metalType, "history", params],
    queryFn: () => metalPriceAPI.getMetalPriceHistory(metalType, params),
    enabled: Boolean(metalType),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Hook to get all price history
 */
export const useGetAllPriceHistory = (params?: {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  source?: string;
  metalTypes?: string;
}) => {
  return useQuery({
    queryKey: ["metalPrices", "history", params],
    queryFn: () => metalPriceAPI.getAllPriceHistory(params),
    staleTime: 30 * 60 * 1000,
  });
};

/**
 * Hook to get affected products for metal type
 */
export const useGetAffectedProducts = (
  metalType: string,
  params?: { limit?: number; offset?: number }
) => {
  return useQuery({
    queryKey: ["metalPrices", metalType, "affectedProducts", params],
    queryFn: () => metalPriceAPI.getAffectedProducts(metalType, params),
    enabled: Boolean(metalType),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to preview bulk recalculation
 */
export const usePreviewBulkRecalculation = () => {
  return useMutation({
    mutationFn: (metalTypes: string[]) => metalPriceAPI.previewBulkRecalculation(metalTypes),
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to generate preview");
    },
  });
};

/**
 * Hook to confirm bulk recalculation
 */
export const useConfirmBulkRecalculation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (metalTypes: string[]) => metalPriceAPI.confirmBulkRecalculation(metalTypes),
    onSuccess: (response: any) => {
      const data = response.data || response;
      toast.success(`Bulk recalculation complete! ${data.success || 0} products updated.`);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["metalPrices"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Bulk recalculation failed");
    },
  });
};

/**
 * Hook to initialize metal prices (one-time setup)
 */
export const useInitializeMetalPrices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: metalPriceAPI.initializeMetalPrices,
    onSuccess: () => {
      toast.success("Metal prices initialized successfully!");
      queryClient.invalidateQueries({ queryKey: ["metalPrices"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to initialize prices");
    },
  });
};
