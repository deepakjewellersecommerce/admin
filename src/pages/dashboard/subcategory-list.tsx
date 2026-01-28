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
import { FormulaBuilder } from "@/components/formula-builder";
import {
  useGetCalculationTypes,
  useGetFormulaVariables,
  useValidateFormula,
  useGetAllComponents,
} from "@/lib/react-query/price-component-query";
import { PricingComponent } from "@/lib/axios/category-hierarchy-API";

interface BreakdownComponent {
  componentKey: string;
  componentName: string;
  value: number;
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
  const [showAddComponentDialog, setShowAddComponentDialog] = useState(false);
  const [showInheritanceWarning, setShowInheritanceWarning] = useState(false);
  const [freezeComponent, setFreezeComponent] = useState<string>("");
  const [freezeReason, setFreezeReason] = useState("");
  const [formulaError, setFormulaError] = useState<string | null>(null);

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
  const { data: calculationTypesData } = useGetCalculationTypes();
  const { data: formulaVariablesData } = useGetFormulaVariables();
  const { data: allComponentsData, isLoading: isLoadingAllComponents, error: allComponentsError } = useGetAllComponents({ includeInactive: true });

  // Debug: log allComponentsData to see what's being returned
  React.useEffect(() => {
    if (allComponentsError) {
      console.error("Error loading price components:", allComponentsError);
    }
    console.log("allComponentsData:", allComponentsData);
    console.log("allComponents array:", allComponentsData?.components);
  }, [allComponentsData, allComponentsError]);

  const { mutate: updatePricing, isPending: isUpdatingPricing } = useUpdateSubcategoryPricing();
  const { mutate: createDefaultPricing, isPending: isCreatingDefaultPricing } = useCreateDefaultSubcategoryPricing();
  const { mutate: removePricing, isPending: isRemovingPricing } = useRemoveSubcategoryPricing();
  const { mutate: validateFormula } = useValidateFormula();

  // Freeze/unfreeze mutations
  const { mutate: freezeSubcategoryComponent, isPending: isFreezing } = useFreezeSubcategoryComponent();
  const { mutate: unfreezeSubcategoryComponent, isPending: isUnfreezing } = useUnfreezeSubcategoryComponent();


