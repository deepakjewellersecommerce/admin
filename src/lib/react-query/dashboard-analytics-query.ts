
import { useQuery } from "@tanstack/react-query";
import { dashboardAnalyticsAPI } from "../axios/dashboard-analytics-API";

export const useDashboardKPIs = () => {
  return useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: async () => {
      const response = await dashboardAnalyticsAPI.getDashboardKPIs();
      return response.data?.data; // Unwraps { status, data: { data: kpis } } -> { data: kpis }
    },
    staleTime: 60 * 5,
  });
};

export const usePendingOrdersDetails = (hours: number) => {
  return useQuery({
    queryKey: ["pending-orders-details", hours],
    queryFn: async () => {
      const response = await dashboardAnalyticsAPI.getPendingOrdersDetails(hours);
      return response.data?.data;
    },
    staleTime: 60 * 5,
  });
};

export const useStockOutOrdersDetails = () => {
  return useQuery({
    queryKey: ["stock-out-orders-details"],
    queryFn: async () => {
      const response = await dashboardAnalyticsAPI.getStockOutOrdersDetails();
      return response.data?.data;
    },
    staleTime: 60 * 5,
  });
};

export const usePricingErrorsDetails = () => {
  return useQuery({
    queryKey: ["pricing-errors-details"],
    queryFn: async () => {
      const response = await dashboardAnalyticsAPI.getPricingErrorsDetails();
      return response.data?.data;
    },
    staleTime: 60 * 5,
  });
};

export const useRevenueByMetal = (params?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ["revenue-by-metal", params],
    queryFn: async () => {
      const response = await dashboardAnalyticsAPI.getRevenueByMetal(params);
      return response.data?.data;
    },
    staleTime: 60 * 2,
  });
};

export const usePerformanceByItem = (params?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ["performance-by-item", params],
    queryFn: async () => {
      const response = await dashboardAnalyticsAPI.getPerformanceByItem(params);
      return response.data?.data;
    },
    staleTime: 60 * 5,
  });
};

export const useDiscountEfficiency = (params?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ["discount-efficiency", params],
    queryFn: async () => {
      const response = await dashboardAnalyticsAPI.getDiscountEfficiency(params);
      return response.data?.data;
    },
    staleTime: 60 * 5,
  });
};

export const useInventoryHealth = () => {
  return useQuery({
    queryKey: ["inventory-health"],
    queryFn: async () => {
      const response = await dashboardAnalyticsAPI.getInventoryHealth();
      return response.data?.data;
    },
    staleTime: 60 * 10,
  });
};

export const useOrderFunnel = (params?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ["order-funnel", params],
    queryFn: async () => {
      const response = await dashboardAnalyticsAPI.getOrderFunnel(params);
      return response.data?.data;
    },
    staleTime: 60 * 5,
  });
};
