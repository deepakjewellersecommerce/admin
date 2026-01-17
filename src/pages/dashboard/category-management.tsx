/**
 * Unified Category Management Page
 * Single form to create categories with Material, Gender, Item selection
 * and live Category ID preview
 */

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  useGetAllMaterials,
  useGetAllGenders,
  useGetAllItems,
  useCreateCategory,
  useCreateMaterial,
  useCreateItem,
  useGetAllCategories,
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FolderTree, List, Pencil, ArrowRight, Upload } from "lucide-react";
import FormProvider from "@/components/form/FormProvider";
import FormImageInput from "@/components/form/FormImage";

// Validation schema for category form
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
  slug: z.string().optional(),
  isActive: z.boolean().default(true),
  imageUrl: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

// Validation schema for inline creation
const inlineItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  idAttribute: z
    .string()
    .min(1, "ID attribute is required")
    .max(10, "Max 10 characters")
    .regex(/^[^-]+$/, "Hyphens not allowed"),
});

const inlineMaterialSchema = inlineItemSchema.extend({
  metalType: z.enum(["GOLD_24K", "GOLD_22K", "SILVER_999", "SILVER_925", "PLATINUM"]),
});

const CategoryManagementPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"add" | "list">("add");

  // Inline add dialogs
  const [showMaterialDialog, setShowMaterialDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);

  // Inline form states
  const [newMaterial, setNewMaterial] = useState({ name: "", idAttribute: "", metalType: "GOLD_22K" });
  const [newItem, setNewItem] = useState({ name: "", idAttribute: "" });

  // Fetch data
  const { data: materialsData, isLoading: materialsLoading } = useGetAllMaterials();
  const { data: gendersData, isLoading: gendersLoading } = useGetAllGenders();
  const { data: itemsData, isLoading: itemsLoading } = useGetAllItems();
  const { data: categoriesData, isLoading: categoriesLoading } = useGetAllCategories();

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
      slug: "",
      isActive: true,
      imageUrl: "",
    },
  });

  // Watch form values for live preview
  const materialId = form.watch("materialId");
  const genderId = form.watch("genderId");
  const itemId = form.watch("itemId");
  const idAttribute = form.watch("idAttribute");
  const categoryName = form.watch("name");

  // Build dropdown options - API returns { status, data: { materials: [...] } }
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

  const categories = useMemo(() => {
    const data = categoriesData?.data?.categories || categoriesData?.categories || [];
    return Array.isArray(data) ? data : [];
  }, [categoriesData]);

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

  // Auto-generate slug from name
  useEffect(() => {
    if (categoryName) {
      const slug = categoryName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-");
      form.setValue("slug", slug, { shouldValidate: false });
    }
  }, [categoryName, form]);

  // Handle form submission
  const onSubmit = (data: CategoryFormData) => {
    createCategory(
      {
        materialId: data.materialId,
        genderId: data.genderId,
        itemId: data.itemId,
        name: data.name,
        idAttribute: data.idAttribute.toUpperCase(),
        slug: data.slug,
        isActive: data.isActive,
        imageUrl: data.imageUrl,
      },
      {
        onSuccess: () => {
          form.reset();
          setActiveTab("list");
        },
      }
    );
  };

  // Handle inline Material creation
  const handleCreateMaterial = () => {
    const validation = inlineMaterialSchema.safeParse(newMaterial);
    if (!validation.success) {
      toast.error(validation.error.errors[0]?.message || "Invalid input");
      return;
    }

    createMaterial(
      {
        name: newMaterial.name,
        idAttribute: newMaterial.idAttribute.toUpperCase(),
        metalType: newMaterial.metalType as any,
        isActive: true,
      },
      {
        onSuccess: (response: any) => {
          setShowMaterialDialog(false);
          setNewMaterial({ name: "", idAttribute: "", metalType: "GOLD_22K" });
          // Auto-select the new material
          if (response?.data?._id) {
            form.setValue("materialId", response.data._id);
          }
        },
      }
    );
  };

  // Handle inline Item creation
  const handleCreateItem = () => {
    const validation = inlineItemSchema.safeParse(newItem);
    if (!validation.success) {
      toast.error(validation.error.errors[0]?.message || "Invalid input");
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
          // Auto-select the new item
          if (response?.data?._id) {
            form.setValue("itemId", response.data._id);
          }
        },
      }
    );
  };

  const isLoading = materialsLoading || gendersLoading || itemsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Category Management</h1>
          <p className="text-sm text-gray-500">Create and manage product categories</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "add" | "list")}>
        <TabsList>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Category
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Category List
          </TabsTrigger>
        </TabsList>

        {/* Add Category Tab */}
        <TabsContent value="add" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderTree className="h-5 w-5" />
                    Add New Category
                  </CardTitle>
                  <CardDescription>
                    Select hierarchy options and enter category details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormProvider methods={form} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Material Selection */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="materialId">Material *</Label>
                        <Dialog open={showMaterialDialog} onOpenChange={setShowMaterialDialog}>
                          <DialogTrigger asChild>
                            <Button type="button" variant="outline" size="sm">
                              <Plus className="h-4 w-4 mr-1" /> Add
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add New Material</DialogTitle>
                              <DialogDescription>
                                Create a new material type (e.g., Gold 22K, Silver 925)
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                  placeholder="e.g., Gold 22K"
                                  value={newMaterial.name}
                                  onChange={(e) =>
                                    setNewMaterial({ ...newMaterial, name: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>ID Attribute (max 10 chars)</Label>
                                <Input
                                  placeholder="e.g., G22"
                                  maxLength={10}
                                  value={newMaterial.idAttribute}
                                  onChange={(e) =>
                                    setNewMaterial({
                                      ...newMaterial,
                                      idAttribute: e.target.value.toUpperCase(),
                                    })
                                  }
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowMaterialDialog(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                onClick={handleCreateMaterial}
                                disabled={isCreatingMaterial}
                              >
                                {isCreatingMaterial ? "Creating..." : "Create Material"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <Select
                        value={materialId}
                        onValueChange={(v) => form.setValue("materialId", v)}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select material..." />
                        </SelectTrigger>
                        <SelectContent>
                          {materials.map((m: any) => (
                            <SelectItem key={m._id} value={m._id}>
                              {m.name} ({m.metalType})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.materialId && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.materialId.message}
                        </p>
                      )}
                    </div>

                    {/* Gender Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="genderId">Gender *</Label>
                      <Select
                        value={genderId}
                        onValueChange={(v) => form.setValue("genderId", v)}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender..." />
                        </SelectTrigger>
                        <SelectContent>
                          {genders.map((g: any) => (
                            <SelectItem key={g._id} value={g._id}>
                              {g.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.genderId && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.genderId.message}
                        </p>
                      )}
                    </div>

                    {/* Item Selection */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="itemId">Item Type *</Label>
                        <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
                          <DialogTrigger asChild>
                            <Button type="button" variant="outline" size="sm">
                              <Plus className="h-4 w-4 mr-1" /> Add
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add New Item Type</DialogTitle>
                              <DialogDescription>
                                Create a new item type (e.g., Ring, Necklace, Earring)
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                  placeholder="e.g., Necklace"
                                  value={newItem.name}
                                  onChange={(e) =>
                                    setNewItem({ ...newItem, name: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>ID Attribute (max 10 chars)</Label>
                                <Input
                                  placeholder="e.g., N"
                                  maxLength={10}
                                  value={newItem.idAttribute}
                                  onChange={(e) =>
                                    setNewItem({
                                      ...newItem,
                                      idAttribute: e.target.value.toUpperCase(),
                                    })
                                  }
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowItemDialog(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                onClick={handleCreateItem}
                                disabled={isCreatingItem}
                              >
                                {isCreatingItem ? "Creating..." : "Create Item"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <Select
                        value={itemId}
                        onValueChange={(v) => form.setValue("itemId", v)}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select item type..." />
                        </SelectTrigger>
                        <SelectContent>
                          {items.map((i: any) => (
                            <SelectItem key={i._id} value={i._id}>
                              {i.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.itemId && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.itemId.message}
                        </p>
                      )}
                    </div>

                    <hr className="my-6" />

                    {/* Category Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Category Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Temple Jewelry"
                        {...form.register("name")}
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    {/* Category ID Attribute */}
                    <div className="space-y-2">
                      <Label htmlFor="idAttribute">Category ID Attribute *</Label>
                      <Input
                        id="idAttribute"
                        placeholder="e.g., T (for Temple)"
                        maxLength={10}
                        {...form.register("idAttribute")}
                        onChange={(e) => {
                          form.setValue("idAttribute", e.target.value.toUpperCase());
                        }}
                      />
                      <p className="text-xs text-gray-500">
                        Max 10 characters, no hyphens. Used in category ID generation.
                      </p>
                      {form.formState.errors.idAttribute && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.idAttribute.message}
                        </p>
                      )}
                    </div>

                    {/* Category Slug (Auto-generated) */}
                    <div className="space-y-2">
                      <Label htmlFor="slug">Category Slug</Label>
                      <Input
                        id="slug"
                        placeholder="auto-generated-slug"
                        {...form.register("slug")}
                      />
                      <p className="text-xs text-gray-500">
                        Auto-generated from name. You can edit if needed.
                      </p>
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                      <Label>Category Image</Label>
                      <FormImageInput name="imageUrl" label="" />
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={form.watch("isActive")}
                        onCheckedChange={(checked) => form.setValue("isActive", checked)}
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => form.reset()}
                      >
                        Reset
                      </Button>
                      <Button type="submit" disabled={isCreating}>
                        {isCreating ? "Creating..." : "Save Category"}
                      </Button>
                    </div>
                  </FormProvider>
                </CardContent>
              </Card>
            </div>

            {/* Live Preview Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Live Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Category ID Preview */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-600 font-medium mb-2">
                      Generated Category ID
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedMaterial?.idAttribute && (
                        <Badge variant="secondary">{selectedMaterial.idAttribute}</Badge>
                      )}
                      {selectedMaterial?.idAttribute && selectedGender?.idAttribute && (
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                      )}
                      {selectedGender?.idAttribute && (
                        <Badge variant="secondary">{selectedGender.idAttribute}</Badge>
                      )}
                      {selectedGender?.idAttribute && selectedItem?.idAttribute && (
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                      )}
                      {selectedItem?.idAttribute && (
                        <Badge variant="secondary">{selectedItem.idAttribute}</Badge>
                      )}
                      {selectedItem?.idAttribute && idAttribute && (
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                      )}
                      {idAttribute && (
                        <Badge variant="default">{idAttribute.toUpperCase()}</Badge>
                      )}
                    </div>
                    <p className="text-lg font-mono font-bold text-blue-800 mt-3">
                      {generatedCategoryId}
                    </p>
                  </div>

                  {/* Selection Summary */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Material:</span>
                      <span className="font-medium">
                        {selectedMaterial?.name || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Gender:</span>
                      <span className="font-medium">
                        {selectedGender?.name || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Item:</span>
                      <span className="font-medium">
                        {selectedItem?.name || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Category:</span>
                      <span className="font-medium">
                        {categoryName || "-"}
                      </span>
                    </div>
                  </div>

                  {selectedMaterial?.metalType && (
                    <div className="p-3 bg-amber-50 rounded-md">
                      <p className="text-xs text-amber-700">
                        Metal Type: <strong>{selectedMaterial.metalType}</strong>
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        Products in this category will use {selectedMaterial.metalType} pricing.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Category List Tab */}
        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Categories</CardTitle>
              <CardDescription>
                {categories.length} categories found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <FolderTree className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No categories found</p>
                  <Button
                    variant="link"
                    onClick={() => setActiveTab("add")}
                    className="mt-2"
                  >
                    Create your first category
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((cat: any) => (
                      <TableRow key={cat._id}>
                        <TableCell>
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                            {cat.fullCategoryId || cat.idAttribute}
                          </code>
                        </TableCell>
                        <TableCell className="font-medium">{cat.name}</TableCell>
                        <TableCell>
                          {/* API returns populated object or ID string */}
                          {typeof cat.materialId === "object" ? cat.materialId?.name :
                            materials.find((m: any) => m._id === cat.materialId)?.name || "-"}
                        </TableCell>
                        <TableCell>
                          {typeof cat.genderId === "object" ? cat.genderId?.name :
                            genders.find((g: any) => g._id === cat.genderId)?.name || "-"}
                        </TableCell>
                        <TableCell>
                          {typeof cat.itemId === "object" ? cat.itemId?.name :
                            items.find((i: any) => i._id === cat.itemId)?.name || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={cat.isActive ? "default" : "secondary"}>
                            {cat.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => {
                            // TODO: Implement edit functionality
                            toast.info("Edit functionality coming soon");
                          }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CategoryManagementPage;
