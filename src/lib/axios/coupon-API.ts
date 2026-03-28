import instance from './instance';

export const couponAPI = {
  createCoupon: async (payload: unknown) => {
    return instance.post('/admin/coupon/add', payload);
  },

  getCoupons: async (filter: any = {}) => {
    return instance.get('/admin/coupon/all', {
      params: {
        page: (filter.pageIndex ?? 0) + 1,
        limit: filter.pageSize ?? 10,
        search: filter.search || undefined,
        status: filter.status && filter.status !== 'all' ? filter.status : undefined,
        couponType:
          filter.couponType && filter.couponType !== 'all'
            ? filter.couponType
            : undefined,
        availability:
          filter.availability && filter.availability !== 'all'
            ? filter.availability
            : undefined,
        startDate: filter.startDate || undefined,
        endDate: filter.endDate || undefined,
      },
    });
  },

  getCouponById: async (couponId: string) => {
    return instance.get(`/coupon/single/${couponId}`);
  },

  getCouponByCode: async (couponCode: string) => {
    return instance.get(`/coupon/${couponCode}/get}`);
  },

  updateCoupon: async (payload:any) => {
    return instance.post(`/admin/coupon/${payload._id}/edit`, payload);
  },

  deleteCoupon: async (couponId: string) => {
    return instance.delete(`/coupons/${couponId}`);
  },
};
