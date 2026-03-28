import instance from './instance';

export const bannerAPI = {
    getBanners: async (filter: any = {}) => {
        return instance.get('/banners', {
            params: {
                page: (filter.pageIndex ?? 0) + 1,
                limit: filter.pageSize ?? 10,
                search: filter.search || undefined,
                isActive:
                    filter.isActive && filter.isActive !== 'all'
                        ? filter.isActive === 'active'
                        : undefined,
            },
        });
    },
    addBanner: async (payload: unknown) => {
        return instance.post(`/admin/banners`, payload);
    },
    getBanner: async (id: string) => {
        return instance.get(`/banners/${id}`);
    },
    updateBanner: async (payload: any) => {
        // Support FormData (sent when files are present) and plain objects
        if (payload instanceof FormData) {
            const id = (payload.get('_id') as string) || (payload as any)._id;
            if (!id) {
                throw new Error('Missing banner id in FormData payload');
            }
            return instance.put(`/admin/banners/${id}`, payload);
        }
        return instance.put(`/admin/banners/${payload._id}`, payload);
    },
    deleteBanner: async (id: string) => {
        return instance.delete(`/admin/banners/${id}`);
    },
};
