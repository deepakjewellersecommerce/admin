import { useQuery } from "@tanstack/react-query";
import metalPriceAPI from "@/lib/axios/metal-price-API";

export const useGetAllMetalPriceHistory = (params?: {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  metalTypes?: string;
}) => {
  return useQuery({
    queryKey: ["metal-price-history", "all", params],
    queryFn: () => metalPriceAPI.getAllPriceHistory(params),
    staleTime: 2 * 60 * 1000,
  });
};

export const useGetMetalPriceHistory = (
  metalType: string,
  params?: { limit?: number; offset?: number; startDate?: string; endDate?: string }
) => {
  return useQuery({
    queryKey: ["metal-price-history", metalType, params],
    queryFn: () => metalPriceAPI.getMetalPriceHistory(metalType, params),
    enabled: Boolean(metalType),
    staleTime: 2 * 60 * 1000,
  });
};
