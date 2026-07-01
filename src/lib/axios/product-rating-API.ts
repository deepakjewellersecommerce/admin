import instance from './instance';

export const productRatingAPI = {
  getRatings: async () => {
    return instance.get('/product/rating/all');
  },
  // NOTE: This endpoint has no route defined on the backend yet (singleProductRating_get exists in controller but not in routes)
  getRating: async (id: string) => {
    return instance.get(`/product/rating/single/${id}`);
  },
  getRatingsByProduct: async (productId: string) => {
    return instance.get(`/product/${productId}/rating`);
  },
  addRating: async (data: any) => {
    return instance.post('/product/rating', data);
  },
  addAdminRating: async (data: any) => {
    return instance.post('/product/rating', data);
  },
  // NOTE: This needs a backend PUT /product/rating/:id route added before it can work
  updateRating: async (data: any) => {
    return instance.put(`/product/rating/${data._id}`, data);
  },
};
