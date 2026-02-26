import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { colorAPI } from "../axios/color-API";

export const useGetColor = () => {
  return useQuery({
    queryKey: ["colors"],
    queryFn: () => colorAPI.getColors(),
    staleTime: 15 * 60 * 1000,
  });
};

export const useAddColor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: colorAPI.addColor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colors"] });
      toast.success("Successfully Added!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data.error.message ?? "Error adding category"
      );
    },
  });
};

export const useUpdateColor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: colorAPI.updateColor,
    onSuccess: (_data, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ["colors"] });
      if (variables?._id || variables?.id) {
        queryClient.invalidateQueries({ queryKey: ["color", variables._id || variables.id] });
      }
      toast.success("Successfully Updated!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data.error.message ?? "Error updating category"
      );
    },
  });
};

export const useGetColorById = (id: string) => {
  return useQuery({
    queryKey: ["color", id],
    queryFn: () => colorAPI.getColor(id),
    enabled: Boolean(id),
    staleTime: 15 * 60 * 1000,
  });
};

export const useDeleteColor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: colorAPI.deleteColor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colors"] });
      toast.success("Successfully Deleted!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data.error.message ?? "Error deleting category"
      );
    },
  });
};
