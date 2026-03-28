
import { useQuery, useMutation } from "@tanstack/react-query";
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

export const useTopProducts = (params?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ["top-products", params],
    queryFn: async () => {
      const response = await dashboardAnalyticsAPI.getTopProducts(params);
      return response.data?.data;
    },
    staleTime: 60 * 5,
  });
};

export const useTopCategories = (params?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ["top-categories", params],
    queryFn: async () => {
      const response = await dashboardAnalyticsAPI.getTopCategories(params);
      return response.data?.data;
    },
    staleTime: 60 * 5,
  });
};

export const useTopUsers = (params?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ["top-users", params],
    queryFn: async () => {
      const response = await dashboardAnalyticsAPI.getTopUsers(params);
      return response.data?.data;
    },
    staleTime: 60 * 5,
  });
};

export const useTopLocations = (params?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ["top-locations", params],
    queryFn: async () => {
      const response = await dashboardAnalyticsAPI.getTopLocations(params);
      return response.data?.data;
    },
    staleTime: 60 * 5,
  });
};

export const useRevenueTrends = (params?: { startDate?: string; endDate?: string; groupBy?: string }) => {
  return useQuery({
    queryKey: ["revenue-trends", params],
    queryFn: async () => {
      const response = await dashboardAnalyticsAPI.getRevenueTrends(params);
      return response.data?.data;
    },
    staleTime: 60 * 5,
  });
};

export const useRepeatPurchaseRate = (params?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ["repeat-purchase-rate", params],
    queryFn: async () => {
      const response = await dashboardAnalyticsAPI.getRepeatPurchaseRate(params);
      return response.data?.data;
    },
    staleTime: 60 * 5,
  });
};

export const useStockTurnover = (params?: { materialId?: string; genderId?: string; itemId?: string; categoryId?: string }) => {
  return useQuery({
    queryKey: ["stock-turnover", params],
    queryFn: async () => {
      const response = await dashboardAnalyticsAPI.getStockTurnover(params);
      return response.data?.data;
    },
    staleTime: 60 * 5,
  });
};

export const useCategoryDistribution = (params?: { materialId?: string; genderId?: string; itemId?: string; categoryId?: string; groupBy?: string }) => {
  return useQuery({
    queryKey: ["category-distribution", params],
    queryFn: async () => {
      const response = await dashboardAnalyticsAPI.getCategoryDistribution(params);
      return response.data?.data;
    },
    staleTime: 60 * 5,
  });
};

export const useTaxSummary = (params?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ["tax-summary", params],
    queryFn: async () => {
      const response = await dashboardAnalyticsAPI.getTaxSummary(params);
      return response.data?.data;
    },
    staleTime: 60 * 5,
  });
};

export const useCouponAnalytics = (params?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ["coupon-analytics", params],
    queryFn: async () => {
      const response = await dashboardAnalyticsAPI.getCouponAnalytics(params);
      return response.data?.data;
    },
    staleTime: 60 * 5,
  });
};

export const useLoyaltyLiability = (params?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ["loyalty-liability", params],
    queryFn: async () => {
      const response = await dashboardAnalyticsAPI.getLoyaltyLiability(params);
      return response.data?.data;
    },
    staleTime: 60 * 5,
  });
};

export const useFinancialSummary = (params?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ["financial-summary", params],
    queryFn: async () => {
      const response = await dashboardAnalyticsAPI.getFinancialSummary(params);
      return response.data?.data;
    },
    staleTime: 60 * 5,
  });
};

export const useExportFinancialData = () => {
  return useMutation({
    mutationFn: async (params?: { startDate?: string; endDate?: string }) => {
      const response = await dashboardAnalyticsAPI.exportFinancialData(params);
      return response.data;
    },
  });
};

export const usePaymentReconciliation = (params?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ["payment-reconciliation", params],
    queryFn: async () => {
      const response = await dashboardAnalyticsAPI.getPaymentReconciliation(params);
      return response.data?.data;
    },
    staleTime: 60 * 5,
  });
};

export const useInventoryValuationTrend = () => {
  return useQuery({
    queryKey: ["inventory-valuation-trend"],
    queryFn: async () => {
      const response = await dashboardAnalyticsAPI.getInventoryValuationTrend();
      return response.data?.data;
    },
    staleTime: 60 * 10,
  });
};

export const useCustomerCohorts = () => {
  return useQuery({
    queryKey: ["customer-cohorts"],
    queryFn: async () => {
      const response = await dashboardAnalyticsAPI.getCustomerCohorts();
      return response.data?.data;
    },
    staleTime: 60 * 10,
  });
};
