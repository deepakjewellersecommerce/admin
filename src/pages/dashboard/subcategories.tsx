/**
 * Subcategories Management Page
 * Level 5+ with unlimited nesting, tree view, and pricing configuration
 */

import { useState, useMemo, useRef, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Edit,
  Trash2,
  FolderTree,
  Settings,
  DollarSign,
  AlertCircle,
  Search,
  Package,
} from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import {
  useGetAllCategories,
  useGetSubcategoryTree,
  useCreateSubcategory,
  useUpdateSubcategory,
  useDeleteSubcategory,
  useGetSubcategoryPricing,
  useCreateDefaultSubcategoryPricing,
  useRemoveSubcategoryPricing,
} from "@/lib/react-query/category-hierarchy-query";
import { Category, Subcategory } from "@/lib/axios/category-hierarchy-API";
import { toast } from "sonner";

// Tree node component for recursive rendering
const SubcategoryTreeNode = ({
  node,
  level = 0,
  onEdit,
  onDelete,
  onConfigurePricing,
  selectedId,
  onSelect,
}: {
  node: Subcategory & { children?: Subcategory[] };
  level?: number;
  onEdit: (subcategory: Subcategory) => void;
  onDelete: (subcategory: Subcategory) => void;
  onConfigurePricing: (subcategory: Subcategory) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node._id;

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 py-2 px-2 rounded-md cursor-pointer hover:bg-muted transition-colors ${
          isSelected ? "bg-primary/10 border border-primary/30" : ""
        }`}
        style={{ marginLeft: `${level * 20}px` }}
        onClick={() => onSelect(node._id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="p-1 hover:bg-muted rounded"
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="w-6" />
        )}

        <FolderTree className="h-4 w-4 text-orange-500" />

        <span className="flex-1 font-medium text-sm">{node.name}</span>

        <code className="text-xs bg-muted px-1 rounded">{node.idAttribute}</code>

        {node.hasPricingConfig && (
          <Badge variant="outline" className="text-xs">
            <DollarSign className="h-3 w-3 mr-1" />
            Pricing
          </Badge>
        )}

        <Badge variant={node.isActive ? "default" : "secondary"} className="text-xs">
          {node.isActive ? "Active" : "Inactive"}
        </Badge>

        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Tooltip content="Configure Pricing">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onConfigurePricing(node)}
              aria-label="Configure Pricing"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </Tooltip>

          <Tooltip content="Edit">
            <Button variant="ghost" size="sm" onClick={() => onEdit(node)} aria-label="Edit">
              <Edit className="h-4 w-4" />
            </Button>
          </Tooltip>

          <Tooltip content="Delete">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(node)}
              className="text-destructive hover:text-destructive"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
      </div>

      {hasChildren && isOpen && (
        <div>
          {node.children!.map((child) => (
            <SubcategoryTreeNode
              key={child._id}
              node={child as Subcategory & { children?: Subcategory[] }}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onConfigurePricing={onConfigurePricing}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const SubcategoriesPage = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [editItem, setEditItem] = useState<Subcategory | null>(null);
  const [deleteItem, setDeleteItem] = useState<Subcategory | null>(null);
  const [pricingItem, setPricingItem] = useState<Subcategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Queries
  const { data: categoriesData, isLoading: isLoadingCategories } = useGetAllCategories({
    includeInactive: true,
  });
  const { data: treeData, isLoading: isLoadingTree } = useGetSubcategoryTree(
    selectedCategoryId
  );
  const { data: pricingData, isLoading: isLoadingPricing } = useGetSubcategoryPricing(
    pricingItem?._id || ""
  );

  // Mutations
  const { mutate: createSubcategory, isPending: isCreating } = useCreateSubcategory();
  const { mutate: updateSubcategory, isPending: isUpdating } = useUpdateSubcategory();
  const { mutate: deleteSubcategory, isPending: isDeleting } = useDeleteSubcategory();
  const { mutate: createDefaultPricing, isPending: isCreatingPricing } =
    useCreateDefaultSubcategoryPricing();
  const { mutate: removePricing, isPending: isRemovingPricing } =
    useRemoveSubcategoryPricing();

  const categories: Category[] = categoriesData?.data?.categories || [];
  const tree = useMemo(() => treeData?.data?.tree || [], [treeData]);

  // Filter tree based on search
  const filteredTree = useMemo(() => {
    if (!searchQuery) return tree;

    const filterNode = (
      node: Subcategory & { children?: Subcategory[] }
    ): (Subcategory & { children?: Subcategory[] }) | null => {
      const matchesSearch =
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.idAttribute.toLowerCase().includes(searchQuery.toLowerCase());

      const filteredChildren = node.children
        ?.map(filterNode)
        .filter(Boolean) as (Subcategory & { children?: Subcategory[] })[];

      if (matchesSearch || (filteredChildren && filteredChildren.length > 0)) {
        return {
          ...node,
          children: filteredChildren || [],
        };
      }

      return null;
    };

    return tree.map(filterNode).filter(Boolean) as (Subcategory & {
      children?: Subcategory[];
    })[];
  }, [tree, searchQuery]);

  // Get flat list of subcategories for parent selection
  const flatSubcategories = useMemo(() => {
    const flatten = (
      nodes: (Subcategory & { children?: Subcategory[] })[],
      result: Subcategory[] = []
    ): Subcategory[] => {
      for (const node of nodes) {
        result.push(node);
        if (node.children) {
          flatten(node.children, result);
        }
      }
      return result;
    };
    return flatten(tree);
  }, [tree]);

  const resetForm = () => {
    setFormData({});
    setEditItem(null);
    setShowAddDialog(false);
  };

  const handleAdd = (parentId?: string) => {
    setEditItem(null);
    setFormData({ parentSubcategoryId: parentId || null });
    setShowAddDialog(true);
  };

  const handleEdit = (subcategory: Subcategory) => {
    setEditItem(subcategory);
    setFormData({ ...subcategory });
    setShowAddDialog(true);
  };

  // Auto-generate slug from name in the dialog unless user manually edits it
  const autoSlugRef = useRef("");
  useEffect(() => {
    const name = formData.name || "";
    const generated = generateSlug(name);
    const currentSlug = formData.slug || "";
    if (!currentSlug || currentSlug === autoSlugRef.current) {
      setFormData((prev) => ({ ...prev, slug: generated }));
      autoSlugRef.current = generated;
    }
  }, [formData.name, formData.slug]);

  const handleDelete = (subcategory: Subcategory) => {
    setDeleteItem(subcategory);
    setShowDeleteDialog(true);
  };

  const handleConfigurePricing = (subcategory: Subcategory) => {
    setPricingItem(subcategory);
    setShowPricingDialog(true);
  };

  const generateSlug = (name: string) =>
    (name || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  const computedSlug = (formData.slug || generateSlug(formData.name) || "").trim();
  const isSlugValid = Boolean(computedSlug);

  const handleSubmit = () => {
    // Require a name to generate a slug
    if (!formData.name || formData.name.trim().length === 0) {
      toast.error("Name is required to create a subcategory");
      return;
    }

    if (!isSlugValid) {
      toast.error("Unable to generate a valid slug. Please enter a valid Slug.");
      return;
    }

    const payload = {
      ...formData,
      categoryId: selectedCategoryId,
      slug: computedSlug,
    };

    // Log payload for debugging if server rejects
    // eslint-disable-next-line no-console
    console.debug("Creating/Updating subcategory with payload:", payload);

    if (editItem) {
      updateSubcategory(
        { id: editItem._id, data: payload },
        { onSuccess: resetForm }
      );
    } else {
      createSubcategory(payload, { onSuccess: resetForm });
    }
  };

  const handleConfirmDelete = (force: boolean) => {
    if (!deleteItem) return;
    deleteSubcategory(
      { id: deleteItem._id, force },
      {
        onSuccess: () => {
          setDeleteItem(null);
          setShowDeleteDialog(false);
        },
      }
    );
  };

  const handleCreateDefaultPricing = () => {
    if (!pricingItem) return;
    createDefaultPricing(pricingItem._id, {
      onSuccess: () => {
        setShowPricingDialog(false);
        setPricingItem(null);
      },
    });
  };

  const handleRemovePricing = () => {
    if (!pricingItem) return;
    removePricing(pricingItem._id, {
      onSuccess: () => {
        setShowPricingDialog(false);
        setPricingItem(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Subcategories</h1>
          <p className="text-muted-foreground">
            Level 5+ categories with unlimited nesting and pricing configuration
          </p>
        </div>
      </div>

      {/* Category Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Select Category</CardTitle>
          <CardDescription>
            Choose a Level 4 category to manage its subcategories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Select
                value={selectedCategoryId}
                onValueChange={setSelectedCategoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingCategories ? (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : (
                    categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        <span className="font-mono text-xs mr-2">
                          {cat.fullCategoryId}
                        </span>
                        {cat.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {selectedCategoryId && (
              <Button onClick={() => handleAdd()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Subcategory
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subcategory Tree */}
      {selectedCategoryId && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Subcategory Tree</CardTitle>
                <CardDescription>
                  Click on a subcategory to select it, or use the action buttons
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subcategories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingTree ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : filteredTree.length === 0 ? (
              <div className="text-center py-12">
                <FolderTree className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "No subcategories match your search"
                    : "No subcategories yet. Click 'Add Subcategory' to create one."}
                </p>
              </div>
            ) : (
              <div className="border rounded-lg p-4 max-h-[500px] overflow-auto">
                {(filteredTree as (Subcategory & { children?: Subcategory[] })[]).map((node) => (
                  <SubcategoryTreeNode
                    key={node._id}
                    node={node}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onConfigurePricing={handleConfigurePricing}
                    selectedId={selectedSubcategoryId}
                    onSelect={setSelectedSubcategoryId}
                  />
                ))}
              </div>
            )}

            {selectedSubcategoryId && (
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={() => handleAdd(selectedSubcategoryId)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Child Subcategory
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Edit Subcategory" : "Add Subcategory"}
            </DialogTitle>
            <DialogDescription>
              {editItem
                ? "Update the subcategory details"
                : "Create a new subcategory in the selected category"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Temple Jewelry"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idAttribute">ID Attribute *</Label>
              <Input
                id="idAttribute"
                value={formData.idAttribute || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    idAttribute: e.target.value.toUpperCase(),
                  })
                }
                placeholder="e.g., TJ"
                disabled={!!editItem}
              />
              <p className="text-xs text-muted-foreground">
                Short code used in product SKUs
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (auto-generated)</Label>
              <Input
                id="slug"
                value={formData.slug || ""}
                onChange={(e) => {
                  setFormData({ ...formData, slug: e.target.value });
                  autoSlugRef.current = e.target.value;
                }}
                placeholder="auto-generated-slug"
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier. You can edit before saving.
              </p>
            </div>
            {!editItem && (
              <div className="space-y-2">
                <Label htmlFor="parentSubcategoryId">Parent Subcategory</Label>
                <Select
                  value={formData.parentSubcategoryId || "none"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      parentSubcategoryId: value === "none" ? null : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None (top-level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (top-level)</SelectItem>
                    {flatSubcategories.map((sub) => (
                      <SelectItem key={sub._id} value={sub._id}>
                        {"—".repeat(sub.depth)} {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <div className="flex-1" />
            {!isSlugValid && (
              <span className="text-xs text-destructive mr-4">Slug is invalid or empty</span>
            )}
            <Button
              onClick={handleSubmit}
              disabled={isCreating || isUpdating || !isSlugValid}
            >
              {isCreating || isUpdating
                ? "Saving..."
                : editItem
                ? "Update"
                : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subcategory</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteItem?.name}"?
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              This action cannot be undone. If this subcategory has children or
              products, they may be affected.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleConfirmDelete(false)}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleConfirmDelete(true)}
              disabled={isDeleting}
            >
              Force Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pricing Configuration Dialog */}
      <Dialog open={showPricingDialog} onOpenChange={setShowPricingDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pricing Configuration</DialogTitle>
            <DialogDescription>
              Configure pricing for "{pricingItem?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isLoadingPricing ? (
              <Skeleton className="h-24" />
            ) : pricingItem?.hasPricingConfig ? (
              <div className="space-y-4">
                <Alert>
                  <DollarSign className="h-4 w-4" />
                  <AlertTitle>Has Own Pricing Config</AlertTitle>
                  <AlertDescription>
                    This subcategory has its own pricing configuration. Products
                    in this subcategory will use these settings.
                  </AlertDescription>
                </Alert>
                {pricingData?.data?.pricingConfig && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Components:</h4>
                    <div className="space-y-2">
                      {pricingData.data.pricingConfig.components?.map((comp: any) => (
                        <div
                          key={comp.componentKey}
                          className="flex justify-between text-sm"
                        >
                          <span>{comp.componentName}</span>
                          <span className="font-mono">
                            {comp.isFrozen ? (
                              <Badge variant="secondary">
                                Frozen: ₹{comp.frozenValue}
                              </Badge>
                            ) : (
                              `${comp.calculationType}: ${comp.value}`
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleRemovePricing}
                  disabled={isRemovingPricing}
                >
                  {isRemovingPricing
                    ? "Removing..."
                    : "Remove Pricing Config (Inherit from Parent)"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <Package className="h-4 w-4" />
                  <AlertTitle>Inherits Pricing</AlertTitle>
                  <AlertDescription>
                    This subcategory currently inherits pricing from{" "}
                    {pricingData?.data?.pricingSource?.subcategoryName || "a parent"}.
                  </AlertDescription>
                </Alert>
                <Button
                  className="w-full"
                  onClick={handleCreateDefaultPricing}
                  disabled={isCreatingPricing}
                >
                  {isCreatingPricing
                    ? "Creating..."
                    : "Create Own Pricing Config"}
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPricingDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info */}
      <Alert className="bg-blue-50 border-blue-100">
        <AlertCircle className="h-4 w-4 text-blue-700" />
        <AlertTitle className="text-blue-700">Subcategory Hierarchy</AlertTitle>
        <AlertDescription className="text-blue-600">
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>
              Subcategories can be nested to any depth within a Level 4 category
            </li>
            <li>
              Pricing can be configured at any level and will be inherited by
              children
            </li>
            <li>
              Products reference subcategories directly for their pricing rules
            </li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default SubcategoriesPage;