  // Update pricing form data when pricing data loads
  // API returns: { pricingConfig: {...}, pricingSource: {...}, hasOwnConfig: boolean }
  React.useEffect(() => {
    const components = pricingData?.pricingConfig?.components;
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
        const reason =
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          (typeof error?.response?.data === "string" ? error.response.data : null) ||
          error?.message ||
          "Failed to delete subcategory";
        toast.error(`Failed to delete subcategory: ${reason}`);
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
  const formulaVariables = formulaVariablesData?.data?.variables || [];
  const operators = formulaVariablesData?.data?.operators || ["+", "-", "×", "÷", "(", ")"];
  const allComponents = allComponentsData?.components || [];

  // Filter out components that are already in pricingFormData
  const availableComponentsToAdd = useMemo(() => {
    const existingKeys = new Set(pricingFormData.map(c => c.componentKey));
    return allComponents.filter((c: any) => !existingKeys.has(c.key));
  }, [allComponents, pricingFormData]);

  const pricingSource = pricingData?.pricingSource || null;
  // Use API response for accurate state (hasOwnConfig), fallback to subcategory document
  const hasCustomPricing = pricingData?.hasOwnConfig ?? selectedSubcategory?.hasPricingConfig ?? false;

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
  // Note: pricingFormData is populated by the useEffect when pricingData loads
  const handlePricingClick = (subcategory: any) => {
    setSelectedSubcategory(subcategory);
    // Clear current form data - will be populated by useEffect when pricingData loads
    setPricingFormData([]);
    setOriginalPricingSnapshot(null);
    setHasUnsavedChanges(false);
    setShowPricingDialog(true);
  };

  // Normalize legacy formulas when components load
  React.useEffect(() => {
    if (!pricingFormData.length) return;

    // Check if any wastage_charges needs normalization
    const needsNormalization = pricingFormData.some((c: any) =>
      c.componentKey === "wastage_charges" &&
      c.calculationType === "FORMULA" &&
      /grossWeight.*netWeight.*metalRate/i.test(c.formula || "")
    );

    if (needsNormalization) {
      const normalized = pricingFormData.map((c: any) => {
        if (c.componentKey === "wastage_charges" && c.calculationType === "FORMULA") {
          const formula = (c.formula || "").toString();
          if (/grossWeight.*netWeight.*metalRate/i.test(formula)) {
            return {
              ...c,
              _legacyFormula: formula,
              calculationType: "PERCENTAGE",
              value: c.value ?? 5,
              formula: null,
            };
          }
        }
        return c;
      });
      setPricingFormData(normalized);
    }
  }, [pricingFormData.length]); // Only run when components first load

  // Pricing configuration handlers
  const handlePricingComponentChange = (componentKey: string, field: string, value: any) => {
    setPricingFormData(prev => {
      const updated = prev.map(comp =>
        comp.componentKey === componentKey
          ? { ...comp, [field]: value }
          : comp
      );

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

  // Handler to add a new component to pricingFormData
  const handleAddComponentToPricing = (component: any) => {
    // Calculate next sortOrder
    const maxSortOrder = pricingFormData.length > 0
      ? Math.max(...pricingFormData.map(c => c.sortOrder || 0))
      : -1;

    const newComponent: PricingComponent = {
      componentId: component._id, // Required by backend
      componentKey: component.key,
      componentName: component.name,
      calculationType: component.calculationType || "FIXED",
      value: component.defaultValue || 0,
      formula: component.formula || null,
      percentageOf: component.percentageOf || "metalCost",
      isFrozen: false,
      isActive: component.isActive !== false,
      isVisible: component.isVisible !== false,
      sortOrder: maxSortOrder + 1,
    };

    setPricingFormData(prev => {
      const updated = [...prev, newComponent];
      setHasUnsavedChanges(true);
      return updated;
    });

    setShowAddComponentDialog(false);
    toast.success(`Added "${component.name}" component`);
  };

  // Handler to remove a component from pricingFormData
  const handleRemoveComponentFromPricing = (componentKey: string) => {
    setPricingFormData(prev => {
      const updated = prev.filter(c => c.componentKey !== componentKey);
      setHasUnsavedChanges(true);
      return updated;
    });
    toast.info("Component removed — remember to Save Configuration");
  };

  const handleFreezeComponent = (componentKey: string) => {
    setFreezeComponent(componentKey);
    setShowFreezeDialog(true);
  };

  // Toggle Advanced formula mode for a component (switch to/from FORMULA)
  const handleToggleAdvanced = (componentKey: string) => {
    const defaultWastageFormula = "(grossWeight - netWeight) * metalRate * 0.05";
    setPricingFormData(prev => {
      const updated = prev.map(comp => {
        if (comp.componentKey !== componentKey) return comp;

        if (comp.calculationType !== "FORMULA") {
          return {
            ...comp,
            _prevCalculationType: comp.calculationType,
            _prevValue: comp.value,
            calculationType: "FORMULA",
            formula: comp.formula || defaultWastageFormula,
          };
        }

        // restore
        return {
          ...comp,
          calculationType: (comp as any)._prevCalculationType || "PERCENTAGE",
          value: (comp as any)._prevValue !== undefined ? (comp as any)._prevValue : comp.value || 0,
        };
      });

      try {
        setHasUnsavedChanges(JSON.stringify(updated) !== originalPricingSnapshot);
      } catch (e) {
        setHasUnsavedChanges(true);
      }

      return updated;
    });
  };

  const handleUnfreezeComponent = (componentKey: string) => {
    if (!selectedSubcategory) return;
    unfreezeSubcategoryComponent({ id: selectedSubcategory._id, componentKey }, {
      onSuccess: () => {
        toast.success(`Component ${componentKey} unfrozen`);
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
        toast.success("Default pricing configuration created");
        refetchPricing();
      },
      onError: (error) => {
        toast.error("Failed to create default pricing");
        console.error(error);
      }
    });
  };

  const handleRemoveCustomPricing = () => {
    if (!selectedSubcategory) return;

    removePricing(selectedSubcategory._id, {
      onSuccess: () => {
        toast.success("Custom pricing removed, now inheriting from parent");
        setPricingFormData([]);
        setOriginalPricingSnapshot(null);
        setHasUnsavedChanges(false);
        refetchPricing();
      },
      onError: (error) => {
        toast.error("Failed to remove custom pricing");
        console.error(error);
      }
    });
  };

  // Check if user is about to break inheritance and show warning
  const handleSavePricing = () => {
    if (!selectedSubcategory) return;

    // If subcategory doesn't have custom pricing, show warning first
    if (!hasCustomPricing) {
      setShowInheritanceWarning(true);
      return;
    }

    // Otherwise save directly
    doSavePricing();
  };

  // Actual save logic
  const doSavePricing = () => {
    if (!selectedSubcategory) return;

    // Sanitize components: remove any internal temporary keys
    const sanitized = pricingFormData.map((c: any) => {
      const rest = { ...c };
      delete rest._prevCalculationType;
      delete rest._prevValue;
      delete rest._legacyFormula;
      // ensure numeric values exist and formula is null when not used
      return {
        ...rest,
        value: rest.value ?? 0,
        formula: rest.formula ?? null,
      };
    });

    updatePricing({
      id: selectedSubcategory._id,
      components: sanitized
    }, {
      onSuccess: () => {
        toast.success("Pricing configuration updated");
        // Persist our current local snapshot as the canonical state
        try {
          setOriginalPricingSnapshot(JSON.stringify(sanitized));
        } catch (e) {
          setOriginalPricingSnapshot(null);
        }
        setHasUnsavedChanges(false);
        setShowInheritanceWarning(false);
        // Update the local state to reflect that subcategory now has custom pricing
        if (selectedSubcategory) {
          setSelectedSubcategory({ ...selectedSubcategory, hasPricingConfig: true });
        }
        refetchPricing();
      },
      onError: (error: any) => {
        const errorMsg = error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update pricing configuration";
        toast.error(errorMsg);
        console.error(error);
      }
    });
  };

  const handleValidateFormula = (formula: string) => {
    if (!formula) {
      setFormulaError(null);
      return;
    }

    validateFormula({ formula }, {
      onSuccess: (result) => {
        if (result.valid) {
          setFormulaError(null);
        } else {
          setFormulaError(result.errors?.join(", ") || "Invalid formula");
        }
      },
      onError: () => {
        setFormulaError("Failed to validate formula");
      }
    });
  };

  const evaluateFormulaSafe = (formula: string, context: any) => {
    if (!formula) return 0;
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function("grossWeight", "netWeight", "metalRate", "metalCost", "subtotal", `return (${formula});`);
      const res = fn(context.grossWeight, context.netWeight, context.metalRate, context.metalCost, context.subtotal);
      return Number(res) || 0;
    } catch (e) {
      return 0;
    }
  };

  const calculateComponentValueLocal = useCallback((component: any, context: any) => {
    const { grossWeight, netWeight, metalRate, metalCost, subtotal } = context;
    const type = component.calculationType;
    switch (type) {
      case "PER_GRAM":
        return netWeight * metalRate * (component.value || 1);
      case "PERCENTAGE":
        {
          let base = metalCost;
          if (component.percentageOf === "subtotal") base = subtotal;
          else if (component.percentageOf === "grossWeight") base = grossWeight * metalRate;
          else if (component.percentageOf === "netWeight") base = netWeight * metalRate;
          return (base * (component.value || 0)) / 100;
        }
      case "FIXED":
        return component.value || 0;
      case "FORMULA":
        return evaluateFormulaSafe(component.formula || "", context);
      default:
        return 0;
    }
  }, []);

  const computeBreakdown = useCallback((components: any[], gross: number, net: number, rate: number) => {
    const metalCost = Math.round(net * rate * 100) / 100;
    let subtotal = 0;
    const sorted = [...components].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const comps: any[] = [];
    for (const comp of sorted) {
      if (!comp.isActive) continue;
      let value = comp.isFrozen ? comp.frozenValue : calculateComponentValueLocal(comp, { grossWeight: gross, netWeight: net, metalRate: rate, metalCost, subtotal });
      value = Math.round(value * 100) / 100;
      comps.push({ ...comp, value });
      subtotal += value;
    }
    subtotal = Math.round(subtotal * 100) / 100;
    return { components: comps, subtotal, metalCost, metalRate: rate };
  }, [calculateComponentValueLocal]);

  React.useEffect(() => {
    const comps = pricingFormData || [];
    const admin = computeBreakdown(comps, previewGrossWeight, previewNetWeight, previewMetalRate);
    const visibleComps = admin.components.filter((c: any) => c.isVisible);
    const customer = computeBreakdown(visibleComps, previewGrossWeight, previewNetWeight, previewMetalRate);
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

            {/* Pricing Components Header with Add Button */}
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Pricing Components</h4>
              {hasCustomPricing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddComponentDialog(true)}
                  disabled={isLoadingAllComponents || availableComponentsToAdd.length === 0}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {isLoadingAllComponents ? "Loading..." : "Add Component"}
                </Button>
              )}
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
                  <p className="text-sm mb-4">
                    {hasCustomPricing
                      ? "Add pricing components to define how this subcategory calculates prices"
                      : "This subcategory inherits pricing from its parent"
                    }
                  </p>
                  {hasCustomPricing && (
                    <Button
                      size="sm"
                      onClick={() => setShowAddComponentDialog(true)}
                      disabled={isLoadingAllComponents || availableComponentsToAdd.length === 0}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {isLoadingAllComponents ? "Loading components..." : "Add Component"}
                    </Button>
                  )}
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
                          <div className="flex items-center gap-2">
                            <Select
                              value={component.calculationType}
                              onValueChange={(value) =>
                                handlePricingComponentChange(component.componentKey, "calculationType", value)
                              }
                            >
                              <SelectTrigger className="w-32">
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

                            <Button
                              size="sm"
                              variant={component.calculationType === "FORMULA" ? "outline" : "ghost"}
                              onClick={() => handleToggleAdvanced(component.componentKey)}
                              aria-label={component.calculationType === "FORMULA" ? "Switch to Simple" : "Switch to Advanced Formula"}
                            >
                              {component.calculationType === "FORMULA" ? "Simple" : "Advanced"}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {component.calculationType === "FORMULA" ? (
                            <FormulaBuilder
                              value={component.formula || ""}
                              formulaChips={component.formulaChips || []}
                              onChange={(formula, chips) => {
                                handlePricingComponentChange(component.componentKey, "formula", formula);
                                handlePricingComponentChange(component.componentKey, "formulaChips", chips);
                                handleValidateFormula(formula);
                              }}
                              validationResult={
                                formulaError
                                  ? { valid: false, errors: [formulaError], warnings: [] }
                                  : { valid: true, errors: [], warnings: [] }
                              }
                              testValues={{
                                grossWeight: previewValues.grossWeight,
                                netWeight: previewValues.netWeight,
                                metalRate: previewValues.metalRate,
                                metalCost: previewValues.metalCost,
                                subtotal: 0,
                              }}
                            />
                          ) : (
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
                              className="w-24"
                            />
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

                            <Tooltip content="Remove component from pricing">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveComponentFromPricing(component.componentKey)}
                                className="text-destructive hover:text-destructive"
                                aria-label={`Remove ${component.componentName || component.componentKey}`}
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
            </div>

            {/* Formula Helper */}
            {pricingFormData.some(comp => comp.calculationType === "FORMULA") && (
              <div className="mt-4 p-3 bg-gray-50 border rounded-lg">
                <h4 className="text-sm font-medium mb-2">Formula Variables & Operators</h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  {formulaVariables.map((variable: any) => (
                    <Button
                      key={variable.key}
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // This would insert the variable into the focused formula field
                        toast.info(`Variable: ${variable.key}`);
                      }}
                    >
                      {variable.label}
                    </Button>
                  ))}
                  {operators.map((op: string) => (
                    <Button
                      key={op}
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        toast.info(`Operator: ${op}`);
                      }}
                    >
                      {op}
                    </Button>
                  ))}
                </div>
              </div>
            )}

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
                    {(adminBreakdown.components as BreakdownComponent[]).map((c) => (
                      <div key={c.componentKey} className="flex justify-between text-sm py-1">
                        <span className="text-gray-700">{c.componentName}</span>
                        <span className="font-mono">₹{c.value.toFixed(2)}</span>
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
                    {(customerBreakdown.components as BreakdownComponent[]).map((c) => (
                      <div key={c.componentKey} className="flex justify-between text-sm py-1">
                        <span className="text-gray-700">{c.componentName}</span>
                        <span className="font-mono">₹{c.value.toFixed(2)}</span>
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
                      toast.success(`Component ${freezeComponent} frozen successfully`);
                      setShowFreezeDialog(false);
                      setFreezeReason("");
                      setFreezeComponent("");
                      refetchPricing();
                    },
                    onError: (error: any) => {
                      const reason = error?.response?.data?.error?.message || error?.message || "Failed to freeze component";
                      toast.error(reason);
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

      {/* Add Component Dialog */}
      <Dialog open={showAddComponentDialog} onOpenChange={setShowAddComponentDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Pricing Component</DialogTitle>
            <DialogDescription>
              Select a component to add to this subcategory's pricing configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[400px] overflow-auto">
            {isLoadingAllComponents ? (
              <div className="text-center text-gray-500 py-8">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p>Loading available components...</p>
              </div>
            ) : allComponentsError ? (
              <div className="text-center text-red-500 py-8">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-300" />
                <p>Failed to load components.</p>
                <p className="text-sm mt-2">Please check the console for details.</p>
              </div>
            ) : availableComponentsToAdd.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>All available components have been added.</p>
                <p className="text-xs mt-2 text-gray-400">
                  Total components in system: {allComponents.length}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableComponentsToAdd.map((component: any) => (
                  <div
                    key={component._id || component.key}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{component.name}</p>
                      <p className="text-xs text-gray-500">{component.key}</p>
                      {component.description && (
                        <p className="text-sm text-gray-600 mt-1">{component.description}</p>
                      )}
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {component.calculationType}
                        </Badge>
                        {component.defaultValue !== undefined && component.calculationType !== "FORMULA" && (
                          <Badge variant="secondary" className="text-xs">
                            Default: {component.calculationType === "PERCENTAGE" ? `${component.defaultValue}%` : `₹${component.defaultValue}`}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddComponentToPricing(component)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddComponentDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inheritance Warning Dialog */}
      <Dialog open={showInheritanceWarning} onOpenChange={setShowInheritanceWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              Create Custom Pricing?
            </DialogTitle>
            <DialogDescription>
              This subcategory currently inherits its pricing from{" "}
              <strong>{pricingSource?.subcategoryName || "a parent category"}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Warning</AlertTitle>
              <AlertDescription className="text-amber-700">
                Saving these changes will create a custom pricing configuration for this subcategory.
                It will no longer automatically update when the parent's pricing changes.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInheritanceWarning(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowInheritanceWarning(false);
                doSavePricing();
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Create Custom Pricing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubcategoryListPage;
