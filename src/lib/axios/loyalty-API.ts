import instance from './instance';

export const loyaltyAPI = {
  // Get loyalty program settings
  getLoyaltyProgram: async () => {
    return instance.get('/loyalty/program');
  },

  // Update loyalty program settings (Admin)
  updateLoyaltyProgram: async (payload: unknown) => {
    return instance.put('/admin/loyalty/program', payload);
  },

  // Get all users' loyalty data (Admin)
  getAllUsersLoyalty: async (params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    search?: string;
    tier?: string;
    minPoints?: string;
    maxPoints?: string;
    hasRedeemed?: string;
  }) => {
    return instance.get('/admin/loyalty/users', { params });
  },
};
