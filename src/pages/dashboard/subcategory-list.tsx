/**
 * Subcategory List Page
 * Shows subcategories under a category with pricing management
 * Supports infinite nesting (click subcategory to see its children)
 */

import React, { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  useGetCategory,
  useGetAllSubcategories,
  useGetSubcategory,
  useUpdateSubcategory,
  useGetSubcategoryImpact,
  useGetSubcategoryPricing,
  useUpdateSubcategoryPricing,
  useCreateDefaultSubcategoryPricing,
  useRemoveSubcategoryPricing,
  useDeleteSubcategory,
  useFreezeSubcategoryComponent,
  useUnfreezeSubcategoryComponent,
} from "@/lib/react-query/category-hierarchy-query";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Plus,
  FolderTree,
  Pencil,
  ChevronRight,
  ArrowLeft,
  Coins,
  Check,
  ArrowUpRight,
  Search,
  Lock,
  Unlock,
  Calculator,
  AlertCircle,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import {
  useGetCalculationTypes,
} from "@/lib/react-query/price-component-query";
import { useGetAllMetalPrices } from "@/lib/react-query/metal-price-query";
import { PricingComponent } from "@/lib/axios/category-hierarchy-API";

interface BreakdownComponent {
  componentKey: string;
  componentName: string;
  value: number;
  calculatedValue?: number;
}

