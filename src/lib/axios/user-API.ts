import instance from './instance';

export const userAPI = {
  getAllUsers: async (filter: any = {}) => {
    return instance.get('/admin/user/all', {
      params: {
        page: (filter.pageIndex ?? 0) + 1,
        limit: filter.pageSize ?? 10,
        search: filter.search || undefined,
        accountStatus:
          filter.accountStatus && filter.accountStatus !== 'all'
            ? filter.accountStatus
            : undefined,
        hasOrders:
          filter.hasOrders && filter.hasOrders !== 'all'
            ? filter.hasOrders
            : undefined,
      },
    });
  },
  loginUser:async (payload: unknown) => {
    return instance.post('/admin/signin',payload);
  },
  getUser: () => instance.get('/user/current'),
  getUserCart: (id:string) => instance.get('/admin/user/cart/'+id),
  getUserProfile: (id: string, page?: number, limit?: number) =>
    instance.get(`/admin/user/${id}/profile`, { params: { page, limit } }),
  getUserPanStatus: (id: string) =>
    instance.get(`/admin/user/${id}/pan`),
  resetUserPan: (id: string) =>
    instance.post(`/admin/user/${id}/pan/reset`),
};

