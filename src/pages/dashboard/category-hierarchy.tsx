/**
 * Category Hierarchy Management
 * Manages the 5-level category structure: Material -> Gender -> Item -> Category -> Subcategory
 */

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronRight,
  Plus,
  Edit,
  Layers,
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
} from "@/lib/react-query/category-hierarchy-query";
import { useGetMetalTypes } from "@/lib/react-query/metal-price-query";
import { Material, Gender, Item, Category } from "@/lib/axios/category-hierarchy-API";

const CategoryHierarchyPage = () => {
  const [activeTab, setActiveTab] = useState("materials");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState<Record<string, any>>({});

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

  // Mutations
  const { mutate: createMaterial, isPending: isCreatingMaterial } = useCreateMaterial();
  const { mutate: createGender, isPending: isCreatingGender } = useCreateGender();
  const { mutate: createItem, isPending: isCreatingItem } = useCreateItem();
  const { mutate: createCategory, isPending: isCreatingCategory } = useCreateCategory();
  const { mutate: updateMaterial, isPending: isUpdatingMaterial } = useUpdateMaterial();
  const { mutate: updateGender, isPending: isUpdatingGender } = useUpdateGender();
  const { mutate: updateItem, isPending: isUpdatingItem } = useUpdateItem();
  const { mutate: updateCategory, isPending: isUpdatingCategory } = useUpdateCategory();

  const materials: Material[] = materialsData?.data?.materials || [];
  const genders: Gender[] = gendersData?.data?.genders || [];
  const items: Item[] = itemsData?.data?.items || [];
  const categories: Category[] = categoriesData?.data?.categories || [];
  const metalTypes = metalTypesData?.data?.types || [];

  const resetForm = () => {
    setFormData({});
    setEditItem(null);
    setShowAddDialog(false);
  };

  const handleAdd = () => {
    setEditItem(null);
    setFormData({});
    setShowAddDialog(true);
  };

  const handleEdit = (item: any) => {
    setEditItem(item);
    setFormData({ ...item });
    setShowAddDialog(true);
  };

  const handleSubmit = () => {
    const isEditing = !!editItem;

    switch (activeTab) {
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

  const isPending =
    isCreatingMaterial ||
    isCreatingGender ||
    isCreatingItem ||
    isCreatingCategory ||
    isUpdatingMaterial ||
    isUpdatingGender ||
    isUpdatingItem ||
    isUpdatingCategory;

  const tabConfig = [
    {
      id: "materials",
      label: "Materials",
      icon: Diamond,
      description: "Level 1: Metal types (Gold, Silver, Platinum)",
    },
    {
      id: "genders",
      label: "Genders",
      icon: Users,
      description: "Level 2: Target demographics (Men, Women, Unisex)",
    },
    {
      id: "items",
      label: "Item Types",
      icon: Tag,
      description: "Level 3: Jewelry types (Ring, Necklace, Earring)",
    },
    {
      id: "categories",
      label: "Categories",
      icon: Grid3X3,
      description: "Level 4: Style categories (Traditional, Modern, Wedding)",
    },
  ];

  const renderForm = () => {
    switch (activeTab) {
      case "materials":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Gold 22K"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idAttribute">ID Attribute *</Label>
              <Input
                id="idAttribute"
                value={formData.idAttribute || ""}
                onChange={(e) =>
                  setFormData({ ...formData, idAttribute: e.target.value.toUpperCase() })
                }
                placeholder="e.g., G22"
                disabled={!!editItem}
              />
              <p className="text-xs text-muted-foreground">
                Short code used in product SKUs (cannot be changed after creation)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="metalType">Metal Type *</Label>
              <Select
                value={formData.metalType || ""}
                onValueChange={(value) => setFormData({ ...formData, metalType: value })}
                disabled={!!editItem}
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
          </>
        );

      case "genders":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Women"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idAttribute">ID Attribute *</Label>
              <Input
                id="idAttribute"
                value={formData.idAttribute || ""}
                onChange={(e) =>
                  setFormData({ ...formData, idAttribute: e.target.value.toUpperCase() })
                }
                placeholder="e.g., F"
                disabled={!!editItem}
              />
            </div>
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
          </>
        );

      case "items":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Necklace"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idAttribute">ID Attribute *</Label>
              <Input
                id="idAttribute"
                value={formData.idAttribute || ""}
                onChange={(e) =>
                  setFormData({ ...formData, idAttribute: e.target.value.toUpperCase() })
                }
                placeholder="e.g., N"
                disabled={!!editItem}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
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
          </>
        );

      case "categories":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Traditional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idAttribute">ID Attribute *</Label>
              <Input
                id="idAttribute"
                value={formData.idAttribute || ""}
                onChange={(e) =>
                  setFormData({ ...formData, idAttribute: e.target.value.toUpperCase() })
                }
                placeholder="e.g., T"
                disabled={!!editItem}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="materialId">Material *</Label>
              <Select
                value={formData.materialId || ""}
                onValueChange={(value) => setFormData({ ...formData, materialId: value })}
                disabled={!!editItem}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((m) => (
                    <SelectItem key={m._id} value={m._id}>
                      {m.name} ({m.idAttribute})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="genderId">Gender *</Label>
              <Select
                value={formData.genderId || ""}
                onValueChange={(value) => setFormData({ ...formData, genderId: value })}
                disabled={!!editItem}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {genders.map((g) => (
                    <SelectItem key={g._id} value={g._id}>
                      {g.name} ({g.idAttribute})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemId">Item Type *</Label>
              <Select
                value={formData.itemId || ""}
                onValueChange={(value) => setFormData({ ...formData, itemId: value })}
                disabled={!!editItem}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select item type" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((i) => (
                    <SelectItem key={i._id} value={i._id}>
                      {i.name} ({i.idAttribute})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          </>
        );
    }
  };

  const renderTable = () => {
    const isLoading =
      (activeTab === "materials" && isLoadingMaterials) ||
      (activeTab === "genders" && isLoadingGenders) ||
      (activeTab === "items" && isLoadingItems) ||
      (activeTab === "categories" && isLoadingCategories);

    if (isLoading) {
      return (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      );
    }

    switch (activeTab) {
      case "materials":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Metal Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((m) => (
                <TableRow key={m._id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-1 rounded">{m.idAttribute}</code>
                  </TableCell>
                  <TableCell>{m.metalType}</TableCell>
                  <TableCell>
                    <Badge variant={m.isActive ? "default" : "secondary"}>
                      {m.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(m)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {materials.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No materials found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        );

      case "genders":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {genders.map((g) => (
                <TableRow key={g._id}>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-1 rounded">{g.idAttribute}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={g.isActive ? "default" : "secondary"}>
                      {g.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(g)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {genders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No genders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        );

      case "items":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i._id}>
                  <TableCell className="font-medium">{i.name}</TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-1 rounded">{i.idAttribute}</code>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {i.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={i.isActive ? "default" : "secondary"}>
                      {i.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(i)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No item types found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        );

      case "categories":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => {
                const material =
                  typeof c.materialId === "object" ? c.materialId : null;
                const gender = typeof c.genderId === "object" ? c.genderId : null;
                const item = typeof c.itemId === "object" ? c.itemId : null;

                return (
                  <TableRow key={c._id}>
                    <TableCell>
                      <code className="text-sm bg-muted px-1 rounded">
                        {c.fullCategoryId}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {material?.name || "?"} <ChevronRight className="h-3 w-3 inline" />{" "}
                      {gender?.name || "?"} <ChevronRight className="h-3 w-3 inline" />{" "}
                      {item?.name || "?"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.isActive ? "default" : "secondary"}>
                        {c.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(c)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {categories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No categories found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        );
    }
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <TabsList>
                {tabConfig.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button onClick={handleAdd}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add {tabConfig.find((t) => t.id === activeTab)?.label.slice(0, -1)}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editItem ? "Edit" : "Add"}{" "}
                      {tabConfig.find((t) => t.id === activeTab)?.label.slice(0, -1)}
                    </DialogTitle>
                    <DialogDescription>
                      {tabConfig.find((t) => t.id === activeTab)?.description}
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
            {tabConfig.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="m-0">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">{tab.description}</p>
                </div>
                {renderTable()}
              </TabsContent>
            ))}
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default CategoryHierarchyPage;
