/**
 * Product Pricing Page
 * Allows admin to customize pricing for individual products
 */

import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
  ArrowLeft,
  DollarSign,
  Lock,
  Unlock,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";

// Hooks
import {
  useGetPricingSummary,
  useCustomizePricing,
  useRevertToSubcategoryPricing,
  useUpdateProductPricingConfig,
} from "@/lib/react-query/product-pricing-query";
import { useGetCalculationTypes } from "@/lib/react-query/price-component-query";
import { ProductPricingComponent } from "@/lib/axios/product-pricing-API";

const ProductPricingPage = () => {
  const { id: productId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [pricingComponents, setPricingComponents] = useState<ProductPricingComponent[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previewNetWeight, setPreviewNetWeight] = useState<number>(0);
  const [previewMetalRate, setPreviewMetalRate] = useState<number>(0);

  // Queries
  const { data: summaryData, isLoading: isLoadingSummary, refetch: refetchSummary } = useGetPricingSummary(productId || "");
  const { data: calculationTypesData } = useGetCalculationTypes();

  // Mutations
  const { mutate: customizePricing, isPending: isCustomizing } = useCustomizePricing();
  const { mutate: revertPricing, isPending: isReverting } = useRevertToSubcategoryPricing();
  const { mutate: updateConfig, isPending: isUpdating } = useUpdateProductPricingConfig();

  const calculationTypes = calculationTypesData?.data?.types || [];

  // Extract data from summary
  const product = summaryData?.data?.product || summaryData?.product;
  const pricing = summaryData?.data?.pricing || summaryData?.pricing;
  const breakdown = summaryData?.data?.breakdown || summaryData?.breakdown;
  const metalRate = summaryData?.data?.metalRate || summaryData?.metalRate;

  const pricingMode = product?.pricingMode || pricing?.mode || "SUBCATEGORY_DYNAMIC";
  const isCustomDynamic = pricingMode === "CUSTOM_DYNAMIC";

  // Initialize component state from breakdown
  useEffect(() => {
    if (breakdown?.components) {
      setPricingComponents(breakdown.components);
      setPreviewNetWeight(product?.netWeight || 1);
      setPreviewMetalRate(metalRate?.pricePerGram || 0);
    }
  }, [breakdown, product, metalRate]);

  // Handle component changes
  const handleComponentChange = (componentKey: string, field: string, value: any) => {
    setPricingComponents((prev) =>
      prev.map((comp) => {
        if (comp.componentKey === componentKey) {
          const updated = { ...comp, [field]: value };
          // Auto-fill current metal rate when switching to MANUAL mode
          if (field === "metalPriceMode" && value === "MANUAL") {
            // Only fill if it's currently empty/0 or if we're specifically switching to MANUAL
            const currentRate = previewMetalRate || 0;
            if (!updated.manualMetalPrice || updated.manualMetalPrice === 0) {
              updated.manualMetalPrice = currentRate;
            }
          }
          return updated;
        }
        return comp;
      })
    );
    setHasUnsavedChanges(true);
  };

  // Calculate component value locally
  const calculateComponentValue = useCallback((component: ProductPricingComponent, context: any) => {
    const { netWeight, metalRate, metalCost, subtotal } = context;

    // Metal cost component
    if (component.componentKey === "metal_cost") {
      if (component.metalPriceMode === "MANUAL" && component.manualMetalPrice) {
        return component.manualMetalPrice * netWeight;
      }
      return netWeight * metalRate;
    }

    switch (component.calculationType) {
      case "PER_GRAM":
        return netWeight * (component.value || 1);
      case "PERCENTAGE":
        const base = component.percentageOf === "subtotal" ? subtotal : metalCost;
        return (base * (component.value || 0)) / 100;
      case "FIXED":
        return component.value || 0;
      default:
        return 0;
    }
  }, []);

  // Compute live breakdown
  const computeBreakdown = useCallback((isCustomerView = false) => {
    let subtotal = 0;
    let metalCost = 0;
    let hiddenValueTotal = 0;
    let metalCostIndex = -1;

    const comps: any[] = [];

    const sorted = [...pricingComponents].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    for (const comp of sorted) {
      if (!comp.isActive) continue;

      let value = comp.isFrozen
        ? comp.frozenValue || 0
        : calculateComponentValue(comp, {
            netWeight: previewNetWeight,
            metalRate: previewMetalRate,
            metalCost,
            subtotal,
          });

      value = Math.round(value * 100) / 100;

      if (comp.componentKey === "metal_cost") {
        metalCost = value;
        metalCostIndex = comps.length;
      }

      comps.push({ ...comp, calculatedValue: value });
      subtotal += value;
    }

    // Merge hidden components into metal_cost for customer view consistency
    if (isCustomerView && metalCostIndex !== -1) {
      for (let i = 0; i < comps.length; i++) {
        if (i !== metalCostIndex && !comps[i].isVisible) {
          hiddenValueTotal += comps[i].calculatedValue;
          comps[i].calculatedValue = 0;
        }
      }

      if (hiddenValueTotal > 0) {
        comps[metalCostIndex].calculatedValue =
          Math.round((comps[metalCostIndex].calculatedValue + hiddenValueTotal) * 100) / 100;
        comps[metalCostIndex].componentName = "Unit Cost";
        metalCost = comps[metalCostIndex].calculatedValue;
      }
    }

    return {
      components: isCustomerView ? comps.filter(c => c.isVisible || c.componentKey === "metal_cost") : comps,
      subtotal: Math.round(subtotal * 100) / 100,
      metalCost,
      hasHiddenComponents: hiddenValueTotal > 0
    };
  }, [pricingComponents, previewNetWeight, previewMetalRate, calculateComponentValue]);

  const liveBreakdown = computeBreakdown(false);
  const customerBreakdown = computeBreakdown(true);

  // Handlers
  const handleCustomize = () => {
    if (!productId) return;
    customizePricing(productId, {
      onSuccess: () => {
        refetchSummary();
      },
    });
  };

  const handleRevert = () => {
    if (!productId) return;
    revertPricing(productId, {
      onSuccess: () => {
        setHasUnsavedChanges(false);
        refetchSummary();
      },
    });
  };

  const handleSave = () => {
    if (!productId) return;

    const sanitized = pricingComponents.map((c) => ({
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

    updateConfig(
      { productId, components: sanitized },
      {
        onSuccess: () => {
          setHasUnsavedChanges(false);
          refetchSummary();
        },
      }
    );
  };

  if (isLoadingSummary) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Product Not Found</AlertTitle>
          <AlertDescription>The requested product could not be found.</AlertDescription>
        </Alert>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Product Pricing
          </h1>
          <p className="text-sm text-muted-foreground">
            {product.productTitle} ({product.skuNo})
          </p>
        </div>
      </div>

      {/* Product Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Metal Type</p>
              <p className="font-medium">{product.metalType}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Gross Weight</p>
              <p className="font-medium">{product.grossWeight}g</p>
            </div>
            <div>
              <p className="text-muted-foreground">Net Weight</p>
              <p className="font-medium">{product.netWeight}g</p>
            </div>
            <div>
              <p className="text-muted-foreground">Current Price</p>
              <p className="font-medium">₹{product.calculatedPrice?.toFixed(2) || "0.00"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Mode Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pricing Configuration</span>
            <Badge variant={isCustomDynamic ? "default" : "secondary"}>
              {isCustomDynamic ? "Custom Pricing" : "Inherits from Subcategory"}
            </Badge>
          </CardTitle>
          <CardDescription>
            {isCustomDynamic
              ? "This product has its own custom pricing configuration."
              : "This product inherits pricing from its subcategory."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {!isCustomDynamic && (
              <Button onClick={handleCustomize} disabled={isCustomizing}>
                {isCustomizing ? "Customizing..." : "Switch to Custom Pricing"}
              </Button>
            )}
            {isCustomDynamic && (
              <Button variant="outline" onClick={handleRevert} disabled={isReverting}>
                {isReverting ? "Reverting..." : "Revert to Subcategory Pricing"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Components Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Components</CardTitle>
          <CardDescription>
            {isCustomDynamic
              ? "Edit pricing components below. Changes are saved when you click Save."
              : "These values are inherited from the subcategory. Switch to custom pricing to edit."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Calculated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {liveBreakdown.components.map((component: any) => (
                <TableRow key={component.componentKey}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{component.componentName}</p>
                      <p className="text-xs text-muted-foreground">{component.componentKey}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {component.componentKey === "metal_cost" ? (
                      <Select
                        value={component.metalPriceMode || "AUTO"}
                        onValueChange={(value) =>
                          handleComponentChange(component.componentKey, "metalPriceMode", value)
                        }
                        disabled={!isCustomDynamic}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AUTO">Auto</SelectItem>
                          <SelectItem value="MANUAL">Manual</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Select
                          value={component.calculationType}
                          onValueChange={(value) =>
                            handleComponentChange(component.componentKey, "calculationType", value)
                          }
                          disabled={!isCustomDynamic}
                        >
                          <SelectTrigger className="w-24">
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
                              handleComponentChange(component.componentKey, "percentageOf", value)
                            }
                            disabled={!isCustomDynamic}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="metalCost">Metal</SelectItem>
                              <SelectItem value="subtotal">Subtotal</SelectItem>
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
                            handleComponentChange(
                              component.componentKey,
                              "manualMetalPrice",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-20"
                          disabled={!isCustomDynamic}
                        />
                        <span className="text-xs">/g</span>
                      </div>
                    ) : component.componentKey === "metal_cost" ? (
                      <span className="text-sm text-muted-foreground">System</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          step="0.01"
                          value={component.value || 0}
                          onChange={(e) =>
                            handleComponentChange(
                              component.componentKey,
                              "value",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-16"
                          disabled={!isCustomDynamic}
                        />
                        <span className="text-xs">
                          {component.calculationType === "PERCENTAGE" ? "%" : component.calculationType === "FIXED" ? "₹" : ""}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono">₹{component.calculatedValue?.toFixed(2) || "0.00"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {component.isFrozen && (
                        <Badge variant="secondary" className="text-xs">
                          <Lock className="h-3 w-3 mr-1" /> Frozen
                        </Badge>
                      )}
                      {!component.isVisible && (
                        <Badge variant="outline" className="text-xs">
                          <EyeOff className="h-3 w-3 mr-1" /> Hidden
                        </Badge>
                      )}
                      {!component.isFrozen && component.isVisible && component.isActive && (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant={component.isVisible ? "outline" : "ghost"}
                        onClick={() =>
                          handleComponentChange(component.componentKey, "isVisible", !component.isVisible)
                        }
                        disabled={!isCustomDynamic}
                      >
                        {component.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Switch
                        checked={component.isActive}
                        onCheckedChange={(checked) =>
                          handleComponentChange(component.componentKey, "isActive", checked)
                        }
                        disabled={!isCustomDynamic}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Breakdown Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h4 className="text-sm font-medium mb-3">Admin View (raw components)</h4>
              <div className="p-4 bg-muted/30 rounded-lg border space-y-2">
                {liveBreakdown.components.map((component: any) => (
                  <div key={component.componentKey} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{component.componentName}</span>
                    <span className="font-mono">₹{component.calculatedValue?.toFixed(2)}</span>
                  </div>
                ))}
                <div className="pt-2 mt-2 border-t flex justify-between font-bold">
                  <span>Total</span>
                  <span className="font-mono text-lg">₹{liveBreakdown.subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">Customer View (collapsed hidden)</h4>
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-2">
                {customerBreakdown.components.map((component: any) => (
                  <div key={component.componentKey} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{component.componentName}</span>
                    <span className="font-mono text-primary font-medium">₹{component.calculatedValue?.toFixed(2)}</span>
                  </div>
                ))}
                <div className="pt-2 mt-2 border-t flex justify-between font-bold">
                  <span>Total</span>
                  <span className="font-mono text-lg">₹{customerBreakdown.subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Controls Input */}
          <div className="mt-8 p-4 bg-muted rounded-lg border">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Preview Controls</p>
                <div className="flex gap-4 mt-2">
                  <div>
                    <Label className="text-xs">Net Weight (g)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={previewNetWeight}
                      onChange={(e) => setPreviewNetWeight(parseFloat(e.target.value) || 0)}
                      className="w-24 h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Metal Rate (₹/g)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={previewMetalRate}
                      onChange={(e) => setPreviewMetalRate(parseFloat(e.target.value) || 0)}
                      className="w-24 h-8"
                    />
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Calculated Total</p>
                <p className="text-3xl font-bold tracking-tight">₹{liveBreakdown.subtotal.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {isCustomDynamic && (
        <div className="flex items-center justify-between">
          {hasUnsavedChanges && (
            <div className="flex items-center text-amber-600 text-sm">
              <span className="h-2 w-2 bg-amber-500 rounded-full mr-2" />
              Unsaved changes
            </div>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => refetchSummary()} disabled={isLoadingSummary}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleSave} disabled={isUpdating || !hasUnsavedChanges}>
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPricingPage;
