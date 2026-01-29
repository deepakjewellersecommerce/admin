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

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, ArrowLeft, ChevronRight, Trash2, Circle, CheckCircle2 } from "lucide-react";
import FormProvider from "@/components/form/FormProvider";

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

interface PricingComponent {
  componentKey: string;
  componentName: string;
  calculationType: string;
  value: number;
  formula?: string;
  _prevCalculationType?: string;
  _prevValue?: number;
}

// Default pricing components (keys must match PriceComponent.key in database)
const DEFAULT_PRICING_COMPONENTS: PricingComponent[] = [
  { componentKey: "metal_cost", componentName: "Metal Cost", calculationType: "PER_GRAM", value: 1 },
  { componentKey: "making_charges", componentName: "Making Charges", calculationType: "PERCENTAGE", value: 15 },
  // Change: Wastage default to PERCENTAGE 5% (simpler UX). Advanced: allow switching to FORMULA.
  { componentKey: "wastage_charges", componentName: "Wastage Charges", calculationType: "PERCENTAGE", value: 5 },
  { componentKey: "gst", componentName: "GST", calculationType: "PERCENTAGE", value: 3 },
];

const AddSubcategoryPage = () => {
  const { categoryId, subId } = useParams<{ categoryId: string; subId?: string }>();
  const navigate = useNavigate();
  const [pricingComponents, setPricingComponents] = useState<PricingComponent[]>(DEFAULT_PRICING_COMPONENTS);

  // Determine if adding to category or nested subcategory
  const isNestedView = Boolean(subId);

  // Fetch parent data
  const { data: categoryData, isLoading: categoryLoading } = useGetCategory(categoryId || "");
  const { data: parentSubcategoryData, isLoading: parentSubcategoryLoading } = useGetSubcategory(subId || "");

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

  // Add new pricing component
  const addPricingComponent = () => {
    setPricingComponents([
      ...pricingComponents,
      {
        componentKey: `custom_${Date.now()}`,
        componentName: "New Component",
        calculationType: "PERCENTAGE",
        value: 0,
      },
    ]);
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
                      <Button type="button" variant="outline" size="sm" onClick={addPricingComponent}>
                        <Plus className="h-3 w-3 mr-1" /> Add Component
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {pricingComponents.map((comp, index) => (
                      <div key={index} className="flex flex-col gap-2 p-3 bg-white rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Input
                            className="flex-1"
                            value={comp.componentName}
                            onChange={(e) => updateComponentValue(index, "componentName", e.target.value)}
                            placeholder="Component name"
                          />

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
                          <div className="space-y-2">
                            <Textarea
                              value={comp.formula || ""}
                              onChange={(e) => updateComponentValue(index, "formula", e.target.value)}
                              placeholder="e.g., (grossWeight - netWeight) * metalRate * 0.05"
                              className="font-mono text-sm"
                              rows={3}
                            />
                            <p className="text-xs text-gray-500">Advanced formula mode — use variables like grossWeight, netWeight, metalRate, subtotal</p>
                          </div>
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
                    ))}
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
              <Button type="submit" disabled={isCreating || isLoading || Boolean(idAttribute && availabilityQuery.isSuccess && isIdAvailable === false)}>
                {isCreating ? "Creating..." : "Save Subcategory"}
              </Button>
            </div>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddSubcategoryPage;
