import instance from './instance';

export const authAPI = {
  registerUser: async (payload: unknown) => {
    return instance.post('/admin/signup',payload);
  },
  loginUser:async (payload: unknown) => {
    // Don't include Authorization header for login requests
    return instance.post('/admin/signin', payload, {
      headers: {
        'Authorization': undefined // Explicitly remove Authorization header
      }
    });
  },
  getUser: () => instance.get('/user/current'),
  getDashboardData: (params?: { startDate?: string; endDate?: string }) =>
    instance.get('/admin/dashboard', { params }),
  getConstants: () => instance.get('/user/constants'),
  updateConstants: (payload: unknown) => instance.post('/user/constants', payload),
  logoutUser: () => instance.get('/logout'),
};

