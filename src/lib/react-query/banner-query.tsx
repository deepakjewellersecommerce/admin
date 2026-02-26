import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { bannerAPI } from "../axios/banner-API";

export const useGetBanners = () => {
  return useQuery({
    queryKey: ["banners"],
    queryFn: () => bannerAPI.getBanners(),
    staleTime: 15 * 60 * 1000,
  });
};

export const useAddBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bannerAPI.addBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Successfully Added!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data.error.message ?? "Error adding banner"
      );
    },
  });
};

export const useGetBanner = (id: string) => {
  return useQuery({
    queryKey: ["banner", id],
    queryFn: () => bannerAPI.getBanner(id),
    staleTime: 15 * 60 * 1000,
  });
};

export const useUpdateBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bannerAPI.updateBanner,
    onSuccess: (_data, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      if (variables?._id || variables?.id) {
        queryClient.invalidateQueries({ queryKey: ["banner", variables._id || variables.id] });
      }
      toast.success("Successfully Updated!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data.error.message ?? "Error updating banner"
      );
    },
  });
};

export const useDeleteBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bannerAPI.deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data.error.message ?? "Error deleting banner");
    },
  });
};
