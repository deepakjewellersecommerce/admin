// hooks/useCouponHooks.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner"; // Ensure this is the correct import path
import { couponAPI } from "../axios/coupon-API";

// Fetch all coupons
export const useGetCoupons = () => {
  return useQuery({
    queryKey: ["coupons"],
    queryFn: () => couponAPI.getCoupons(),
    staleTime: 15 * 60 * 1000, // Caches the data for 15 minutes
  });
};

// Add a new coupon
export const useAddCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: couponAPI.createCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["coupons"],
      });
      toast.success("Coupon successfully added!");
    },
    onError: (error: any) => {
      let message = "Error adding coupon";
      if (error.response?.data?.error?.message) {
        message = error.response.data.error.message;
      }
      if (error.response?.data?.error) {
        message = error.response.data.error;
      }

      toast.error(message ?? "Error adding coupon");
    },
  });
};

// Update a coupon
export const useUpdateCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: couponAPI.updateCoupon,
    onSuccess: (_data, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      if (variables?._id || variables?.id) {
        queryClient.invalidateQueries({ queryKey: ["coupon", variables._id || variables.id] });
      }
      toast.success("Coupon successfully Updated!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data.error.message ?? "Error adding coupon");
    },
  });
};

// Delete a coupon
export const useDeleteCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: couponAPI.deleteCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["coupons"],
      });
      toast.success("Coupon successfully Deleted!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data.error.message ?? "Error adding coupon");
    },
  });
};

// Fetch a single coupon
export const useGetCoupon = (id?: string) => {
  return useQuery({
    queryKey: ["coupon", id],
    queryFn: () => couponAPI.getCouponById(id ?? ""),
    enabled: !!id,
  });
};
