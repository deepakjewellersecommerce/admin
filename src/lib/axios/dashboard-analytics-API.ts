import instance from './instance';

export const dashboardAnalyticsAPI = {
  getRevenueByMetal: (params?: { startDate?: string; endDate?: string }) =>
    instance.get('/admin/dashboard/analytics/revenue-by-metal', { params }),
  getPerformanceByItem: (params?: { startDate?: string; endDate?: string }) =>
    instance.get('/admin/dashboard/analytics/performance-by-item', { params }),
  getDiscountEfficiency: (params?: { startDate?: string; endDate?: string }) =>
    instance.get('/admin/dashboard/analytics/discount-efficiency', { params }),
  getInventoryHealth: () =>
    instance.get('/admin/dashboard/analytics/inventory-health'),
  getOrderFunnel: (params?: { startDate?: string; endDate?: string }) =>
    instance.get('/admin/dashboard/analytics/order-funnel', { params }),
  getDashboardKPIs: () =>
    instance.get('/admin/dashboard/kpis'),
  getPendingOrdersDetails: (hours: number) =>
    instance.get('/admin/dashboard/pending-orders', { params: { hours } }),
  getStockOutOrdersDetails: () =>
    instance.get('/admin/dashboard/stock-out-orders'),
  getPricingErrorsDetails: () =>
    instance.get('/admin/dashboard/pricing-errors'),
  getTopProducts: (params?: { startDate?: string; endDate?: string }) =>
    instance.get('/admin/dashboard/analytics/top-products', { params }),
  getTopCategories: (params?: { startDate?: string; endDate?: string }) =>
    instance.get('/admin/dashboard/analytics/top-categories', { params }),
  getTopUsers: (params?: { startDate?: string; endDate?: string }) =>
    instance.get('/admin/dashboard/analytics/top-users', { params }),
  getTopLocations: (params?: { startDate?: string; endDate?: string }) =>
    instance.get('/admin/dashboard/analytics/top-locations', { params }),
  getRevenueTrends: (params?: { startDate?: string; endDate?: string; groupBy?: string }) =>
    instance.get('/admin/dashboard/analytics/revenue-trends', { params }),
  getRepeatPurchaseRate: (params?: { startDate?: string; endDate?: string }) =>
    instance.get('/admin/dashboard/analytics/repeat-purchase-rate', { params }),
  getStockTurnover: (params?: { materialId?: string; genderId?: string; itemId?: string; categoryId?: string }) =>
    instance.get('/admin/dashboard/analytics/stock-turnover', { params }),
  getCategoryDistribution: (params?: { materialId?: string; genderId?: string; itemId?: string; categoryId?: string; groupBy?: string }) =>
    instance.get('/admin/dashboard/analytics/category-distribution', { params }),
  getTaxSummary: (params?: { startDate?: string; endDate?: string }) =>
    instance.get('/admin/dashboard/analytics/tax-summary', { params }),
  getCouponAnalytics: (params?: { startDate?: string; endDate?: string }) =>
    instance.get('/admin/dashboard/analytics/coupon-analytics', { params }),
  getLoyaltyLiability: (params?: { startDate?: string; endDate?: string }) =>
    instance.get('/admin/dashboard/analytics/loyalty-liability', { params }),
  getFinancialSummary: (params?: { startDate?: string; endDate?: string }) =>
    instance.get('/admin/dashboard/analytics/financial-summary', { params }),
  exportFinancialData: (params?: { startDate?: string; endDate?: string }) =>
    instance.get('/admin/dashboard/export', { params, responseType: 'blob' }),
  getPaymentReconciliation: (params?: { startDate?: string; endDate?: string }) =>
    instance.get('/admin/dashboard/analytics/payment-reconciliation', { params }),
  getInventoryValuationTrend: () =>
    instance.get('/admin/dashboard/analytics/inventory-valuation-trend'),
  getCustomerCohorts: () =>
    instance.get('/admin/dashboard/analytics/customer-cohorts'),
};
