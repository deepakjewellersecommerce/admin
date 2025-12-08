import { authAPI } from "../axios/auth-API";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const useAuthLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: unknown) => {
      console.log('%c🚀 useAuthLogin: Starting login process', 'background: #2563eb; color: white; padding: 2px 4px; border-radius: 4px;');
      console.log('Login payload:', payload);
      const response = await authAPI.loginUser(payload);
  console.log('%c✅ useAuthLogin: Login API call successful', 'background: #059669; color: white; padding: 2px 4px; border-radius: 4px;');
  console.log('Login response:', response);
  console.log('Login response headers:', response?.headers);
      return response;
    },
    onSuccess: async (data) => {
      console.log('%c🎉 useAuthLogin: Login successful, processing response', 'background: #059669; color: white; padding: 2px 4px; border-radius: 4px;');
      console.log('Success data:', data);

      // Try many common locations for access tokens (body/data/header)
      let token: string | undefined;
      try {
        const anyData: any = data;
        // Normalize inner payload: axios -> response.data.data for your server, or response.data for simpler APIs
        const innerPayload = anyData?.data?.data ?? anyData?.data ?? anyData;

        // Primary location for our backend: innerPayload.admin.token
        token = innerPayload?.admin?.token || innerPayload?.token || innerPayload?.accessToken || innerPayload?.authToken;

        // Fallback: try headers
        if (!token && anyData?.headers) {
          token = anyData.headers['authorization'] || anyData.headers['Authorization'] || anyData.headers['x-access-token'];
          if (typeof token === 'string' && token.toLowerCase().startsWith('bearer ')) {
            token = token.split(' ')[1];
          }
        }
        // Also check headers
        if (!token && anyData?.headers) {
          token = anyData.headers['authorization'] || anyData.headers['Authorization'] || anyData.headers['x-access-token'];
          // header might be "Bearer <token>", strip if present
          if (typeof token === 'string' && token.toLowerCase().startsWith('bearer ')) {
            token = token.split(' ')[1];
          }
        }
      } catch (e) {
        console.warn('Token extraction failed:', e);
      }

  console.log('%c🔎 Extracted token (pre-save):', 'color: #f59e0b', token ? (token.slice ? token.slice(0,8)+'...' : token) : null);
  if (token) {
        try {
          // use centralized helper
          const { setAuthToken } = await import('@/lib/utils/auth');
          setAuthToken(token);
          console.log('%c🔐 Saved auth token via helper', 'color: #2563eb', token?.slice?.(0, 8) + '...');
          // set axios default header now
          try {
            const mod = await import('@/lib/axios/instance');
            const axiosInstance = mod.default;
            if (axiosInstance) axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          } catch (e) {
            console.warn('Could not set axios default header:', e);
          }
        } catch (e) {
          console.warn('Could not persist token via helper:', e);
        }
      }

      // Invalidate/refetch the user query so AuthGuard gets fresh user data
      try {
        await queryClient.invalidateQueries({ queryKey: ['user'] });
        // Also attempt a direct fetch to ensure immediate availability
        try {
          await (queryClient.fetchQuery as any)(['user'], () => authAPI.getUser());
        } catch (fetchErr) {
          console.warn('fetchQuery for user failed:', fetchErr);
        }
      } catch (e) {
        console.warn('Error invalidating/refetching user query:', e);
      }

      toast.success('Logged in successfully');

      // Navigate to dashboard after a short delay to allow user query to resolve
      setTimeout(() => navigate('/dashboard/'), 150);
    },
    onError: (error: any) => {
      console.log('%c❌ useAuthLogin: Login failed', 'background: #dc2626; color: white; padding: 2px 4px; border-radius: 4px;');
      console.log('Login error:', error);
      toast.error(error.response?.data?.error?.message ?? 'Error logging in');
    },
  });
};

export const useGetUser = () => {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      console.log('%c🔍 useGetUser: Making API call to /user/current', 'background: #f59e0b; color: white; padding: 2px 4px; border-radius: 4px;');
      try {
        const response = await authAPI.getUser();
        console.log('%c✅ useGetUser: API call successful', 'background: #059669; color: white; padding: 2px 4px; border-radius: 4px;');
        console.log('User data:', response.data);
        return response;
      } catch (error: any) {
        console.log('%c❌ useGetUser: API call failed', 'background: #dc2626; color: white; padding: 2px 4px; border-radius: 4px;');
        console.log('Error details:', error);
        console.log('Error response:', error.response);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 60 * 24,
    retry: 1, // Only retry once
    retryDelay: 1000, // Wait 1 second before retry
  });
};

export const useUploadImage = () => {
  return useMutation({
    mutationFn: async (formData: FormData) =>
      (() => {
        // If upload preset is available, ensure it is appended
        try {
          const preset = (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET;
          if (preset && !formData.has("upload_preset")) {
            formData.append("upload_preset", preset);
          }
        } catch (err) {
          // ignore if import.meta is unavailable in some environments
        }
        return axios.post("https://api.cloudinary.com/v1_1/dbu6rwupz/upload", formData);
      })(),
  });
};

export const uploadImage = async (formData: FormData) => {
  try {
    const preset = (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET;
    if (preset && !formData.has("upload_preset")) {
      formData.append("upload_preset", preset);
    }
  } catch (e) {
    // ignore
  }
  const response = await axios.post("https://api.cloudinary.com/v1_1/dbu6rwupz/upload", formData);

  return response.data;
};

export const useLogout = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authAPI.logoutUser,
    onSuccess: () => {
      toast.success("Logged out successfully");
      navigate("/auth/login");
    },
    onError: (error: any) => {
      toast.error(error.response.data.error.message ?? "Error logging out");
    },
  });
};

export const useDashboardData = () => {
  return useQuery({
    queryKey: ["dashboard-data"],
    queryFn: authAPI.getDashboardData,
    staleTime: 60 * 5,
  });
};

export const useGetConstants = () => {
  return useQuery({
    queryKey: ["constants"],
    queryFn: authAPI.getConstants,
    staleTime: 60 * 5,
  });
};

export const useUpdateConstants = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authAPI.updateConstants,
    onSuccess: () => {
      toast.success("Constants updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["constants"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error.response.data.error.message ?? "Error updating constants"
      );
    },
  });
};
