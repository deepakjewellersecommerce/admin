/**
 * Category Hierarchy Management
 * Manages the 5-level category structure: Material -> Gender -> Item -> Category -> Subcategory
 * Single form with smart depth detection and real-time ID preview
 */

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronRight,
  Plus,
  Edit,
  Tag,
  Users,
  Diamond,
  Grid3X3,
  FolderTree,
} from "lucide-react";
import {
  useGetAllMaterials,
  useGetAllGenders,
  useGetAllItems,
  useGetAllCategories,
  useCreateMaterial,
  useCreateGender,
  useCreateItem,
  useCreateCategory,
  useUpdateMaterial,
  useUpdateGender,
  useUpdateItem,
  useUpdateCategory,
  useGetCategoryImpact,
} from "@/lib/react-query/category-hierarchy-query";
import { useGetMetalTypes } from "@/lib/react-query/metal-price-query";
// Removed unused imports from category-hierarchy-API

const CategoryHierarchyPage = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editLevel, setEditLevel] = useState<string>("");
  const [showImpactModal, setShowImpactModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [previewId, setPreviewId] = useState<string>("");

  // Queries
  const { data: materialsData, isLoading: isLoadingMaterials } = useGetAllMaterials({
    includeInactive: true,
  });
  const { data: gendersData, isLoading: isLoadingGenders } = useGetAllGenders({
    includeInactive: true,
  });
  const { data: itemsData, isLoading: isLoadingItems } = useGetAllItems({
    includeInactive: true,
  });
  const { data: categoriesData, isLoading: isLoadingCategories } = useGetAllCategories({
    includeInactive: true,
  });
  const { data: metalTypesData } = useGetMetalTypes();

  // Impact query for edit confirmation
  const { data: impactData, isLoading: isLoadingImpact } = useGetCategoryImpact(
    editItem?._id || ""
  );

  // Mutations
  const { mutate: createMaterial, isPending: isCreatingMaterial } = useCreateMaterial();
  const { mutate: createGender, isPending: isCreatingGender } = useCreateGender();
  const { mutate: createItem, isPending: isCreatingItem } = useCreateItem();
  const { mutate: createCategory, isPending: isCreatingCategory } = useCreateCategory();
  const { mutate: updateMaterial, isPending: isUpdatingMaterial } = useUpdateMaterial();
  const { mutate: updateGender, isPending: isUpdatingGender } = useUpdateGender();
  const { mutate: updateItem, isPending: isUpdatingItem } = useUpdateItem();
  const { mutate: updateCategory, isPending: isUpdatingCategory } = useUpdateCategory();

  const materials = materialsData?.materials || [];
  const genders = gendersData?.genders || [];
  const items = itemsData?.items || [];
  const categories = categoriesData?.categories || [];
  const metalTypes = metalTypesData?.metalTypes || [];

  // Update preview ID when form data changes
  useEffect(() => {
    const generatePreviewId = () => {
      const parts = [];
      if (formData.materialId) {
        const material = materials.find((m: any) => m._id === formData.materialId);
        if (material) parts.push(material.idAttribute);
      }
      if (formData.genderId) {
        const gender = genders.find((g: any) => g._id === formData.genderId);
        if (gender) parts.push(gender.idAttribute);
      }
      if (formData.itemId) {
        const item = items.find((i: any) => i._id === formData.itemId);
        if (item) parts.push(item.idAttribute);
      }
      if (formData.idAttribute) {
        parts.push(formData.idAttribute.toUpperCase());
      }
      return parts.join("");
    };

    setPreviewId(generatePreviewId());
  }, [formData, materials, genders, items]);

  const resetForm = () => {
    setFormData({});
    setEditItem(null);
    setEditLevel("");
    setShowDialog(false);
    setShowImpactModal(false);
    setPreviewId("");
  };

  const handleAdd = () => {
    setEditItem(null);
    setEditLevel("");
    setFormData({});
    setShowDialog(true);
  };

  const handleEdit = (item: any, level: string) => {
    setEditItem(item);
    setEditLevel(level);
    setFormData({
      name: item.name,
      idAttribute: item.idAttribute,
      materialId: item.materialId?._id || item.materialId,
      genderId: item.genderId?._id || item.genderId,
      itemId: item.itemId?._id || item.itemId,
      metalType: item.metalType,
      description: item.description,
      imageUrl: item.imageUrl,
      isActive: item.isActive,
      sortOrder: item.sortOrder,
      seoTitle: item.seoTitle,
      seoDescription: item.seoDescription,
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!formData.name) return;

    const isEditing = !!editItem;
    if (isEditing) {
      // Show impact modal for edits
      setShowImpactModal(true);
    } else {
      // Create directly
      performSubmit();
    }
  };

  const performSubmit = () => {
    const isEditing = !!editItem;
    const level = editLevel || determineLevel();

    switch (level) {
      case "materials":
        if (isEditing) {
          updateMaterial(
            { id: editItem._id, data: formData },
            { onSuccess: resetForm }
          );
        } else {
          createMaterial(formData, { onSuccess: resetForm });
        }
        break;
      case "genders":
        if (isEditing) {
          updateGender(
            { id: editItem._id, data: formData },
            { onSuccess: resetForm }
          );
        } else {
          createGender(formData, { onSuccess: resetForm });
        }
        break;
      case "items":
        if (isEditing) {
          updateItem(
            { id: editItem._id, data: formData },
            { onSuccess: resetForm }
          );
        } else {
          createItem(formData, { onSuccess: resetForm });
        }
        break;
      case "categories":
        if (isEditing) {
          updateCategory(
            { id: editItem._id, data: formData },
            { onSuccess: resetForm }
          );
        } else {
          createCategory(formData, { onSuccess: resetForm });
        }
        break;
    }
  };

  const determineLevel = () => {
    if (formData.itemId && formData.idAttribute) return "categories";
    if (formData.genderId && formData.idAttribute) return "items";
    if (formData.materialId && formData.idAttribute) return "genders";
    if (formData.idAttribute) return "materials";
    return "materials";
  };



  const isPending =
    isCreatingMaterial ||
    isCreatingGender ||
    isCreatingItem ||
    isCreatingCategory ||
    isUpdatingMaterial ||
    isUpdatingGender ||
    isUpdatingItem ||
    isUpdatingCategory;

  const renderForm = () => {
    const isEditing = !!editItem;
    const level = editLevel || determineLevel();

    return (
      <div className="space-y-4">
        {/* Material Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="materialId">Material *</Label>
            {!isEditing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  // Quick create material
                  const name = prompt("Enter material name:");
                  if (name) {
                    createMaterial(
                      { name, idAttribute: "", metalType: "GOLD_24K", isActive: true },
                      {
                        onSuccess: (newMaterial: any) => {
                          setFormData({ ...formData, materialId: newMaterial._id });
                        },
                      }
                    );
                  }
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Quick Add
              </Button>
            )}
          </div>
          <Select
            value={formData.materialId || ""}
            onValueChange={(value) => setFormData({ ...formData, materialId: value })}
            disabled={isEditing}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent>
              {materials.map((m: any) => (
                <SelectItem key={m._id} value={m._id}>
                  {m.name} ({m.idAttribute})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Gender Selection - Show if Material selected */}
        {formData.materialId && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="genderId">Gender *</Label>
              {!isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const name = prompt("Enter gender name:");
                    if (name) {
                      createGender(
                        { name, idAttribute: "", isActive: true },
                        {
                          onSuccess: (newGender: any) => {
                            setFormData({ ...formData, genderId: newGender._id });
                          },
                        }
                      );
                    }
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Quick Add
                </Button>
              )}
            </div>
            <Select
              value={formData.genderId || ""}
              onValueChange={(value) => setFormData({ ...formData, genderId: value })}
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {genders.map((g: any) => (
                  <SelectItem key={g._id} value={g._id}>
                    {g.name} ({g.idAttribute})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Item Selection - Show if Gender selected */}
        {formData.genderId && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="itemId">Item Type *</Label>
              {!isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const name = prompt("Enter item name:");
                    if (name) {
                      createItem(
                        { name, idAttribute: "", description: "", isActive: true },
                        {
                          onSuccess: (newItem: any) => {
                            setFormData({ ...formData, itemId: newItem._id });
                          },
                        }
                      );
                    }
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Quick Add
                </Button>
              )}
            </div>
            <Select
              value={formData.itemId || ""}
              onValueChange={(value) => setFormData({ ...formData, itemId: value })}
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select item type" />
              </SelectTrigger>
              <SelectContent>
                {items.map((i: any) => (
                  <SelectItem key={i._id} value={i._id}>
                    {i.name} ({i.idAttribute})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Category Name - Show if Item selected */}
        {formData.itemId && (
          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Traditional"
            />
          </div>
        )}

        {/* ID Attribute */}
        <div className="space-y-2">
          <Label htmlFor="idAttribute">ID Attribute *</Label>
          <Input
            id="idAttribute"
            value={formData.idAttribute || ""}
            onChange={(e) =>
              setFormData({ ...formData, idAttribute: e.target.value.toUpperCase() })
            }
            placeholder="e.g., T"
            disabled={isEditing}
          />
          <p className="text-xs text-muted-foreground">
            Short code used in product SKUs (cannot be changed after creation)
          </p>
        </div>

        {/* Real-time ID Preview */}
        {previewId && (
          <div className="space-y-2">
            <Label>Preview ID</Label>
            <div className="p-2 bg-muted rounded text-sm font-mono">
              {previewId}
            </div>
          </div>
        )}

        {/* Metal Type - Only for Materials */}
        {level === "materials" && (
          <div className="space-y-2">
            <Label htmlFor="metalType">Metal Type *</Label>
            <Select
              value={formData.metalType || ""}
              onValueChange={(value) => setFormData({ ...formData, metalType: value })}
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select metal type" />
              </SelectTrigger>
              <SelectContent>
                {metalTypes.map((type: any) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Description - For Items and Categories */}
        {(level === "items" || level === "categories") && (
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>
        )}

        {/* Active Switch */}
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive !== false}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, isActive: checked })
            }
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
      </div>
    );
  };

  const renderTable = () => {
    const isLoading = isLoadingMaterials || isLoadingGenders || isLoadingItems || isLoadingCategories;

    if (isLoading) {
      return (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      );
    }

    // Combine all levels into one table
    const allItems = [
      ...materials.map((m: any) => ({ ...m, level: 'Material', levelIcon: Diamond })),
      ...genders.map((g: any) => ({ ...g, level: 'Gender', levelIcon: Users })),
      ...items.map((i: any) => ({ ...i, level: 'Item', levelIcon: Grid3X3 })),
      ...categories.map((c: any) => ({ ...c, level: 'Category', levelIcon: Tag })),
    ];

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Level</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allItems.map((item) => {
            const Icon = item.levelIcon;
            let details = '';
            let fullId = item.idAttribute;

            if (item.level === 'Category') {
              const material = typeof item.materialId === 'object' ? item.materialId : null;
              const gender = typeof item.genderId === 'object' ? item.genderId : null;
              const itemType = typeof item.itemId === 'object' ? item.itemId : null;
              details = `${material?.name || '?'} → ${gender?.name || '?'} → ${itemType?.name || '?'}`;
              fullId = item.fullCategoryId;
            } else if (item.level === 'Material') {
              details = item.metalType;
            }

            return (
              <TableRow key={item._id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {item.level}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <code className="text-sm bg-muted px-1 rounded">{fullId}</code>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {details || item.description || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={item.isActive ? "default" : "secondary"}>
                    {item.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(item, item.level.toLowerCase() + 's')}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          {allItems.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No hierarchy items found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Category Hierarchy</h1>
          <p className="text-muted-foreground">
            Manage the 5-level product categorization system
          </p>
        </div>
        <Button onClick={() => window.location.href = '/dashboard/subcategories'} variant="outline">
          <FolderTree className="h-4 w-4 mr-2" />
          Manage Subcategories
        </Button>
      </div>

      {/* Hierarchy Visualization */}
      <Card className="bg-gradient-to-r from-slate-50 to-slate-100">
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-2 text-sm">
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm">
              <Diamond className="h-4 w-4 text-yellow-500" />
              <span>Material</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm">
              <Users className="h-4 w-4 text-blue-500" />
              <span>Gender</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm">
              <Tag className="h-4 w-4 text-green-500" />
              <span>Item</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm">
              <Grid3X3 className="h-4 w-4 text-purple-500" />
              <span>Category</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm">
              <FolderTree className="h-4 w-4 text-orange-500" />
              <span>Subcategory...</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">All Hierarchy Levels</h2>
              <p className="text-sm text-muted-foreground">
                Materials, Genders, Items, and Categories in one view
              </p>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Hierarchy Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editItem ? "Edit" : "Add"} Hierarchy Item
                  </DialogTitle>
                  <DialogDescription>
                    Fill in the hierarchy fields. The form will show relevant fields based on your selections.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">{renderForm()}</div>
                <DialogFooter>
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={isPending}>
                    {isPending ? "Saving..." : editItem ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {renderTable()}
        </CardContent>
      </Card>

      {/* Impact Preview Modal */}
      <Dialog open={showImpactModal} onOpenChange={setShowImpactModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Changes</DialogTitle>
            <DialogDescription>
              Review the impact of your changes before proceeding.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Changes to {editItem?.name}</h4>
              <p className="text-sm text-muted-foreground">
                You are updating a {editLevel?.slice(0, -1)} in the hierarchy.
              </p>
            </div>
            {isLoadingImpact ? (
              <Skeleton className="h-20" />
            ) : impactData?.impact ? (
              <div className="space-y-2">
                <h4 className="font-medium">Affected Items:</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {impactData.impact.productsCount || 0}
                    </div>
                    <div className="text-sm text-blue-600">Products</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {impactData.impact.subcategoriesCount || 0}
                    </div>
                    <div className="text-sm text-green-600">Subcategories</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImpactModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => { setShowImpactModal(false); performSubmit(); }}>
              Confirm Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryHierarchyPage;
