import { useQuery } from "@tanstack/react-query";
import { getNextSKU, getSubcategorySequences } from "../axios/product-sequence-API";

/**
 * Hook to fetch the next SKU preview for a given subcategory and box
 */
export const useGetNextSKU = (
  subcategoryId: string,
  boxNumber: number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["nextSKU", subcategoryId, boxNumber],
    queryFn: () => getNextSKU(subcategoryId, boxNumber),
    enabled: enabled && Boolean(subcategoryId) && boxNumber > 0,
    staleTime: 0, // Always fetch fresh data
  });
};

/**
 * Hook to fetch all product sequences for a subcategory
 */
export const useGetSubcategorySequences = (subcategoryId: string) => {
  return useQuery({
    queryKey: ["subcategorySequences", subcategoryId],
    queryFn: () => getSubcategorySequences(subcategoryId),
    enabled: Boolean(subcategoryId),
  });
};
