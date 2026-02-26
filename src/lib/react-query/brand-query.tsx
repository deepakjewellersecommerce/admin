import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { brandAPI } from "../axios/brand-API";
import { useMemo } from "react";

export const useGetBrands = () => {
  return useQuery({
    queryKey: ["brands"],
    queryFn: () => brandAPI.getBrands(),
    staleTime: 15 * 60 * 1000,
  });
};

export const useAddBrand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: brandAPI.addBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Successfully Added!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data.error.message ?? "Error adding brand");
    },
  });
};

export const useGetBrand = (id: string) => {
  return useQuery({
    queryKey: ["brand", id],
    queryFn: () => brandAPI.getBrand(id),
    staleTime: 15 * 60 * 1000,
  });
};

export const useUpdateBrand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: brandAPI.updateBrand,
    onSuccess: (_data, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      if (variables?._id || variables?.id) {
        queryClient.invalidateQueries({ queryKey: ["brand", variables._id || variables.id] });
      }
      toast.success("Successfully Updated!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data.error.message ?? "Error updating brand");
    },
  });
};

export const useDeleteBrand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: brandAPI.deleteBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Successfully Deleted!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data.error.message ?? "Error deleting brand");
    },
  });
};

export const useGetBrandOptions = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["brandOptions"],
    queryFn: () => brandAPI.getBrands(),
    staleTime: 15 * 60 * 1000,
  });

  const options = useMemo(() => {
    if (!data) return [];
    return data.data.data.brands?.map((brand: any) => ({
      label: brand.brand_name,
      value: brand._id,
    }));
  }, [data]);
  return { options, isLoading };
};
