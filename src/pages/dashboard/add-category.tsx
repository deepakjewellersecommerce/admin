/**
 * Add Category Page
 * Full page form for creating new categories
 */

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  useGetAllMaterials,
  useGetAllGenders,
  useGetAllItems,
  useCreateCategory,
  useCreateMaterial,
  useCreateItem,
} from "@/lib/react-query/category-hierarchy-query";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, ArrowLeft, ChevronRight } from "lucide-react";
import FormProvider from "@/components/form/FormProvider";

// Validation schema
const categorySchema = z.object({
  materialId: z.string().min(1, "Material is required"),
  genderId: z.string().min(1, "Gender is required"),
  itemId: z.string().min(1, "Item type is required"),
  name: z.string().min(1, "Category name is required").max(100),
  idAttribute: z
    .string()
    .min(1, "Category ID attribute is required")
    .max(10, "Max 10 characters")
    .regex(/^[^-]+$/, "Hyphens not allowed"),
  isActive: z.boolean().default(true),
});

type CategoryFormData = z.infer<typeof categorySchema>;

const AddCategoryPage = () => {
  const navigate = useNavigate();
  const [showMaterialDialog, setShowMaterialDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);

  // Inline form states
  const [newMaterial, setNewMaterial] = useState({ name: "", idAttribute: "" });
  const [newItem, setNewItem] = useState({ name: "", idAttribute: "" });

  // Fetch data
  const { data: materialsData, isLoading: materialsLoading } = useGetAllMaterials();
  const { data: gendersData, isLoading: gendersLoading } = useGetAllGenders();
  const { data: itemsData, isLoading: itemsLoading } = useGetAllItems();

  // Mutations
  const { mutate: createCategory, isPending: isCreating } = useCreateCategory();
  const { mutate: createMaterial, isPending: isCreatingMaterial } = useCreateMaterial();
  const { mutate: createItem, isPending: isCreatingItem } = useCreateItem();

  // Form setup
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      materialId: "",
      genderId: "",
      itemId: "",
      name: "",
      idAttribute: "",
      isActive: true,
    },
  });

  // Watch form values for live preview
  const materialId = form.watch("materialId");
  const genderId = form.watch("genderId");
  const itemId = form.watch("itemId");
  const idAttribute = form.watch("idAttribute");

  // Build dropdown options
  const materials = useMemo(() => {
    const data = materialsData?.data?.materials || materialsData?.materials || [];
    return Array.isArray(data) ? data : [];
  }, [materialsData]);

  const genders = useMemo(() => {
    const data = gendersData?.data?.genders || gendersData?.genders || [];
    return Array.isArray(data) ? data : [];
  }, [gendersData]);

  const items = useMemo(() => {
    const data = itemsData?.data?.items || itemsData?.items || [];
    return Array.isArray(data) ? data : [];
  }, [itemsData]);

  // Get selected items for preview
  const selectedMaterial = useMemo(() => {
    return materials.find((m: any) => m._id === materialId);
  }, [materials, materialId]);

  const selectedGender = useMemo(() => {
    return genders.find((g: any) => g._id === genderId);
  }, [genders, genderId]);

  const selectedItem = useMemo(() => {
    return items.find((i: any) => i._id === itemId);
  }, [items, itemId]);

  // Generate live Category ID preview
  const generatedCategoryId = useMemo(() => {
    const parts = [];
    if (selectedMaterial?.idAttribute) parts.push(selectedMaterial.idAttribute);
    if (selectedGender?.idAttribute) parts.push(selectedGender.idAttribute);
    if (selectedItem?.idAttribute) parts.push(selectedItem.idAttribute);
    if (idAttribute) parts.push(idAttribute.toUpperCase());
    return parts.join("-") || "---";
  }, [selectedMaterial, selectedGender, selectedItem, idAttribute]);

  // Handle form submission
  const onSubmit = (data: CategoryFormData) => {
    createCategory(
      {
        materialId: data.materialId,
        genderId: data.genderId,
        itemId: data.itemId,
        name: data.name,
        idAttribute: data.idAttribute.toUpperCase(),
        isActive: data.isActive,
      },
      {
        onSuccess: () => {
          toast.success("Category created successfully");
          navigate("/dashboard/catalog/categories");
        },
      }
    );
  };

  // Handle inline Material creation
  const handleCreateMaterial = () => {
    if (!newMaterial.name || !newMaterial.idAttribute) {
      toast.error("Name and ID attribute are required");
      return;
    }

    createMaterial(
      {
        name: newMaterial.name,
        idAttribute: newMaterial.idAttribute.toUpperCase(),
        isActive: true,
      },
      {
        onSuccess: (response: any) => {
          setShowMaterialDialog(false);
          setNewMaterial({ name: "", idAttribute: "" });
          if (response?.data?._id) {
            form.setValue("materialId", response.data._id);
          }
        },
      }
    );
  };

  // Handle inline Item creation
  const handleCreateItem = () => {
    if (!newItem.name || !newItem.idAttribute) {
      toast.error("Name and ID attribute are required");
      return;
    }

    createItem(
      {
        name: newItem.name,
        idAttribute: newItem.idAttribute.toUpperCase(),
        isActive: true,
      },
      {
        onSuccess: (response: any) => {
          setShowItemDialog(false);
          setNewItem({ name: "", idAttribute: "" });
          if (response?.data?._id) {
            form.setValue("itemId", response.data._id);
          }
        },
      }
    );
  };

  const isLoading = materialsLoading || gendersLoading || itemsLoading;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header with Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link to="/dashboard/catalog/categories" className="hover:text-blue-600 hover:underline">
            Categories
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span>Add Category</span>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Add New Category</h1>
            <p className="text-sm text-gray-500">
              Create a new product category by selecting hierarchy options.
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
          <CardDescription>
            Select the hierarchy path and provide category information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider methods={form} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Hierarchy Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">Hierarchy Path</h3>

              {/* Material */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Material *</Label>
                  <Dialog open={showMaterialDialog} onOpenChange={setShowMaterialDialog}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Material</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            placeholder="e.g., Gold 22K"
                            value={newMaterial.name}
                            onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>ID Attribute</Label>
                          <Input
                            placeholder="e.g., G22"
                            maxLength={10}
                            value={newMaterial.idAttribute}
                            onChange={(e) => setNewMaterial({ ...newMaterial, idAttribute: e.target.value.toUpperCase() })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowMaterialDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreateMaterial} disabled={isCreatingMaterial}>
                          {isCreatingMaterial ? "Creating..." : "Create"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <Select value={materialId} onValueChange={(v) => form.setValue("materialId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select material..." />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((m: any) => (
                      <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.materialId && (
                  <p className="text-sm text-red-500">{form.formState.errors.materialId.message}</p>
                )}
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label>Gender *</Label>
                <Select value={genderId} onValueChange={(v) => form.setValue("genderId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender..." />
                  </SelectTrigger>
                  <SelectContent>
                    {genders.map((g: any) => (
                      <SelectItem key={g._id} value={g._id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.genderId && (
                  <p className="text-sm text-red-500">{form.formState.errors.genderId.message}</p>
                )}
              </div>

              {/* Item */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Item Type *</Label>
                  <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Item Type</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            placeholder="e.g., Necklace"
                            value={newItem.name}
                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>ID Attribute</Label>
                          <Input
                            placeholder="e.g., N"
                            maxLength={10}
                            value={newItem.idAttribute}
                            onChange={(e) => setNewItem({ ...newItem, idAttribute: e.target.value.toUpperCase() })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowItemDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreateItem} disabled={isCreatingItem}>
                          {isCreatingItem ? "Creating..." : "Create"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <Select value={itemId} onValueChange={(v) => form.setValue("itemId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select item type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((i: any) => (
                      <SelectItem key={i._id} value={i._id}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.itemId && (
                  <p className="text-sm text-red-500">{form.formState.errors.itemId.message}</p>
                )}
              </div>
            </div>

            {/* Category Info Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">Category Information</h3>

              {/* Category Name */}
              <div className="space-y-2">
                <Label>Category Name *</Label>
                <Input placeholder="e.g., Temple Jewelry" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>

              {/* ID Attribute */}
              <div className="space-y-2">
                <Label>ID Attribute *</Label>
                <Input
                  placeholder="e.g., T"
                  maxLength={10}
                  {...form.register("idAttribute")}
                  onChange={(e) => form.setValue("idAttribute", e.target.value.toUpperCase())}
                />
                <p className="text-xs text-gray-500">Max 10 characters, no hyphens allowed</p>
                {form.formState.errors.idAttribute && (
                  <p className="text-sm text-red-500">{form.formState.errors.idAttribute.message}</p>
                )}
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-600 font-medium mb-1">Generated Category ID</p>
              <p className="text-2xl font-mono font-bold text-blue-800">{generatedCategoryId}</p>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                checked={form.watch("isActive")}
                onCheckedChange={(checked) => form.setValue("isActive", checked)}
              />
              <Label>Active</Label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard/catalog/categories")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isLoading}>
                {isCreating ? "Creating..." : "Save Category"}
              </Button>
            </div>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddCategoryPage;
