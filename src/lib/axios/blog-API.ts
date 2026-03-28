import instance from './instance';

export const blogAPI = {
    getBlogs: async (filter: any = {}) => {
        return instance.get('/blog/all', {
            params: {
                page: (filter.pageIndex ?? 0) + 1,
                limit: filter.pageSize ?? 10,
                search: filter.search || undefined,
                status: filter.status && filter.status !== 'all' ? filter.status : undefined,
                startDate: filter.startDate || undefined,
                endDate: filter.endDate || undefined,
            },
        });
    },
    addBlog: async (payload:unknown) => {
        return instance.post(`/admin/blog/add`, payload);
    },
    getBlog: async (id:string) => {
        return instance.get(`/blog/${id}`);
    },
    updateBlog: async (payload:any) => {
        return instance.put(`/admin/blog/${payload._id}/edit`, payload);
    },
 };
