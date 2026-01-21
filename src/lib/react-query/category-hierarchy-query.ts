/**
 * Category Hierarchy React Query Hooks
 * Provides hooks for materials, genders, items, categories, and subcategories
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import categoryHierarchyAPI, {
  Material,
  Gender,
  Item,
  Category,
  Subcategory,
  PricingComponent,
} from "../axios/category-hierarchy-API";
import { toast } from "sonner";

// ==================== MATERIALS ====================

export const useGetAllMaterials = (params?: { includeInactive?: boolean }) => {
  return useQuery({
    queryKey: ["categoryHierarchy", "materials", params],
    queryFn: () => categoryHierarchyAPI.getAllMaterials(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useGetMaterial = (id: string) => {
  return useQuery({
    queryKey: ["categoryHierarchy", "materials", id],
    queryFn: () => categoryHierarchyAPI.getMaterial(id),
    enabled: Boolean(id),
  });
};

export const useCreateMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Material>) => categoryHierarchyAPI.createMaterial(data),
    onSuccess: () => {
      toast.success("Material created successfully!");
      queryClient.invalidateQueries({ queryKey: ["categoryHierarchy", "materials"] });
      queryClient.invalidateQueries({ queryKey: ["categoryHierarchy", "hierarchy"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create material");
    },
  });
};

export const useUpdateMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Material> }) =>
      categoryHierarchyAPI.updateMaterial(id, data),
    onSuccess: () => {
      toast.success("Material updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["categoryHierarchy", "materials"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update material");
    },
  });
};

// ==================== GENDERS ====================

export const useGetAllGenders = (params?: { includeInactive?: boolean }) => {
  return useQuery({
    queryKey: ["categoryHierarchy", "genders", params],
    queryFn: () => categoryHierarchyAPI.getAllGenders(params),
    staleTime: 10 * 60 * 1000,
  });
};

export const useGetGender = (id: string) => {
  return useQuery({
    queryKey: ["categoryHierarchy", "genders", id],
    queryFn: () => categoryHierarchyAPI.getGender(id),
    enabled: Boolean(id),
  });
};

export const useCreateGender = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Gender>) => categoryHierarchyAPI.createGender(data),
    onSuccess: () => {
      toast.success("Gender created successfully!");
      queryClient.invalidateQueries({ queryKey: ["categoryHierarchy", "genders"] });
      queryClient.invalidateQueries({ queryKey: ["categoryHierarchy", "hierarchy"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create gender");
    },
  });
};

export const useUpdateGender = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Gender> }) =>
      categoryHierarchyAPI.updateGender(id, data),
    onSuccess: () => {
      toast.success("Gender updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["categoryHierarchy", "genders"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update gender");
    },
  });
};

// ==================== ITEMS ====================

export const useGetAllItems = (params?: { includeInactive?: boolean }) => {
  return useQuery({
    queryKey: ["categoryHierarchy", "items", params],
    queryFn: () => categoryHierarchyAPI.getAllItems(params),
    staleTime: 10 * 60 * 1000,
  });
};

export const useGetItem = (id: string) => {
  return useQuery({
    queryKey: ["categoryHierarchy", "items", id],
    queryFn: () => categoryHierarchyAPI.getItem(id),
    enabled: Boolean(id),
  });
};

export const useCreateItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Item>) => categoryHierarchyAPI.createItem(data),
    onSuccess: () => {
      toast.success("Item type created successfully!");
      queryClient.invalidateQueries({ queryKey: ["categoryHierarchy", "items"] });
      queryClient.invalidateQueries({ queryKey: ["categoryHierarchy", "hierarchy"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create item type");
    },
  });
};

export const useUpdateItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Item> }) =>
      categoryHierarchyAPI.updateItem(id, data),
    onSuccess: () => {
      toast.success("Item type updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["categoryHierarchy", "items"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update item type");
    },
  });
};

// ==================== CATEGORIES ====================

export const useGetAllCategories = (params?: {
  materialId?: string;
  genderId?: string;
  itemId?: string;
  includeInactive?: boolean;
}) => {
  return useQuery({
    queryKey: ["categoryHierarchy", "categories", params],
    queryFn: () => categoryHierarchyAPI.getAllCategories(params),
    staleTime: 10 * 60 * 1000,
  });
};

export const useGetCategory = (id: string) => {
  return useQuery({
    queryKey: ["categoryHierarchy", "categories", id],
    queryFn: () => categoryHierarchyAPI.getCategory(id),
    enabled: Boolean(id),
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Category>) => categoryHierarchyAPI.createCategory(data),
    onSuccess: () => {
      toast.success("Category created successfully!");
      queryClient.invalidateQueries({ queryKey: ["categoryHierarchy", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["categoryHierarchy", "hierarchy"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create category");
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
      categoryHierarchyAPI.updateCategory(id, data),
    onSuccess: () => {
      toast.success("Category updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["categoryHierarchy", "categories"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update category");
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryHierarchyAPI.deleteCategory(id),
    onSuccess: () => {
      toast.success("Category deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["categoryHierarchy", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["categoryHierarchy", "hierarchy"] });
    },
    onError: (error: any) => {
      const reason =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        (typeof error?.response?.data === 'string' ? error.response.data : null) ||
        error?.message ||
        "Failed to delete category";
      toast.error(`${reason}`);
    },
  });
};

export const useGetCategoryImpact = (id: string) => {
  return useQuery({
    queryKey: ["categoryHierarchy", "categories", id, "impact"],
    queryFn: () => categoryHierarchyAPI.getCategoryImpact(id),
    enabled: Boolean(id),
  });
};

// ==================== HIERARCHY HELPERS ====================

export const useGetFullHierarchy = () => {
  return useQuery({
    queryKey: ["categoryHierarchy", "hierarchy"],
    queryFn: categoryHierarchyAPI.getFullHierarchy,
    staleTime: 10 * 60 * 1000,
  });
};

export const useGetCascadeOptions = (params?: {
  materialId?: string;
  genderId?: string;
  itemId?: string;
}) => {
  return useQuery({
    queryKey: ["categoryHierarchy", "cascade", params],
    queryFn: () => categoryHierarchyAPI.getCascadeOptions(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useQuickCreate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ level, data }: { level: number | string; data: Record<string, unknown> }) =>
      categoryHierarchyAPI.quickCreate(level, data),
    onSuccess: () => {
      toast.success("Created successfully!");
      queryClient.invalidateQueries({ queryKey: ["categoryHierarchy"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create");
    },
  });
};

// ==================== SUBCATEGORIES ====================

export const useGetAllSubcategories = (params?: {
  categoryId?: string;
  materialId?: string;
  parentSubcategoryId?: string | null;
  hasPricingConfig?: boolean;
  includeInactive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ["subcategories", "list", params],
    queryFn: () => categoryHierarchyAPI.getAllSubcategories(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useGetSubcategory = (id: string) => {
  return useQuery({
    queryKey: ["subcategories", id],
    queryFn: () => categoryHierarchyAPI.getSubcategory(id),
    enabled: Boolean(id),
  });
};

export const useCreateSubcategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Partial<Subcategory> & {
        configurePricing?: boolean;
        pricingConfig?: { components: PricingComponent[] };
      }
    ) => categoryHierarchyAPI.createSubcategory(data),
    onSuccess: () => {
      toast.success("Subcategory created successfully!");
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create subcategory");
    },
  });
};

export const useUpdateSubcategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Subcategory> }) =>
      categoryHierarchyAPI.updateSubcategory(id, data),
    onSuccess: () => {
      toast.success("Subcategory updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update subcategory");
    },
  });
};

export const useGetSubcategoryImpact = (id: string) => {
  return useQuery({
    queryKey: ["subcategories", id, "impact"],
    queryFn: () => categoryHierarchyAPI.getSubcategoryImpact(id),
    enabled: Boolean(id),
  });
};

export const useCheckSubcategoryAvailability = (params?: { categoryId?: string; parentSubcategoryId?: string | null; idAttribute?: string }) => {
  return useQuery({
    queryKey: ["subcategories", "check-availability", params],
    queryFn: () => categoryHierarchyAPI.checkSubcategoryAvailability(params as any),
    enabled: Boolean(params?.categoryId && params?.idAttribute),
    staleTime: 30 * 1000,
  });
};

export const useDeleteSubcategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) =>
      categoryHierarchyAPI.deleteSubcategory(id, force),
    onSuccess: () => {
      toast.success("Subcategory deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
    },
    onError: (error: any) => {
      const reason =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        (typeof error?.response?.data === 'string' ? error.response.data : null) ||
        error?.message ||
        "Failed to delete subcategory";
      toast.error(`${reason}`);
    },
  });
};

export const useGetSubcategoryTree = (categoryId: string) => {
  return useQuery({
    queryKey: ["subcategories", "tree", categoryId],
    queryFn: () => categoryHierarchyAPI.getSubcategoryTree(categoryId),
    enabled: Boolean(categoryId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useSearchSubcategories = (
  q: string,
  params?: { categoryId?: string; limit?: number }
) => {
  return useQuery({
    queryKey: ["subcategories", "search", q, params],
    queryFn: () => categoryHierarchyAPI.searchSubcategories(q, params),
    enabled: q.length >= 2,
    staleTime: 2 * 60 * 1000,
  });
};

// ==================== SUBCATEGORY PRICING ====================

export const useGetSubcategoryPricing = (id: string) => {
  return useQuery({
    queryKey: ["subcategories", id, "pricing"],
    queryFn: () => categoryHierarchyAPI.getSubcategoryPricing(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateSubcategoryPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, components }: { id: string; components: PricingComponent[] }) =>
      categoryHierarchyAPI.updateSubcategoryPricing(id, components),
    onSuccess: (_, variables) => {
      toast.success("Pricing config updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["subcategories", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update pricing config");
    },
  });
};

export const useCreateDefaultSubcategoryPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryHierarchyAPI.createDefaultSubcategoryPricing(id),
    onSuccess: (_, id) => {
      toast.success("Default pricing config created!");
      queryClient.invalidateQueries({ queryKey: ["subcategories", id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create default pricing config");
    },
  });
};

export const useRemoveSubcategoryPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryHierarchyAPI.removeSubcategoryPricing(id),
    onSuccess: (_, id) => {
      toast.success("Pricing config removed. Now inherits from parent.");
      queryClient.invalidateQueries({ queryKey: ["subcategories", id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to remove pricing config");
    },
  });
};

export const useFreezeSubcategoryComponent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      componentKey,
      reason,
    }: {
      id: string;
      componentKey: string;
      reason: string;
    }) => categoryHierarchyAPI.freezeSubcategoryComponent(id, componentKey, reason),
    onSuccess: (_, variables) => {
      toast.success(`Component "${variables.componentKey}" frozen!`);
      queryClient.invalidateQueries({ queryKey: ["subcategories", variables.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to freeze component");
    },
  });
};

export const useUnfreezeSubcategoryComponent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, componentKey }: { id: string; componentKey: string }) =>
      categoryHierarchyAPI.unfreezeSubcategoryComponent(id, componentKey),
    onSuccess: (_, variables) => {
      toast.success(`Component "${variables.componentKey}" unfrozen!`);
      queryClient.invalidateQueries({ queryKey: ["subcategories", variables.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to unfreeze component");
    },
  });
};

export const useGetSubcategoryAffectedProducts = (
  id: string,
  params?: { limit?: number; offset?: number }
) => {
  return useQuery({
    queryKey: ["subcategories", id, "affectedProducts", params],
    queryFn: () => categoryHierarchyAPI.getSubcategoryAffectedProducts(id, params),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
};
