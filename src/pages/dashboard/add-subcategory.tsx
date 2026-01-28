/**
 * Add Subcategory Page
 * Full page form for creating new subcategories with pricing configuration
 */

import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  useGetCategory,
  useCreateSubcategory,
  useGetSubcategory,
  useCheckSubcategoryAvailability,
} from "@/lib/react-query/category-hierarchy-query";
import { useGetAllComponents } from "@/lib/react-query/price-component-query";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowLeft, ChevronRight, Trash2, Circle, CheckCircle2, Calculator } from "lucide-react";
import FormProvider from "@/components/form/FormProvider";
import { FormulaBuilder } from "@/components/formula-builder";

// Validation schema
const subcategorySchema = z.object({
  name: z.string().min(1, "Subcategory name is required").max(100),
  idAttribute: z
    .string()
    .min(1, "ID attribute is required")
    .max(10, "Max 10 characters")
    .regex(/^[^-]+$/, "Hyphens not allowed"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  pricingMode: z.enum(["inherit", "custom"]).default("inherit"),
});

type SubcategoryFormData = z.infer<typeof subcategorySchema>;

// Default system component keys (must exist in PriceComponent collection)
const DEFAULT_SYSTEM_COMPONENT_KEYS = ["metal_cost", "making_charges", "wastage_charges", "gst"];

interface PricingComponentLocal {
  componentId: string;
  componentKey: string;
  componentName: string;
  calculationType: string;
  value: number;
  formula?: string | null;
  percentageOf?: string;
  isActive?: boolean;
  isVisible?: boolean;
  sortOrder?: number;
  _prevCalculationType?: string;
  _prevValue?: number;
}

const AddSubcategoryPage = () => {
  const { categoryId, subId } = useParams<{ categoryId: string; subId?: string }>();
  const navigate = useNavigate();
  const [pricingComponents, setPricingComponents] = useState<PricingComponentLocal[]>([]);
  const [showAddComponentDialog, setShowAddComponentDialog] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Determine if adding to category or nested subcategory
  const isNestedView = Boolean(subId);

  // Fetch parent data
  const { data: categoryData, isLoading: categoryLoading } = useGetCategory(categoryId || "");
  const { data: parentSubcategoryData, isLoading: parentSubcategoryLoading } = useGetSubcategory(subId || "");

  // Fetch all available price components
  const { data: allComponentsData, isLoading: isLoadingComponents } = useGetAllComponents({ includeInactive: false });
  const allComponents = allComponentsData?.components || [];

  // Initialize default pricing components from API data
  useMemo(() => {
    if (allComponents.length > 0 && !isInitialized) {
      const defaultComponents: PricingComponentLocal[] = [];
      for (const key of DEFAULT_SYSTEM_COMPONENT_KEYS) {
        const comp = allComponents.find((c: any) => c.key === key);
        if (comp) {
          defaultComponents.push({
            componentId: comp._id,
            componentKey: comp.key,
            componentName: comp.name,
            calculationType: comp.calculationType,
            value: comp.defaultValue || 0,
            formula: comp.formula || null,
            percentageOf: comp.percentageOf || "metalCost",
            isActive: comp.isActive !== false,
            isVisible: comp.isVisible !== false,
            sortOrder: defaultComponents.length,
          });
        }
      }
      if (defaultComponents.length > 0) {
        setPricingComponents(defaultComponents);
        setIsInitialized(true);
      }
    }
  }, [allComponents, isInitialized]);

  // Get available components that haven't been added yet
  const availableComponentsToAdd = useMemo(() => {
    const existingKeys = new Set(pricingComponents.map(c => c.componentKey));
    return allComponents.filter((c: any) => !existingKeys.has(c.key));
  }, [allComponents, pricingComponents]);

  // Mutation
  const { mutate: createSubcategory, isPending: isCreating } = useCreateSubcategory();

  // Form setup
  const form = useForm<SubcategoryFormData>({
    resolver: zodResolver(subcategorySchema),
    defaultValues: {
      name: "",
      idAttribute: "",
      description: "",
      isActive: true,
      pricingMode: "inherit",
    },
  });

  const pricingMode = form.watch("pricingMode");
  const idAttribute = form.watch("idAttribute");

  // Check availability of ID attribute
  const availabilityQuery = useCheckSubcategoryAvailability({
    categoryId: categoryId || "",
    parentSubcategoryId: subId || null,
    idAttribute: idAttribute || "",
  });

  const isIdAvailable = availabilityQuery.data?.data?.available;
  const conflict = availabilityQuery.data?.data?.conflict;

  // Get parent info
  const category = categoryData?.data?.category || categoryData?.category;
  const parentSubcategory = parentSubcategoryData?.data?.subcategory || parentSubcategoryData?.subcategory;

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

    crumbs.push({ label: "Add Subcategory", href: "#" });

    return crumbs;
  }, [category, parentSubcategory, categoryId, subId]);

  // Generate preview ID
  const previewId = useMemo(() => {
    let baseId = "";
    if (isNestedView && parentSubcategory) {
      baseId = parentSubcategory.fullCategoryId || "";
    } else if (category) {
      baseId = category.fullCategoryId || "";
    }
    if (idAttribute) {
      return `${baseId}-${idAttribute.toUpperCase()}`;
    }
    return baseId ? `${baseId}-...` : "---";
  }, [category, parentSubcategory, isNestedView, idAttribute]);

  // Parent name for display
  const parentName = isNestedView ? parentSubcategory?.name : category?.name;

  // Handle form submission
  const onSubmit = (data: SubcategoryFormData) => {
    const payload: any = {
      name: data.name,
      idAttribute: data.idAttribute.toUpperCase(),
      description: data.description,
      isActive: data.isActive,
      categoryId: categoryId,
      parentSubcategoryId: subId || null,
    };

    // Add pricing config if custom
    if (data.pricingMode === "custom") {
      payload.configurePricing = true;
      payload.pricingConfig = {
        components: pricingComponents.map((comp) => {
          const { _prevCalculationType, _prevValue, ...rest } = comp as any;
          return {
            ...rest,
            value: rest.value ?? 0,
            formula: rest.formula ?? null,
            isFrozen: false,
          };
        }),
      };
    }

    console.log("Submitting payload:", JSON.stringify(payload, null, 2));

    createSubcategory(payload, {
      onSuccess: () => {
        toast.success("Subcategory created successfully");
        // Navigate back to the subcategory list
        if (subId) {
          navigate(`/dashboard/catalog/categories/${categoryId}/${subId}`);
        } else {
          navigate(`/dashboard/catalog/categories/${categoryId}`);
        }
      },
    });
  };

  // Update pricing component value
  const updateComponentValue = (index: number, field: string, value: any) => {
    const updated = [...pricingComponents];
    updated[index] = { ...updated[index], [field]: value };
    setPricingComponents(updated);
  };

  // Add component from available list
  const handleAddComponent = (component: any) => {
    const maxSortOrder = pricingComponents.length > 0
      ? Math.max(...pricingComponents.map(c => c.sortOrder || 0))
      : -1;

    const newComponent: PricingComponentLocal = {
      componentId: component._id,
      componentKey: component.key,
      componentName: component.name,
      calculationType: component.calculationType || "FIXED",
      value: component.defaultValue || 0,
      formula: component.formula || null,
      percentageOf: component.percentageOf || "metalCost",
      isActive: component.isActive !== false,
      isVisible: component.isVisible !== false,
      sortOrder: maxSortOrder + 1,
    };

    setPricingComponents([...pricingComponents, newComponent]);
    setShowAddComponentDialog(false);
    toast.success(`Added "${component.name}" component`);
  };

  // Toggle Advanced (switch between PERCENTAGE/FIXED/PER_GRAM and FORMULA)
  const toggleAdvanced = (index: number) => {
    const updated = [...pricingComponents];
    const comp = { ...updated[index] };

    if (comp.calculationType !== "FORMULA") {
      // store previous state to restore later
      comp._prevCalculationType = comp.calculationType;
      comp._prevValue = comp.value;
      comp.calculationType = "FORMULA";
      comp.formula = comp.formula || "(grossWeight - netWeight) * metalRate * 0.05";
    } else {
      // restore previous simple mode
      comp.calculationType = comp._prevCalculationType || "PERCENTAGE";
      comp.value = comp._prevValue !== undefined ? comp._prevValue : comp.value || 0;
      delete comp._prevCalculationType;
      delete comp._prevValue;
      // keep formula if user wants it saved separately
    }

    updated[index] = comp;
    setPricingComponents(updated);
  };

  // Remove pricing component
  const removePricingComponent = (index: number) => {
    setPricingComponents(pricingComponents.filter((_, i) => i !== index));
  };

  const isLoading = categoryLoading || (isNestedView && parentSubcategoryLoading);

  // Build back URL
  const backUrl = subId
    ? `/dashboard/catalog/categories/${categoryId}/${subId}`
    : `/dashboard/catalog/categories/${categoryId}`;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header with Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 flex-wrap">
          {breadcrumb.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <ChevronRight className="h-4 w-4" />}
              {crumb.href === "#" ? (
                <span>{crumb.label}</span>
              ) : (
                <Link to={crumb.href} className="hover:text-blue-600 hover:underline">
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(backUrl)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Add Subcategory</h1>
            <p className="text-sm text-gray-500">
              Add a new subcategory to "{parentName}"
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Subcategory Details</CardTitle>
          <CardDescription>
            Provide subcategory information and configure pricing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider methods={form} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">Basic Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subcategory Name *</Label>
                  <Input placeholder="e.g., Kundan" {...form.register("name")} />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>ID Attribute *</Label>
                  <Input
                    placeholder="e.g., K"
                    maxLength={10}
                    {...form.register("idAttribute")}
                    onChange={(e) => form.setValue("idAttribute", e.target.value.toUpperCase())}
                  />
                  {form.formState.errors.idAttribute && (
                    <p className="text-sm text-red-500">{form.formState.errors.idAttribute.message}</p>
                  )}
                  {idAttribute && availabilityQuery.isLoading && (
                    <p className="text-xs text-gray-500">Checking availability...</p>
                  )}
                  {idAttribute && availabilityQuery.isFetched && availabilityQuery.isSuccess && (
                    isIdAvailable ? (
                      <p className="text-xs text-green-600">Available: {availabilityQuery.data.data.fullCategoryId}</p>
                    ) : isIdAvailable === false ? (
                      <p className="text-xs text-red-600">
                        Conflicts with: {conflict?.name || conflict?.fullCategoryId || conflict?._id || 'Existing subcategory'}
                        {conflict?._id && (
                          <button
                            type="button"
                            className="ml-2 text-blue-600 hover:underline text-xs"
                            onClick={() => navigate(`/dashboard/catalog/categories/${categoryId}/${conflict._id}`)}
                          >
                            View
                          </button>
                        )}
                      </p>
                    ) : null
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Optional description" {...form.register("description")} />
              </div>
            </div>

            {/* Preview ID */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-600 font-medium mb-1">Generated ID</p>
              <p className="text-2xl font-mono font-bold text-blue-800">{previewId}</p>
            </div>

            {/* Pricing Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-2">Pricing Configuration</h3>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => form.setValue("pricingMode", "inherit")}
                  className={`w-full flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer text-left transition-colors ${
                    pricingMode === "inherit" ? "border-blue-500 bg-blue-50" : ""
                  }`}
                >
                  {pricingMode === "inherit" ? (
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <span className="font-medium block">Inherit from parent</span>
                    <p className="text-sm text-gray-500">
                      Use the pricing configuration from "{parentName}"
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => form.setValue("pricingMode", "custom")}
                  className={`w-full flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer text-left transition-colors ${
                    pricingMode === "custom" ? "border-blue-500 bg-blue-50" : ""
                  }`}
                >
                  {pricingMode === "custom" ? (
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <span className="font-medium block">Configure custom pricing</span>
                    <p className="text-sm text-gray-500">
                      Set up custom pricing components for this subcategory
                    </p>
                  </div>
                </button>
              </div>

              {/* Custom Pricing Components */}
              {pricingMode === "custom" && (
                <Card className="bg-gray-50 border-dashed">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Pricing Components</CardTitle>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddComponentDialog(true)}
                        disabled={availableComponentsToAdd.length === 0 || isLoadingComponents}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Component
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {isLoadingComponents ? (
                      <div className="text-center py-4 text-gray-500">Loading components...</div>
                    ) : pricingComponents.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        <Calculator className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>No components configured. Click "Add Component" to start.</p>
                      </div>
                    ) : (
                    pricingComponents.map((comp, index) => (
                      <div key={comp.componentKey} className="flex flex-col gap-2 p-3 bg-white rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <span className="font-medium">{comp.componentName}</span>
                            <span className="text-xs text-gray-500 ml-2">({comp.componentKey})</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              className="px-3 py-2 border rounded-md text-sm bg-white"
                              value={comp.calculationType}
                              onChange={(e) => updateComponentValue(index, "calculationType", e.target.value)}
                            >
                              <option value="PER_GRAM">Per Gram</option>
                              <option value="PERCENTAGE">Percentage</option>
                              <option value="FIXED">Fixed</option>
                              <option value="FORMULA">Formula (Advanced)</option>
                            </select>

                            <Button
                              type="button"
                              size="sm"
                              variant={comp.calculationType === "FORMULA" ? "outline" : "ghost"}
                              onClick={() => toggleAdvanced(index)}
                              aria-label={comp.calculationType === "FORMULA" ? "Switch to Simple" : "Switch to Advanced Formula"}
                            >
                              {comp.calculationType === "FORMULA" ? "Simple" : "Advanced"}
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePricingComponent(index)}
                              disabled={pricingComponents.length <= 1}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>

                        {comp.calculationType === "FORMULA" ? (
                          <FormulaBuilder
                            value={comp.formula || ""}
                            formulaChips={comp.formulaChips || []}
                            onChange={(formula, chips) => {
                              updateComponentValue(index, "formula", formula);
                              updateComponentValue(index, "formulaChips", chips);
                            }}
                            testValues={{
                              grossWeight: 10,
                              netWeight: 9.5,
                              metalRate: 5000,
                              metalCost: 47500,
                              subtotal: 50000,
                            }}
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              className="w-24"
                              value={comp.value}
                              onChange={(e) => updateComponentValue(index, "value", parseFloat(e.target.value) || 0)}
                              placeholder="Value"
                            />
                            <span className="text-sm text-gray-500 w-8">
                              {comp.calculationType === "PERCENTAGE" ? "%" : comp.calculationType === "PER_GRAM" ? "/g" : "₹"}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                    )}
                  </CardContent>
                </Card>
              )}
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
              <Button type="button" variant="outline" onClick={() => navigate(backUrl)}>
                Cancel
              </Button>
              <Button type="submit" disabled={Boolean(isCreating || isLoading || (idAttribute && availabilityQuery.isSuccess && isIdAvailable === false))}>
                {isCreating ? "Creating..." : "Save Subcategory"}
              </Button>
            </div>
          </FormProvider>
        </CardContent>
      </Card>

      {/* Add Component Dialog */}
      <Dialog open={showAddComponentDialog} onOpenChange={setShowAddComponentDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Pricing Component</DialogTitle>
            <DialogDescription>
              Select a component to add to your pricing configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[400px] overflow-auto">
            {availableComponentsToAdd.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>All available components have been added.</p>
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
                      onClick={() => handleAddComponent(component)}
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
    </div>
  );
};

export default AddSubcategoryPage;