const SubcategoryListPage = () => {
  const { categoryId, subId } = useParams<{ categoryId: string; subId?: string }>();
  const navigate = useNavigate();
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [editSubcategory, setEditSubcategory] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Pricing configuration state
  const [pricingFormData, setPricingFormData] = useState<PricingComponent[]>([]);
  const [showFreezeDialog, setShowFreezeDialog] = useState(false);
  const [freezeComponent, setFreezeComponent] = useState<string>("");
  const [freezeReason, setFreezeReason] = useState("");

  // Unsaved changes tracking for pricing form
  const [originalPricingSnapshot, setOriginalPricingSnapshot] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Preview inputs and computed breakdowns
  const [previewGrossWeight, setPreviewGrossWeight] = useState<number>(1);
  const [previewNetWeight, setPreviewNetWeight] = useState<number>(1);
  const [previewMetalRate, setPreviewMetalRate] = useState<number>(0);

  const [adminBreakdown, setAdminBreakdown] = useState<any>({ components: [], subtotal: 0, metalCost: 0, metalRate: 0 });
  const [customerBreakdown, setCustomerBreakdown] = useState<any>({ components: [], subtotal: 0, metalCost: 0, metalRate: 0 });

  // Determine if viewing category subcategories or nested subcategories
  const isNestedView = Boolean(subId);

  // Fetch parent data
  const { data: categoryData, isLoading: categoryLoading } = useGetCategory(categoryId || "");
  const { data: parentSubcategoryData, isLoading: parentSubcategoryLoading } = useGetSubcategory(subId || "");

  // Fetch subcategories
  const { data: subcategoriesData, isLoading: subcategoriesLoading } = useGetAllSubcategories({
    categoryId: categoryId,
    parentSubcategoryId: subId || null,
  });

  // Impact query for edit confirmation
  const { data: impactData, isLoading: isLoadingImpact } = useGetSubcategoryImpact(
    editSubcategory?._id || ""
  );

  // Pricing queries and mutations
  const { data: pricingData, isLoading: isLoadingPricing, refetch: refetchPricing } = useGetSubcategoryPricing(
    selectedSubcategory?._id || ""
  );
  const { data: metalPricesData } = useGetAllMetalPrices();
  const { data: calculationTypesData } = useGetCalculationTypes();

  // Auto-fill preview metal rate based on category material
  React.useEffect(() => {
    if (showPricingDialog && previewMetalRate === 0) {
      const prices = metalPricesData?.data?.prices || metalPricesData?.prices || [];
      const metalType = category?.materialId?.metalType;
      
      if (metalType && prices.length > 0) {
        const metalPrice = prices.find((p: any) => p.metalType === metalType);
        if (metalPrice) {
          setPreviewMetalRate(metalPrice.pricePerGram);
        }
      }
    }
  }, [showPricingDialog, metalPricesData, category, previewMetalRate]);

  const { mutate: updatePricing, isPending: isUpdatingPricing } = useUpdateSubcategoryPricing();
  const { mutate: createDefaultPricing, isPending: isCreatingDefaultPricing } = useCreateDefaultSubcategoryPricing();
  const { mutate: removePricing, isPending: isRemovingPricing } = useRemoveSubcategoryPricing();

  // Freeze/unfreeze mutations
  const { mutate: freezeSubcategoryComponent, isPending: isFreezing } = useFreezeSubcategoryComponent();
  const { mutate: unfreezeSubcategoryComponent, isPending: isUnfreezing } = useUnfreezeSubcategoryComponent();


  // Update pricing form data when pricing data loads
  React.useEffect(() => {
    const components = pricingData?.data?.pricingConfig?.components || pricingData?.pricingConfig?.components;
    if (components && showPricingDialog) {
      setPricingFormData([...components]);
      const snap = JSON.stringify(components);
      setOriginalPricingSnapshot(snap);
      setHasUnsavedChanges(false);
    }
  }, [pricingData, showPricingDialog]);

  // Update mutation
  const { mutate: updateSubcategory, isPending: isUpdating } = useUpdateSubcategory();
  const { mutate: deleteSubcategory, isPending: isDeleting } = useDeleteSubcategory();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any>(null);

  const handleConfirmDelete = (force = false) => {
    if (!deleteItem) return;
    deleteSubcategory({ id: deleteItem._id, force }, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        setDeleteItem(null);
      },
      onError: (error: any) => {
        console.error(error);
      }
    });
  };

  const handleEdit = (subcategory: any) => {
    setEditSubcategory(subcategory);
    setFormData({
      name: subcategory.name,
      slug: subcategory.slug,
      description: subcategory.description,
      imageUrl: subcategory.imageUrl,
      isActive: subcategory.isActive,
      sortOrder: subcategory.sortOrder,
      seoTitle: subcategory.seoTitle,
      seoDescription: subcategory.seoDescription,
    });
    setShowEditDialog(true);
  };

  const handleSubmitEdit = () => {
    if (!editSubcategory) return;
    setShowImpactModal(true);
  };

  const performUpdate = () => {
    updateSubcategory(
      { id: editSubcategory._id, data: formData },
      {
        onSuccess: () => {
          setShowEditDialog(false);
          setShowImpactModal(false);
          setEditSubcategory(null);
          setFormData({});
        },
      }
    );
  };

  const resetEdit = () => {
    setShowEditDialog(false);
    setShowImpactModal(false);
    setEditSubcategory(null);
    setFormData({});
  };

  // Get parent info for display
  const category = categoryData?.data?.category || categoryData?.category;
  const parentSubcategory = parentSubcategoryData?.data?.subcategory || parentSubcategoryData?.subcategory;

  // Get subcategories list
  const subcategories = useMemo(() => {
    const data = subcategoriesData?.data?.subcategories || subcategoriesData?.subcategories || [];
    return Array.isArray(data) ? data : [];
  }, [subcategoriesData]);

  // Filter by search
  const filteredSubcategories = useMemo(() => {
    if (!searchQuery.trim()) return subcategories;
    const query = searchQuery.toLowerCase();
    return subcategories.filter((sub: any) =>
      sub.name?.toLowerCase().includes(query) ||
      sub.fullCategoryId?.toLowerCase().includes(query)
    );
  }, [subcategories, searchQuery]);

  // Pricing configuration helpers
  // calculationTypes comes from API response -> response.data -> { types }
  const calculationTypes = calculationTypesData?.data?.types || [];

  const pricingSource = pricingData?.data?.pricingSource || pricingData?.pricingSource || null;
  const hasCustomPricing = selectedSubcategory?.hasPricingConfig || false;

  // Build breadcrumb
  const breadcrumb = useMemo(() => {
    const crumbs = [{ label: "Categories", href: "/dashboard/catalog/categories" }];

    if (category) {
      crumbs.push({
        label: category.name,
        href: `/dashboard/catalog/categories/${categoryId}`,
      });
    }

    if (parentSubcategory) {
      crumbs.push({
        label: parentSubcategory.name,
        href: `/dashboard/catalog/categories/${categoryId}/${subId}`,
      });
    }

    return crumbs;
  }, [category, parentSubcategory, categoryId, subId]);

  // Navigate to nested subcategories
  const handleSubcategoryClick = (subcategoryId: string) => {
    navigate(`/dashboard/catalog/categories/${categoryId}/${subcategoryId}`);
  };

  // Open pricing dialog
  const handlePricingClick = (subcategory: any) => {
    setSelectedSubcategory(subcategory);
    // Initialize with current pricing config or empty array
    const currentConfig = pricingData?.data?.pricingConfig?.components || pricingData?.pricingConfig?.components || [];
    setPricingFormData([...currentConfig]);

    // Auto-fill preview metal rate based on category material
    const prices = metalPricesData?.data?.prices || metalPricesData?.prices || [];
    if (category?.materialId?.metalType && prices.length > 0) {
      const metalType = category.materialId.metalType;
      const metalPrice = prices.find((p: any) => p.metalType === metalType);
      if (metalPrice) {
        setPreviewMetalRate(metalPrice.pricePerGram);
      }
    }

    setShowPricingDialog(true);
  };

  // Pricing configuration handlers
  const handlePricingComponentChange = (componentKey: string, field: string, value: any) => {
    setPricingFormData(prev => {
      const updated = prev.map(comp => {
        if (comp.componentKey === componentKey) {
          const updatedComp = { ...comp, [field]: value };
          // Auto-fill current metal rate when switching to MANUAL mode
          if (field === "metalPriceMode" && value === "MANUAL") {
            // Fill from preview rate if manual price is empty or 0
            if (!updatedComp.manualMetalPrice || updatedComp.manualMetalPrice === 0) {
              updatedComp.manualMetalPrice = previewMetalRate || 0;
            }
          }
          return updatedComp;
        }
        return comp;
      });

      // Mark unsaved changes by comparing snapshot
      try {
        setHasUnsavedChanges(JSON.stringify(updated) !== originalPricingSnapshot);
      } catch (e) {
        setHasUnsavedChanges(true);
      }

      return updated;
    });

    if (field === "isVisible") {
      toast.info("Component visibility changed locally — remember to Save Configuration");
    }
  };

  const handleFreezeComponent = (componentKey: string) => {
    setFreezeComponent(componentKey);
    setShowFreezeDialog(true);
  };

  const handleUnfreezeComponent = (componentKey: string) => {
    if (!selectedSubcategory) return;
    unfreezeSubcategoryComponent({ id: selectedSubcategory._id, componentKey }, {
      onSuccess: () => {
        refetchPricing();
      },
      onError: (error: any) => {
        const reason = error?.response?.data?.error?.message || error?.message || "Failed to unfreeze component";
        toast.error(reason);
      }
    });
  };

  const handleCreateDefaultPricing = () => {
    if (!selectedSubcategory) return;

    createDefaultPricing(selectedSubcategory._id, {
      onSuccess: () => {
        refetchPricing();
      },
      onError: (error) => {
        console.error(error);
      }
    });
  };

  const handleRemoveCustomPricing = () => {
    if (!selectedSubcategory) return;

    removePricing(selectedSubcategory._id, {
      onSuccess: () => {
        setPricingFormData([]);
        setOriginalPricingSnapshot(null);
        setHasUnsavedChanges(false);
        refetchPricing();
      },
      onError: (error) => {
        console.error(error);
      }
    });
  };

  const handleSavePricing = () => {
    if (!selectedSubcategory) return;

    // Sanitize components
    const sanitized = pricingFormData.map((c: any) => ({
      componentId: c.componentId,
      componentKey: c.componentKey,
      componentName: c.componentName,
      calculationType: c.calculationType,
      value: c.value ?? 0,
      percentageOf: c.percentageOf ?? "metalCost",
      metalPriceMode: c.metalPriceMode ?? null,
      manualMetalPrice: c.manualMetalPrice ?? null,
      isFrozen: c.isFrozen ?? false,
      frozenValue: c.frozenValue ?? null,
      isActive: c.isActive ?? true,
      isVisible: c.isVisible ?? true,
      sortOrder: c.sortOrder ?? 0,
    }));

    updatePricing({
      id: selectedSubcategory._id,
      components: sanitized
    }, {
      onSuccess: () => {
        // Persist our current local snapshot as the canonical state
        try {
          setOriginalPricingSnapshot(JSON.stringify(sanitized));
        } catch (e) {
          setOriginalPricingSnapshot(null);
        }
        setHasUnsavedChanges(false);
        refetchPricing();
        setShowPricingDialog(false);
      },
      onError: (error) => {
        console.error(error);
      }
    });
  };

  const calculateComponentValueLocal = useCallback((component: any, context: any) => {
    const { netWeight, metalRate, metalCost, subtotal } = context;

    // Special handling for metal_cost component
    if (component.componentKey === "metal_cost") {
      if (component.metalPriceMode === "MANUAL" && component.manualMetalPrice) {
        return component.manualMetalPrice * netWeight;
      }
      return netWeight * metalRate; // AUTO mode
    }

    const type = component.calculationType;
    switch (type) {
      case "PER_GRAM":
        return netWeight * (component.value || 1);
      case "PERCENTAGE":
        {
          const base = component.percentageOf === "subtotal" ? subtotal : metalCost;
          return (base * (component.value || 0)) / 100;
        }
      case "FIXED":
        return component.value || 0;
      default:
        return 0;
    }
  }, []);

  const computeBreakdown = useCallback((components: any[], gross: number, net: number, rate: number, isCustomerView = false) => {
    let subtotal = 0;
    let metalCost = 0;
    let hiddenValueTotal = 0;
    let metalCostIndex = -1;

    const sorted = [...components].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const comps: any[] = [];
    for (const comp of sorted) {
      if (!comp.isActive) continue;
      let calculatedValue = comp.isFrozen ? comp.frozenValue : calculateComponentValueLocal(comp, { grossWeight: gross, netWeight: net, metalRate: rate, metalCost, subtotal });
      calculatedValue = Math.round(calculatedValue * 100) / 100;

      // Track metalCost from metal_cost component
      if (comp.componentKey === "metal_cost") {
        metalCost = calculatedValue;
        metalCostIndex = comps.length;
      }

      // Use calculatedValue instead of overwriting value (preserves original config)
      comps.push({ ...comp, calculatedValue });
      subtotal += calculatedValue;
    }

    // Merge hidden components into metal_cost for customer view consistency
    if (isCustomerView && metalCostIndex !== -1) {
      for (let i = 0; i < comps.length; i++) {
        const comp = comps[i];
        if (comp.componentKey !== "metal_cost" && !comp.isVisible) {
          hiddenValueTotal += comp.calculatedValue;
          comp.calculatedValue = 0;
        }
      }

      if (hiddenValueTotal > 0) {
        comps[metalCostIndex].calculatedValue = Math.round((comps[metalCostIndex].calculatedValue + hiddenValueTotal) * 100) / 100;
        metalCost = comps[metalCostIndex].calculatedValue;
      }
    }

    subtotal = Math.round(subtotal * 100) / 100;
    metalCost = Math.round(metalCost * 100) / 100;

    // For customer view, filter out hidden components (which now have 0 value)
    const finalComponents = isCustomerView
      ? comps.filter(c => c.isVisible || c.componentKey === "metal_cost")
      : comps;

    return { components: finalComponents, subtotal, metalCost, metalRate: rate };
  }, [calculateComponentValueLocal]);

  React.useEffect(() => {
    const comps = pricingFormData || [];
    const admin = computeBreakdown(comps, previewGrossWeight, previewNetWeight, previewMetalRate, false);
    const customer = computeBreakdown(comps, previewGrossWeight, previewNetWeight, previewMetalRate, true);
    setAdminBreakdown(admin);
    setCustomerBreakdown(customer);
  }, [pricingFormData, previewGrossWeight, previewNetWeight, previewMetalRate, computeBreakdown]);

  const isLoading = categoryLoading || subcategoriesLoading || (isNestedView && parentSubcategoryLoading);
  const parentName = isNestedView ? parentSubcategory?.name : category?.name;

  // Build add subcategory URL
  const addSubcategoryUrl = subId
    ? `/dashboard/catalog/categories/${categoryId}/${subId}/add`
    : `/dashboard/catalog/categories/${categoryId}/add`;

  return (
    <div className="space-y-6">
      {/* Header with Breadcrumb */}
      <div>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          {breadcrumb.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <ChevronRight className="h-4 w-4" />}
              <Link to={crumb.href} className="hover:text-blue-600 hover:underline">
                {crumb.label}
              </Link>
            </span>
          ))}
        </div>

        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">
                {parentName ? `${parentName} Subcategories` : "Subcategories"}
              </h1>
            </div>
            {category && (
              <p className="text-sm text-gray-500 ml-10">
                Parent: {category.materialId?.name} &gt; {category.genderId?.name} &gt; {category.itemId?.name} &gt; {category.name}
                {parentSubcategory && ` > ${parentSubcategory.name}`}
              </p>
            )}
          </div>

          <Link to={addSubcategoryUrl}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Subcategory
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search subcategories..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Subcategory List */}
      <Card>
        <CardHeader>
          <CardTitle>Subcategories</CardTitle>
          <CardDescription>
            {filteredSubcategories.length} subcategories found. Click a name to view nested subcategories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredSubcategories.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <FolderTree className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No subcategories found</p>
              <Link to={addSubcategoryUrl}>
                <Button variant="link" className="mt-2">
                  Create your first subcategory
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubcategories.map((sub: any) => (
                  <TableRow key={sub._id} className="hover:bg-gray-50">
                    <TableCell>
                      <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                        {sub.fullCategoryId || sub.idAttribute}
                      </code>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleSubcategoryClick(sub._id)}
                        className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {sub.name}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </TableCell>
                    <TableCell>
                      {sub.hasPricingConfig ? (
                        <Badge variant="default" className="gap-1">
                          <Check className="h-3 w-3" /> Configured
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <ArrowUpRight className="h-3 w-3" /> Inherited
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-600">{sub.productCount || 0}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={sub.isActive ? "default" : "secondary"}>
                        {sub.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip content="Configure Pricing">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePricingClick(sub)}
                            aria-label="Configure Pricing"
                          >
                            <Coins className="h-4 w-4" />
                          </Button>
                        </Tooltip>

                        <Tooltip content="Edit">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(sub)}
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Tooltip>

                        <Tooltip content="Delete">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setDeleteItem(sub); setShowDeleteDialog(true); }}
                            className="text-destructive hover:text-destructive"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
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
              This action cannot be undone. If this subcategory has nested subcategories or products, deletion will be blocked (or use Force Delete to remove descendants).
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
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
              {isDeleting ? "Deleting..." : "Force Delete All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subcategory</DialogTitle>
            <DialogDescription>
              Update subcategory details. Hierarchy cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Diamond Rings"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug || ""}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., diamond-rings"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows={3}
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
              <Textarea
                id="seoDescription"
                value={formData.seoDescription || ""}
                onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                placeholder="SEO description"
                rows={2}
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
              {isUpdating ? "Updating..." : "Update Subcategory"}
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
              <h4 className="font-medium mb-2">Changes to {editSubcategory?.name}</h4>
              <p className="text-sm text-muted-foreground">
                You are updating a subcategory in the hierarchy.
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
                      {impactData.impact.childSubcategoriesCount || 0}
                    </div>
                    <div className="text-sm text-green-600">Child Subcategories</div>
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

      {/* Pricing Dialog */}
      <Dialog open={showPricingDialog} onOpenChange={setShowPricingDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Pricing Configuration
            </DialogTitle>
            <DialogDescription>
              Configure pricing for "{selectedSubcategory?.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto space-y-4 px-4 pt-3 pb-6">
            {/* Pricing Source Info */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    {hasCustomPricing ? "Custom Pricing Configuration" : "Inherits Pricing Configuration"}
                  </p>
                  <p className="text-xs text-blue-700">
                    {hasCustomPricing
                      ? "This subcategory has its own pricing rules"
                      : `Inherits from: ${pricingSource?.subcategoryName || "Parent Category"}`
                    }
                  </p>
                </div>
                <div className="flex gap-2">
                  {!hasCustomPricing && (
                    <Button
                      size="sm"
                      onClick={handleCreateDefaultPricing}
                      disabled={isCreatingDefaultPricing}
                    >
                      {isCreatingDefaultPricing ? "Creating..." : "Create Custom Pricing"}
                    </Button>
                  )}
                  {hasCustomPricing && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRemoveCustomPricing}
                      disabled={isRemovingPricing}
                    >
                      {isRemovingPricing ? "Removing..." : "Remove Custom Pricing"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing Components Table */}
            <div className="flex-1 overflow-auto border rounded-lg">
              {isLoadingPricing ? (
                <div className="p-8 text-center">
                  <Skeleton className="h-8 w-64 mx-auto mb-4" />
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                </div>
              ) : pricingFormData.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No Pricing Components</p>
                  <p className="text-sm">
                    {hasCustomPricing
                      ? "Add pricing components to define how this subcategory calculates prices"
                      : "This subcategory inherits pricing from its parent"
                    }
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pricingFormData.map((component) => (
                      <TableRow key={component.componentKey}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{component.componentName}</p>
                            <p className="text-xs text-gray-500">{component.componentKey}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {component.componentKey === "metal_cost" ? (
                            <Select
                              value={component.metalPriceMode || "AUTO"}
                              onValueChange={(value) =>
                                handlePricingComponentChange(component.componentKey, "metalPriceMode", value)
                              }
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="AUTO">Auto (System Rate)</SelectItem>
                                <SelectItem value="MANUAL">Manual Price</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Select
                                value={component.calculationType}
                                onValueChange={(value) =>
                                  handlePricingComponentChange(component.componentKey, "calculationType", value)
                                }
                              >
                                <SelectTrigger className="w-28">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {calculationTypes.map((type: any) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.key}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {component.calculationType === "PERCENTAGE" && (
                                <Select
                                  value={component.percentageOf || "metalCost"}
                                  onValueChange={(value) =>
                                    handlePricingComponentChange(component.componentKey, "percentageOf", value)
                                  }
                                >
                                  <SelectTrigger className="w-28">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="metalCost">of Metal Cost</SelectItem>
                                    <SelectItem value="subtotal">of Subtotal</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {component.componentKey === "metal_cost" && component.metalPriceMode === "MANUAL" ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                step="0.01"
                                value={component.manualMetalPrice || ""}
                                onChange={(e) =>
                                  handlePricingComponentChange(
                                    component.componentKey,
                                    "manualMetalPrice",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-24"
                                placeholder="₹/gram"
                              />
                              <span className="text-xs text-gray-500">/g</span>
                            </div>
                          ) : component.componentKey === "metal_cost" ? (
                            <span className="text-sm text-gray-500">System Rate</span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                step="0.01"
                                value={component.value || 0}
                                onChange={(e) =>
                                  handlePricingComponentChange(
                                    component.componentKey,
                                    "value",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-20"
                              />
                              <span className="text-xs text-gray-500">
                                {component.calculationType === "PERCENTAGE" ? "%" : component.calculationType === "FIXED" ? "₹" : "/g"}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {component.isFrozen ? (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Lock className="h-3 w-3" />
                                Frozen
                              </Badge>
                            ) : component.isActive ? (
                              <Badge variant="default">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}

                            {!component.isVisible && (
                              <Badge variant="outline" className="flex items-center gap-1 text-xs ml-2">
                                <EyeOff className="h-3 w-3" />
                                Hidden
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 items-center">
                            {component.isFrozen ? (
                              <Tooltip content="Unfreeze component (restore dynamic calculation)">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUnfreezeComponent(component.componentKey)}
                                  disabled={isUnfreezing}
                                  aria-label={`Unfreeze ${component.componentName || component.componentKey}`}
                                >
                                  <Unlock className="h-4 w-4" />
                                </Button>
                              </Tooltip>
                            ) : (
                              <Tooltip content="Freeze component (lock current calculated value)">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleFreezeComponent(component.componentKey)}
                                  disabled={isFreezing}
                                  aria-label={`Freeze ${component.componentName || component.componentKey}`}
                                >
                                  <Lock className="h-4 w-4" />
                                </Button>
                              </Tooltip>
                            )}

                            {/* Visibility toggle: shows Eye/EyeOff and updates local state; saved on Save Configuration */}
                            <Tooltip content={component.isVisible ? "Hide component from customers" : "Show component to customers"}>
                              <Button
                                size="sm"
                                variant={component.isVisible ? "outline" : "ghost"}
                                onClick={() =>
                                  handlePricingComponentChange(component.componentKey, "isVisible", !component.isVisible)
                                }
                                aria-label={component.isVisible ? `Hide ${component.componentName || component.componentKey} from customers` : `Show ${component.componentName || component.componentKey} to customers`}
                              >
                                {component.isVisible ? (
                                  <Eye className="h-4 w-4 text-green-500" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                )}
                              </Button>
                            </Tooltip>

                            <Tooltip content={component.isActive ? "Disable component calculation" : "Enable component calculation"}>
                              <div aria-label={component.isActive ? `Disable ${component.componentName || component.componentKey}` : `Enable ${component.componentName || component.componentKey}`}>
                                <Switch
                                  checked={component.isActive}
                                  onCheckedChange={(checked) =>
                                    handlePricingComponentChange(component.componentKey, "isActive", checked)
                                  }
                                />
                              </div>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Price Breakdown Preview */}
            <div className="mt-6 p-4 border rounded-lg bg-white">
              <h4 className="text-sm font-medium mb-3">Live Price Preview</h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label>Gross Weight (g)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={previewGrossWeight}
                    onChange={(e) => setPreviewGrossWeight(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Net Weight (g)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={previewNetWeight}
                    onChange={(e) => setPreviewNetWeight(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Metal Rate (₹/g)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={previewMetalRate}
                    onChange={(e) => setPreviewMetalRate(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-sm font-medium mb-2">Admin View (all components)</h5>
                  <div className="bg-gray-50 p-3 rounded border">
                    {(adminBreakdown.components as any[]).map((c) => (
                      <div key={c.componentKey} className="flex justify-between text-sm py-1">
                        <span className="text-gray-700">{c.componentName}</span>
                        <span className="font-mono">₹{(c.calculatedValue ?? 0).toFixed(2)}</span>
                      </div>
                    ))}
                    <hr className="my-2" />
                    <div className="flex justify-between font-medium">
                      <span>Metal Cost</span>
                      <span className="font-mono">₹{adminBreakdown.metalCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Subtotal</span>
                      <span className="font-mono">₹{adminBreakdown.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold mt-2">
                      <span>Total</span>
                      <span className="font-mono">₹{(adminBreakdown.subtotal).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium mb-2">Customer View (visible components)</h5>
                  <div className="bg-gray-50 p-3 rounded border">
                    {(customerBreakdown.components as any[]).map((c) => (
                      <div key={c.componentKey} className="flex justify-between text-sm py-1">
                        <span className="text-gray-700">{c.componentName}</span>
                        <span className="font-mono">₹{(c.calculatedValue ?? 0).toFixed(2)}</span>
                      </div>
                    ))}
                    <hr className="my-2" />
                    <div className="flex justify-between font-medium">
                      <span>Metal Cost</span>
                      <span className="font-mono">₹{customerBreakdown.metalCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Subtotal</span>
                      <span className="font-mono">₹{customerBreakdown.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold mt-2">
                      <span>Total</span>
                      <span className="font-mono">₹{(customerBreakdown.subtotal).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="py-3 border-t">
            <div className="flex w-full items-center justify-end gap-3">
              {/* Unsaved changes indicator */}
              {hasUnsavedChanges && (
                <div className="flex items-center text-sm text-amber-600 mr-auto">
                  <span className="h-2 w-2 bg-amber-500 rounded-full mr-2 inline-block" />
                  Unsaved changes
                </div>
              )}

              <Button variant="outline" onClick={() => setShowPricingDialog(false)}>
                Cancel
              </Button>
              <Tooltip content="Save pricing configuration">
                <Button
                  onClick={handleSavePricing}
                  disabled={isUpdatingPricing || pricingFormData.length === 0 || !hasUnsavedChanges}
                  aria-label="Save pricing configuration"
                >
                  {isUpdatingPricing ? "Saving..." : "Save Configuration"}
                </Button>
              </Tooltip>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Freeze Component Dialog */}
      <Dialog open={showFreezeDialog} onOpenChange={setShowFreezeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Freeze Pricing Component</DialogTitle>
            <DialogDescription>
              Freezing locks the current calculated value and prevents changes from metal rate updates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="freezeReason">Reason for Freezing *</Label>
              <Textarea
                id="freezeReason"
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                placeholder="e.g., Special promotion pricing, Bulk order discount"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFreezeDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedSubcategory || !freezeComponent) return;
                freezeSubcategoryComponent(
                  { id: selectedSubcategory._id, componentKey: freezeComponent, reason: freezeReason },
                  {
                    onSuccess: () => {
                      setShowFreezeDialog(false);
                      setFreezeReason("");
                      setFreezeComponent("");
                      refetchPricing();
                    },
                    onError: (error: any) => {
                      console.error(error);
                    }
                  }
                );
              }}
              disabled={!freezeReason.trim() || isFreezing}
            >
              {isFreezing ? "Freezing..." : "Freeze Component"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubcategoryListPage;
