import instance from './instance';

export const orderAPI = {
    getOrders: async (filter: any) => {
        return instance.get('/admin/order/all', {
            params: {
                page: filter.pageIndex + 1,
                search: filter.search || undefined,
                limit: filter.pageSize,
                payment_status: filter.payment_status || undefined,
                order_status: filter.order_status || undefined,
                startDate: filter.startDate || undefined,
                endDate: filter.endDate || undefined,
            }
        });
    },
    // getOrders: async () => {
    //     return instance.get('/admin/order/all');
    // },
    getOrderId: async (id: string) => {
        return instance.get(`/admin/order/${id}`);
    },
    updateOrder: async (data: any) => {
        return instance.put(`/admin/order/${data._id}/update`, data);
    },
    downloadInvoice: async (id: string) => {
        return instance.get(`/admin/order/${id}/invoice`, { responseType: 'blob' });
    },
    getGstReport: async (year: number, month?: number) => {
        return instance.get('/admin/order/gst-report', {
            params: { year, month: month ?? undefined },
        });
    },
};
