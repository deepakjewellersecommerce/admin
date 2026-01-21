/**
 * Category Management Page
 * List-first view with drill-down navigation to subcategories
 */

import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGetAllCategories, useUpdateCategory, useGetCategoryImpact, useDeleteCategory } from "@/lib/react-query/category-hierarchy-query";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, FolderTree, Pencil, ChevronRight, Search, AlertCircle, Trash2 } from "lucide-react";

const CategoryManagementPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [editCategory, setEditCategory] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteCategoryItem, setDeleteCategoryItem] = useState<any>(null);
  // Fetch categories (include inactive so admin can see deactivated categories)
  const { data: categoriesData, isLoading: categoriesLoading } = useGetAllCategories({ includeInactive: true });

  // Impact query for edit confirmation
  const { data: impactData, isLoading: isLoadingImpact } = useGetCategoryImpact(
    editCategory?._id || ""
  );

  // Update mutation
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory();

  // Delete mutation
  const { mutate: deleteCategory, isPending: isDeletingCategory } = useDeleteCategory();

  const handleEdit = (category: any) => {
    setEditCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      seoTitle: category.seoTitle,
      seoDescription: category.seoDescription,
    });
    setShowEditDialog(true);
  };

  const handleSubmitEdit = () => {
    if (!editCategory) return;
    setShowImpactModal(true);
  };

  const performUpdate = () => {
    updateCategory(
      { id: editCategory._id, data: formData },
      {
        onSuccess: () => {
          setShowEditDialog(false);
          setShowImpactModal(false);
          setEditCategory(null);
          setFormData({});
        },
      }
    );
  };

  const resetEdit = () => {
    setShowEditDialog(false);
    setShowImpactModal(false);
    setEditCategory(null);
    setFormData({});
  };

  const categories = useMemo(() => {
    const data = categoriesData?.data?.categories || categoriesData?.categories || [];
    return Array.isArray(data) ? data : [];
  }, [categoriesData]);

  // Debug: log counts for troubleshooting missing inactive items
  useEffect(() => {
    if (categories.length > 0) {
      const inactiveCount = categories.filter((c: any) => !c.isActive).length;
      // eslint-disable-next-line no-console
      console.debug(`Categories loaded: ${categories.length} (inactive: ${inactiveCount})`);
    }
  }, [categories]);

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter((cat: any) =>
      cat.name?.toLowerCase().includes(query) ||
      cat.fullCategoryId?.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  // Navigate to subcategories
  const handleCategoryClick = (categoryId: string) => {
    navigate(`/dashboard/catalog/categories/${categoryId}`);
  };

  const isLoading = categoriesLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-sm text-gray-500">
            Manage product categories. Click a category to view subcategories.
          </p>
        </div>
        <Link to="/dashboard/catalog/categories/add">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search categories..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {/* <div className="flex items-center gap-2">
          <Switch
            id="showInactive"
            checked={showInactive}
            onCheckedChange={(checked) => setShowInactive(checked)}
          />
          <Label htmlFor="showInactive" className="text-sm">Show inactive</Label>
        </div> */}
      </div>

      {/* Category List */}
      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
          <CardDescription>
            {filteredCategories.length} categories found (including inactive). Click a category name to view its subcategories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <FolderTree className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No categories found</p>
              <Link to="/dashboard/catalog/categories/add">
                <Button variant="link" className="mt-2">
                  Create your first category
                </Button>
              </Link>
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
                {filteredCategories.map((cat: any) => (
                  <TableRow key={cat._id} className="cursor-pointer hover:bg-gray-50">
                    <TableCell>
                      <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                        {cat.fullCategoryId || cat.idAttribute}
                      </code>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleCategoryClick(cat._id)}
                        className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {cat.name}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </TableCell>
                    <TableCell>
                      {typeof cat.materialId === "object" ? cat.materialId?.name : "-"}
                    </TableCell>
                    <TableCell>
                      {typeof cat.genderId === "object" ? cat.genderId?.name : "-"}
                    </TableCell>
                    <TableCell>
                      {typeof cat.itemId === "object" ? cat.itemId?.name : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cat.isActive ? "default" : "secondary"}>
                        {cat.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(cat);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteCategoryItem(cat);
                            setShowDeleteDialog(true);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category details. Parent hierarchy cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoTitle">SEO Title</Label>
              <Input
                id="seoTitle"
                value={formData.seoTitle || ""}
                onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                placeholder="SEO title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoDescription">SEO Description</Label>
              <Input
                id="seoDescription"
                value={formData.seoDescription || ""}
                onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                placeholder="SEO description"
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
            <Button variant="outline" onClick={resetEdit}>
              Cancel
            </Button>
            <Button onClick={handleSubmitEdit} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteCategoryItem?.name}"?
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              This action cannot be undone. If this category has subcategories or active products, deletion will be blocked.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleteCategoryItem) return;
                try {
                  await deleteCategory(deleteCategoryItem._id, {
                    onSuccess: () => {
                      setShowDeleteDialog(false);
                      setDeleteCategoryItem(null);
                    },
                  });
                } catch (err) {
                  // handled by hook toast
                }
              }}
              disabled={isDeletingCategory}
            >
              {isDeletingCategory ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <h4 className="font-medium mb-2">Changes to {editCategory?.name}</h4>
              <p className="text-sm text-muted-foreground">
                You are updating a category in the hierarchy.
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
            <Button onClick={() => { setShowImpactModal(false); performUpdate(); }}>
              Confirm Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryManagementPage;
