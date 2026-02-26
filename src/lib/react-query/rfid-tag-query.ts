import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rfidTagAPI } from "../axios/rfid-tag-API";

export const useGenerateRfidTags = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rfidTagAPI.generateTags,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfidTags"] });
      queryClient.invalidateQueries({ queryKey: ["rfidSummary"] });
    },
  });
};

export const useGetRfidTags = (
  productId: string,
  params?: {
    variantId?: string;
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  }
) => {
  return useQuery({
    queryKey: ["rfidTags", productId, params],
    queryFn: () => rfidTagAPI.getTagsByProduct(productId, params),
    enabled: Boolean(productId),
    staleTime: 60 * 1000,
  });
};

export const useGetRfidSummary = (productId: string) => {
  return useQuery({
    queryKey: ["rfidSummary", productId],
    queryFn: () => rfidTagAPI.getTagsSummary(productId),
    enabled: Boolean(productId),
    staleTime: 60 * 1000,
  });
};

export const useDownloadRfidCsv = () => {
  return useMutation({
    mutationFn: ({
      productId,
      params,
    }: {
      productId: string;
      params?: { variantId?: string; status?: string };
    }) => rfidTagAPI.downloadTagsCsv(productId, params),
  });
};

export const useUpdateRfidTagStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tagId, status }: { tagId: string; status: string }) =>
      rfidTagAPI.updateTagStatus(tagId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfidTags"] });
      queryClient.invalidateQueries({ queryKey: ["rfidSummary"] });
    },
  });
};
