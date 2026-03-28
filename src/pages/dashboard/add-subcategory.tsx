/**
 * Add Subcategory Page
 * Full page form for creating new subcategories with pricing configuration
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useGetCategory,
  useCreateSubcategory,
  useGetSubcategory,
  useCheckSubcategoryAvailability,
} from "@/lib/react-query/category-hierarchy-query";
import { useGetAllMetalPrices } from "@/lib/react-query/metal-price-query";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, ArrowLeft, ChevronRight, Trash2, Circle, CheckCircle2, Eye, EyeOff } from "lucide-react";
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
  weight: z.coerce.number().positive().optional(),
  isActive: z.boolean().default(true),
  pricingMode: z.enum(["inherit", "custom"]).default("inherit"),
}).refine(
  (data) => data.pricingMode !== "custom" || (data.weight && data.weight > 0),
  { message: "Weight is required for custom pricing", path: ["weight"] }
);

type SubcategoryFormData = z.infer<typeof subcategorySchema>;

interface PricingComponent {
  componentKey: string;
  componentName: string;
  calculationType: "PER_GRAM" | "PERCENTAGE" | "FIXED";
  value: number;
  percentageOf?: "metalCost" | "subtotal";
  metalPriceMode?: "AUTO" | "MANUAL";
  manualMetalPrice?: number;
  isVisible?: boolean;
  isActive?: boolean;
}

// Default pricing components (keys must match PriceComponent.key in database)
const DEFAULT_PRICING_COMPONENTS: PricingComponent[] = [
  { componentKey: "metal_cost", componentName: "Metal Cost", calculationType: "PER_GRAM", value: 1, metalPriceMode: "AUTO", isVisible: true, isActive: true },
  { componentKey: "making_charges", componentName: "Making Charges", calculationType: "PERCENTAGE", value: 15, percentageOf: "metalCost", isVisible: true, isActive: true },
  { componentKey: "wastage_charges", componentName: "Wastage Charges", calculationType: "PERCENTAGE", value: 5, percentageOf: "metalCost", isVisible: true, isActive: true },
  { componentKey: "gst", componentName: "GST", calculationType: "PERCENTAGE", value: 3, percentageOf: "subtotal", isVisible: true, isActive: true },
];

const AddSubcategoryPage = () => {
  const { categoryId, subId } = useParams<{ categoryId: string; subId?: string }>();
  const navigate = useNavigate();
  const [pricingComponents, setPricingComponents] = useState<PricingComponent[]>(DEFAULT_PRICING_COMPONENTS);
  const [nextStepDialog, setNextStepDialog] = useState<{
    open: boolean;
    createdId: string;
    createdName: string;
  }>({ open: false, createdId: "", createdName: "" });

  // Determine if adding to category or nested subcategory
  const isNestedView = Boolean(subId);

  // Fetch parent data
  const { data: categoryData, isLoading: categoryLoading } = useGetCategory(categoryId || "");
  const { data: parentSubcategoryData, isLoading: parentSubcategoryLoading } = useGetSubcategory(subId || "");

  // Mutation
  const { mutate: createSubcategory, isPending: isCreating } = useCreateSubcategory();
  const { data: metalPricesData } = useGetAllMetalPrices();

  // Form setup
  const form = useForm<SubcategoryFormData>({
    resolver: zodResolver(subcategorySchema),
    defaultValues: {
      name: "",
      idAttribute: "",
      description: "",
      weight: undefined,
      isActive: true,
      // First-level subcategories (under category) must configure custom pricing
      // Nested subcategories (under subcategory) can inherit from parent
      pricingMode: isNestedView ? "inherit" : "custom",
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

  // Auto-fill manual metal prices when metal prices data loads
  useEffect(() => {
    console.log("🔄 useEffect triggered for metal price auto-fill");

    // Helper function to extract metal type from material
    const extractMetalType = (material: any): string | null => {
      if (!material) return null;

      // First try direct metalType field
      if (material.metalType) return material.metalType;

      // Try to derive from idAttribute (e.g., "G22" -> "GOLD_22K")
      const idAttr = material.idAttribute;
      if (idAttr) {
        const mapping: Record<string, string> = {
          'G24': 'GOLD_24K',
          'G22': 'GOLD_22K',
          'S999': 'SILVER_999',
          'S925': 'SILVER_925',
          'PT': 'PLATINUM',
        };
        if (mapping[idAttr]) return mapping[idAttr];
      }

      // Try to derive from name (e.g., "Gold(22K)" -> "GOLD_22K")
      const name = material.name || material.displayName || '';
      if (name.includes('Gold') || name.includes('GOLD')) {
        if (name.includes('24')) return 'GOLD_24K';
        if (name.includes('22')) return 'GOLD_22K';
      }
      if (name.includes('Silver') || name.includes('SILVER')) {
        if (name.includes('999')) return 'SILVER_999';
        if (name.includes('925')) return 'SILVER_925';
      }
      if (name.includes('Platinum') || name.includes('PLATINUM')) {
        return 'PLATINUM';
      }

      return null;
    };

    // Get metal type from category or parent subcategory
    const categoryMaterial = typeof category?.materialId === 'object' ? category.materialId : null;
    const parentMaterial = typeof parentSubcategory?.materialId === 'object' ? parentSubcategory.materialId : null;

    const metalType = extractMetalType(categoryMaterial) || extractMetalType(parentMaterial);

    console.log("  metalType from useEffect:", metalType);

    const prices = metalPricesData?.data?.prices || metalPricesData?.prices || [];
    console.log("  prices from useEffect:", prices);

    if (metalType && prices.length > 0) {
      const metalPrice = prices.find((p: any) => p.metalType === metalType);
      console.log("  metalPrice from useEffect:", metalPrice);

      if (metalPrice && metalPrice.pricePerGram && metalPrice.pricePerGram > 0) {
        // Use functional update to avoid stale closure
        setPricingComponents((currentComponents) => {
          console.log("  current components:", currentComponents);
          let needsUpdate = false;
          const updated = currentComponents.map((comp) => {
            if (comp.componentKey === "metal_cost" &&
                comp.metalPriceMode === "MANUAL" &&
                (!comp.manualMetalPrice || comp.manualMetalPrice === 0)) {
              console.log("  ✅ useEffect auto-filling component with price:", metalPrice.pricePerGram);
              needsUpdate = true;
              return { ...comp, manualMetalPrice: metalPrice.pricePerGram };
            }
            return comp;
          });

          if (!needsUpdate) {
            console.log("  ℹ️ No update needed - component already has price or not in MANUAL mode");
          }

          return needsUpdate ? updated : currentComponents;
        });
      }
    }
  }, [metalPricesData, category, parentSubcategory]);

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
      weight: data.weight || null,
      isActive: data.isActive,
      categoryId: categoryId,
      parentSubcategoryId: subId || null,
    };

    // Add pricing config if custom
    if (data.pricingMode === "custom") {
      payload.configurePricing = true;
      payload.pricingConfig = {
        components: pricingComponents.map((comp) => ({
          componentKey: comp.componentKey,
          componentName: comp.componentName,
          calculationType: comp.calculationType,
          value: comp.value ?? 0,
          percentageOf: comp.percentageOf ?? "metalCost",
          metalPriceMode: comp.metalPriceMode ?? null,
          manualMetalPrice: comp.manualMetalPrice ?? null,
          isFrozen: false,
          isVisible: comp.isVisible ?? true,
          isActive: comp.isActive ?? true,
        })),
      };
    }

    console.log("Submitting payload:", JSON.stringify(payload, null, 2));

    createSubcategory(payload, {
      onSuccess: (response: any) => {
        const newId =
          response?.data?._id ||
          response?.data?.data?._id ||
          response?._id;
        const newName = data.name;
        if (newId) {
          setNextStepDialog({ open: true, createdId: newId, createdName: newName });
        } else {
          navigate(`/dashboard/catalog/categories/${categoryId}`);
        }
      },
    });
  };

  // Update pricing component value
  const updateComponentValue = (index: number, field: string, value: any) => {
    const updated = [...pricingComponents];
    const comp = { ...updated[index] };

    // Auto-fill current metal rate when switching to MANUAL mode
    if (field === "metalPriceMode" && value === "MANUAL") {
      console.log("🔍 Manual Price selected - debugging auto-fill:");
      console.log("  category:", category);
      console.log("  parentSubcategory:", parentSubcategory);

      // Helper function to extract metal type from material
      const extractMetalType = (material: any): string | null => {
        if (!material) return null;

        // First try direct metalType field
        if (material.metalType) return material.metalType;

        // Try to derive from idAttribute (e.g., "G22" -> "GOLD_22K")
        const idAttr = material.idAttribute;
        if (idAttr) {
          const mapping: Record<string, string> = {
            'G24': 'GOLD_24K',
            'G22': 'GOLD_22K',
            'S999': 'SILVER_999',
            'S925': 'SILVER_925',
            'PT': 'PLATINUM',
          };
          if (mapping[idAttr]) return mapping[idAttr];
        }

        // Try to derive from name (e.g., "Gold(22K)" -> "GOLD_22K")
        const name = material.name || material.displayName || '';
        if (name.includes('Gold') || name.includes('GOLD')) {
          if (name.includes('24')) return 'GOLD_24K';
          if (name.includes('22')) return 'GOLD_22K';
        }
        if (name.includes('Silver') || name.includes('SILVER')) {
          if (name.includes('999')) return 'SILVER_999';
          if (name.includes('925')) return 'SILVER_925';
        }
        if (name.includes('Platinum') || name.includes('PLATINUM')) {
          return 'PLATINUM';
        }

        return null;
      };

      // Get metal type from either category or parent subcategory
      const categoryMaterial = typeof category?.materialId === 'object' ? category.materialId : null;
      const parentMaterial = typeof parentSubcategory?.materialId === 'object' ? parentSubcategory.materialId : null;

      const metalType = extractMetalType(categoryMaterial) || extractMetalType(parentMaterial);

      console.log("  extracted metalType:", metalType);

      const prices = metalPricesData?.data?.prices || metalPricesData?.prices || [];
      console.log("  available prices:", prices);

      if (metalType && prices.length > 0) {
        const metalPrice = prices.find((p: any) => p.metalType === metalType);
        console.log("  found metalPrice:", metalPrice);

        if (metalPrice && metalPrice.pricePerGram && metalPrice.pricePerGram > 0) {
          console.log("  ✅ Auto-filling with price:", metalPrice.pricePerGram);
          comp.manualMetalPrice = metalPrice.pricePerGram;
        } else {
          console.log("  ❌ metalPrice validation failed");
        }
      } else {
        console.log("  ❌ No metalType or empty prices array");
      }
    }

    updated[index] = { ...comp, [field]: value };
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
        percentageOf: "metalCost",
        isVisible: true,
        isActive: true,
      },
    ]);
  };

  // Remove pricing component
  const removePricingComponent = (index: number) => {
    setPricingComponents(pricingComponents.filter((_, i) => i !== index));
  };

  // Derive preview weight from the form's weight field (fallback to 1g for meaningful preview)
  const formWeight = form.watch("weight");
  const previewWeight = formWeight && formWeight > 0 ? formWeight : 1;

  // Derive preview metal rate from the metal_cost component's configuration
  const previewMetalRate = useMemo(() => {
    const metalCostComp = pricingComponents.find(c => c.componentKey === "metal_cost");
    if (!metalCostComp) return 0;

    if (metalCostComp.metalPriceMode === "MANUAL" && metalCostComp.manualMetalPrice) {
      return metalCostComp.manualMetalPrice;
    }

    // AUTO mode: use system metal price
    const prices = metalPricesData?.data?.prices || metalPricesData?.prices || [];
    if (prices.length === 0) return 0;

    const extractMetalType = (material: unknown): string | null => {
      if (!material || typeof material !== 'object') return null;
      const mat = material as Record<string, unknown>;
      if (mat.metalType) return mat.metalType as string;
      const idAttr = mat.idAttribute as string | undefined;
      if (idAttr) {
        const mapping: Record<string, string> = { 'G24': 'GOLD_24K', 'G22': 'GOLD_22K', 'S999': 'SILVER_999', 'S925': 'SILVER_925', 'PT': 'PLATINUM' };
        if (mapping[idAttr]) return mapping[idAttr];
      }
      return null;
    };

    const categoryMaterial = typeof category?.materialId === 'object' ? category.materialId : null;
    const parentMaterial = typeof parentSubcategory?.materialId === 'object' ? parentSubcategory.materialId : null;
    const metalType = extractMetalType(categoryMaterial) || extractMetalType(parentMaterial);

    if (metalType) {
      const metalPrice = prices.find((p: Record<string, unknown>) => p.metalType === metalType);
      if (metalPrice && (metalPrice as Record<string, number>).pricePerGram > 0) {
        return (metalPrice as Record<string, number>).pricePerGram;
      }
    }
    return 0;
  }, [pricingComponents, metalPricesData, category, parentSubcategory]);

  // Compute price breakdown for Admin and Customer views
  const calculateComponentValue = useCallback((component: PricingComponent, context: { netWeight: number; metalRate: number; metalCost: number; subtotal: number }) => {
    const { netWeight, metalRate, metalCost, subtotal } = context;

    if (component.componentKey === "metal_cost") {
      if (component.metalPriceMode === "MANUAL" && component.manualMetalPrice) {
        return component.manualMetalPrice * netWeight;
      }
      return netWeight * metalRate;
    }

    switch (component.calculationType) {
      case "PER_GRAM":
        return netWeight * (component.value || 1);
      case "PERCENTAGE": {
        const base = component.percentageOf === "subtotal" ? subtotal : metalCost;
        return (base * (component.value || 0)) / 100;
      }
      case "FIXED":
        return component.value || 0;
      default:
        return 0;
    }
  }, []);

  const computeBreakdown = useCallback((components: PricingComponent[], weight: number, rate: number, isCustomerView = false) => {
    let subtotal = 0;
    let metalCost = 0;
    let hiddenValueTotal = 0;
    let metalCostIndex = -1;

    const comps: (PricingComponent & { calculatedValue: number })[] = [];
    for (const comp of components) {
      if (comp.isActive === false) continue;
      let calculatedValue = calculateComponentValue(comp, { netWeight: weight, metalRate: rate, metalCost, subtotal });
      calculatedValue = Math.round(calculatedValue * 100) / 100;

      if (comp.componentKey === "metal_cost") {
        metalCost = calculatedValue;
        metalCostIndex = comps.length;
      }

      comps.push({ ...comp, calculatedValue });
      subtotal += calculatedValue;
    }

    if (isCustomerView && metalCostIndex !== -1) {
      for (let i = 0; i < comps.length; i++) {
        const c = comps[i];
        if (c.componentKey !== "metal_cost" && !c.isVisible) {
          hiddenValueTotal += c.calculatedValue;
          c.calculatedValue = 0;
        }
      }
      if (hiddenValueTotal > 0) {
        comps[metalCostIndex].calculatedValue = Math.round((comps[metalCostIndex].calculatedValue + hiddenValueTotal) * 100) / 100;
        comps[metalCostIndex].componentName = "Unit Cost";
        metalCost = comps[metalCostIndex].calculatedValue;
      }
    }

    subtotal = Math.round(subtotal * 100) / 100;
    metalCost = Math.round(metalCost * 100) / 100;

    const hasHiddenComponents = hiddenValueTotal > 0;

    const finalComponents = isCustomerView
      ? comps.filter(c => c.isVisible !== false || c.componentKey === "metal_cost")
      : comps;

    return { components: finalComponents, subtotal, metalCost, hasHiddenComponents };
  }, [calculateComponentValue]);

  const adminBreakdown = useMemo(
    () => computeBreakdown(pricingComponents, previewWeight, previewMetalRate, false),
    [pricingComponents, previewWeight, previewMetalRate, computeBreakdown]
  );

  const customerBreakdown = useMemo(
    () => computeBreakdown(pricingComponents, previewWeight, previewMetalRate, true),
    [pricingComponents, previewWeight, previewMetalRate, computeBreakdown]
  );

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

              {/* Show explanation for first-level subcategories */}
              {!isNestedView && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> Categories don't have pricing configurations.
                    This first subcategory must configure its own pricing components.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {/* Only show "Inherit" option for nested subcategories */}
                {isNestedView && (
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
                )}

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
                    <span className="font-medium block">
                      {isNestedView ? "Configure custom pricing" : "Configure pricing"}
                    </span>
                    <p className="text-sm text-gray-500">
                      {isNestedView
                        ? "Set up custom pricing components for this subcategory"
                        : "Set up pricing components for this subcategory"}
                    </p>
                  </div>
                </button>
              </div>

              {/* Weight field (required for custom pricing) */}
              {pricingMode === "custom" && (
                <div className="space-y-2">
                  <Label>Default Weight (grams) *</Label>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="e.g., 5.5"
                    {...form.register("weight")}
                  />
                  {form.formState.errors.weight && (
                    <p className="text-sm text-red-500">{form.formState.errors.weight.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Default weight for pricing calculations in this subcategory
                  </p>
                </div>
              )}

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
                      <div key={index} className={`flex flex-col gap-2 p-3 bg-white rounded-lg border ${comp.isActive === false ? "opacity-50" : ""}`}>
                        <div className="flex items-center gap-3">
                          <Input
                            className="flex-1"
                            value={comp.componentName}
                            onChange={(e) => updateComponentValue(index, "componentName", e.target.value)}
                            placeholder="Component name"
                          />

                          <div className="flex items-center gap-2">
                            {comp.componentKey === "metal_cost" ? (
                              <select
                                className="px-3 py-2 border rounded-md text-sm bg-white"
                                value={comp.metalPriceMode || "AUTO"}
                                onChange={(e) => updateComponentValue(index, "metalPriceMode", e.target.value)}
                              >
                                <option value="AUTO">Auto (System Rate)</option>
                                <option value="MANUAL">Manual Price</option>
                              </select>
                            ) : (
                              <select
                                className="px-3 py-2 border rounded-md text-sm bg-white"
                                value={comp.calculationType}
                                onChange={(e) => updateComponentValue(index, "calculationType", e.target.value)}
                              >
                                <option value="PER_GRAM">Per Gram</option>
                                <option value="PERCENTAGE">Percentage</option>
                                <option value="FIXED">Fixed</option>
                              </select>
                            )}

                            {/* Visibility toggle */}
                            <Button
                              type="button"
                              variant={comp.isVisible !== false ? "outline" : "ghost"}
                              size="sm"
                              onClick={() => updateComponentValue(index, "isVisible", comp.isVisible === false)}
                              title={comp.isVisible !== false ? "Visible to customers - click to hide" : "Hidden from customers - click to show"}
                            >
                              {comp.isVisible !== false ? (
                                <Eye className="h-4 w-4 text-green-500" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>

                            {/* Active toggle */}
                            <Switch
                              checked={comp.isActive !== false}
                              onCheckedChange={(checked) => updateComponentValue(index, "isActive", checked)}
                            />

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

                        {/* Metal Cost - Manual price input */}
                        {comp.componentKey === "metal_cost" && comp.metalPriceMode === "MANUAL" && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              className="w-32"
                              value={comp.manualMetalPrice || ""}
                              onChange={(e) => updateComponentValue(index, "manualMetalPrice", parseFloat(e.target.value) || 0)}
                              placeholder="Price per gram"
                            />
                            <span className="text-sm text-gray-500">₹/gram</span>
                          </div>
                        )}

                        {/* Regular components - value input */}
                        {comp.componentKey !== "metal_cost" && (
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

                            {/* Percentage base selector */}
                            {comp.calculationType === "PERCENTAGE" && (
                              <select
                                className="px-2 py-1 border rounded-md text-xs bg-white"
                                value={comp.percentageOf || "metalCost"}
                                onChange={(e) => updateComponentValue(index, "percentageOf", e.target.value)}
                              >
                                <option value="metalCost">of Metal Cost</option>
                                <option value="subtotal">of Subtotal</option>
                              </select>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Live Price Preview */}
              {pricingMode === "custom" && pricingComponents.length > 0 && (
                <Card className="border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Live Price Preview</CardTitle>
                    <CardDescription>
                      Preview how pricing will appear to admin vs customers. Uses the weight and metal rate from the form above.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-24 text-sm text-muted-foreground bg-gray-50 p-3 rounded border">
                      <div>
                        <span className="text-gray-500">Weight:</span>{" "}
                        <span className="font-medium text-foreground">
                          {formWeight && formWeight > 0 ? `${formWeight}g` : "1g (default)"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Metal Rate:</span>{" "}
                        <span className="font-medium text-foreground">{previewMetalRate > 0 ? `₹${previewMetalRate.toFixed(2)}/g` : "Not set"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Source:</span>{" "}
                        <span className="font-medium text-foreground">
                          {pricingComponents.find(c => c.componentKey === "metal_cost")?.metalPriceMode === "MANUAL" ? "Manual" : "Auto (System)"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Admin View */}
                      <div>
                        <h5 className="text-sm font-medium mb-2">Admin View (all components)</h5>
                        <div className="bg-gray-50 p-3 rounded border">
                          {adminBreakdown.components.map((c: PricingComponent & { calculatedValue: number }) => (
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
                          <div className="flex justify-between text-lg font-semibold mt-1">
                            <span>Total</span>
                            <span className="font-mono">₹{adminBreakdown.subtotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Customer View */}
                      <div>
                        <h5 className="text-sm font-medium mb-2">Customer View (visible components)</h5>
                        <div className="bg-gray-50 p-3 rounded border">
                          {customerBreakdown.components.map((c: PricingComponent & { calculatedValue: number }) => (
                            <div key={c.componentKey} className="flex justify-between text-sm py-1">
                              <span className="text-gray-700">{c.componentName}</span>
                              <span className="font-mono">₹{(c.calculatedValue ?? 0).toFixed(2)}</span>
                            </div>
                          ))}
                          <hr className="my-2" />
                          <div className="flex justify-between font-medium">
                            <span>{customerBreakdown.hasHiddenComponents ? "Unit Cost" : "Metal Cost"}</span>
                            <span className="font-mono">₹{customerBreakdown.metalCost.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-lg font-semibold mt-1">
                            <span>Total</span>
                            <span className="font-mono">₹{customerBreakdown.subtotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
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

      {/* ── Next Step Dialog ── */}
      <Dialog open={nextStepDialog.open} onOpenChange={() => {}}>
        <DialogContent
          className="max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-lg">
              "{nextStepDialog.createdName}" created!
            </DialogTitle>
            <p className="text-sm text-muted-foreground pt-1">
              What would you like to do next?
            </p>
          </DialogHeader>

          <div className="flex flex-col gap-3 pt-2">
            {/* Option 1: Add child subcategory */}
            <button
              type="button"
              className="flex flex-col items-start gap-1 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3.5 text-left hover:bg-violet-100 transition-colors"
              onClick={() =>
                navigate(
                  `/dashboard/catalog/categories/${categoryId}/${nextStepDialog.createdId}/add`
                )
              }
            >
              <span className="font-semibold text-violet-800 text-sm">
                Add a subcategory inside "{nextStepDialog.createdName}"
              </span>
              <span className="text-xs text-violet-600">
                Create a child subcategory nested under this one — e.g., a style or finish variant
              </span>
            </button>

            {/* Option 2: Add product */}
            <button
              type="button"
              className="flex flex-col items-start gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-left hover:bg-emerald-100 transition-colors"
              onClick={() =>
                navigate(
                  `/dashboard/products/add?subcategoryId=${nextStepDialog.createdId}`
                )
              }
            >
              <span className="font-semibold text-emerald-800 text-sm">
                Add a product in "{nextStepDialog.createdName}"
              </span>
              <span className="text-xs text-emerald-600">
                Go to the Add Product form with this subcategory pre-selected
              </span>
            </button>

            {/* Option 3: Done */}
            <button
              type="button"
              className="rounded-lg border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/50 transition-colors text-left"
              onClick={() =>
                navigate(`/dashboard/catalog/categories/${categoryId}`)
              }
            >
              Done — go back to the category
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddSubcategoryPage;
