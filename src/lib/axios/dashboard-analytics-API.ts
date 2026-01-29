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
};
