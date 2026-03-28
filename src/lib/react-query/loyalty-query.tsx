import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { loyaltyAPI } from "../axios/loyalty-API";

// Get loyalty program settings
export const useGetLoyaltyProgram = () => {
  return useQuery({
    queryKey: ["loyalty", "program"],
    queryFn: () => loyaltyAPI.getLoyaltyProgram(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Update loyalty program settings
export const useUpdateLoyaltyProgram = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: unknown) => loyaltyAPI.updateLoyaltyProgram(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty", "program"] });
    },
  });
};

// Get all users' loyalty data
export const useGetAllUsersLoyalty = (params?: {
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
  return useQuery({
    queryKey: ["loyalty", "users", params],
    queryFn: () => loyaltyAPI.getAllUsersLoyalty(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};
