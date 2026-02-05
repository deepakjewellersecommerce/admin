/**
 * Price Component React Query Hooks
 * Provides hooks for price component management
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import priceComponentAPI, { PriceComponent } from "../axios/price-component-API";
import { toast } from "sonner";

/**
 * Hook to get all calculation types
 */
export const useGetCalculationTypes = () => {
  return useQuery({
    queryKey: ["priceComponents", "calculationTypes"],
    queryFn: priceComponentAPI.getCalculationTypes,
    staleTime: Infinity,
  });
};

/**
 * Hook to get all price components
 */
export const useGetAllComponents = (params?: {
  includeDeleted?: boolean;
  includeInactive?: boolean;
}) => {
  return useQuery({
    queryKey: ["priceComponents", "all", params],
    queryFn: () => priceComponentAPI.getAllComponents(params),
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Hook to get system components only
 */
export const useGetSystemComponents = () => {
  return useQuery({
    queryKey: ["priceComponents", "system"],
    queryFn: priceComponentAPI.getSystemComponents,
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Hook to get single component
 */
export const useGetComponent = (idOrKey: string) => {
  return useQuery({
    queryKey: ["priceComponents", idOrKey],
    queryFn: () => priceComponentAPI.getComponent(idOrKey),
    enabled: Boolean(idOrKey),
  });
};

/**
 * Hook to create price component
 */
export const useCreateComponent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PriceComponent>) => priceComponentAPI.createComponent(data),
    onSuccess: () => {
      toast.success("Price component created successfully!");
      queryClient.invalidateQueries({ queryKey: ["priceComponents"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create component");
    },
  });
};

/**
 * Hook to update price component
 */
export const useUpdateComponent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PriceComponent> }) =>
      priceComponentAPI.updateComponent(id, data),
    onSuccess: () => {
      toast.success("Price component updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["priceComponents"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update component");
    },
  });
};

/**
 * Hook to delete price component
 */
export const useDeleteComponent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) =>
      priceComponentAPI.deleteComponent(id, force),
    onSuccess: () => {
      toast.success("Price component deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["priceComponents"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete component");
    },
  });
};

/**
 * Hook to calculate component value
 */
export const useCalculateComponentValue = () => {
  return useMutation({
    mutationFn: ({
      id,
      context,
    }: {
      id: string;
      context: {
        grossWeight: number;
        netWeight: number;
        metalRate: number;
        subtotal?: number;
      };
    }) => priceComponentAPI.calculateComponentValue(id, context),
  });
};

/**
 * Hook to reorder components
 */
export const useReorderComponents = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: { id: string }[]) => priceComponentAPI.reorderComponents(order),
    onSuccess: () => {
      toast.success("Components reordered successfully!");
      queryClient.invalidateQueries({ queryKey: ["priceComponents"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to reorder components");
    },
  });
};
