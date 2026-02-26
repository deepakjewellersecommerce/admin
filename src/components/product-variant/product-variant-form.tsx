import { z } from "zod";
import FormProvider from "../form/FormProvider";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormInput from "../form/FormInput";
import { Button } from "../ui/button";
import { Loader2, Info, Plus, Minus, Trash2, Calculator } from "lucide-react";
import { getSizeOptionsForItem } from "@/lib/utils";
import { useGetColor } from "@/lib/react-query/color-query";
import { useEffect, useMemo, useState, useCallback } from "react";
import { ComboboxSelect } from "../ui/combobox";
import { FormLabel } from "../ui/form";
import FormSwitch from "../form/form-switch";
import FormImageInput from "../form/FormImage";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const GEMSTONE_TYPES = [
  "Diamond", "Ruby", "Emerald", "Sapphire", "Pearl",
  "Topaz", "Amethyst", "Garnet", "Opal", "Turquoise",
  "Aquamarine", "Peridot", "Citrine", "Tanzanite", "Custom",
] as const;

const gemstoneSchema = z.object({
  name: z.enum(GEMSTONE_TYPES),
  customName: z.string().optional(),
  weight: z.number().min(0.001, "Weight must be at least 0.001 carats"),
  pricePerCarat: z.number().min(0, "Price cannot be negative"),
});

const ProductVariantSchema = z.object({
  productId: z.string().optional(),
  size: z.string().min(1, "Select a size"),
  customSize: z.string().optional(),
  color: z.string().optional(),
  price: z
    .string()
    .min(1, "Enter variant price")
    .refine((val) => !isNaN(Number(val)), {
      message: "Price must be a number",
    }),
  salePrice: z.string().refine((val) => !isNaN(Number(val)), {
    message: "Sale Price must be a number",
  }),
  weight: z.string().optional(),
  isActive: z.boolean().optional(),
  stock: z.string().refine((val) => !isNaN(Number(val)), {
    message: "Stock must be a number",
  }),
  stockAdjustment: z.string().optional(),
  gemstones: z.array(gemstoneSchema).max(50, "Maximum 50 gemstones allowed").optional(),
  imageUrls: z.array(z.string()).optional(),
  images: z.any().optional(),
});

export type ProductVariantType = z.infer<typeof ProductVariantSchema>;

type Props = {
  onSubmit: (data: any) => void;
  defaultValues?: ProductVariantType;
  isPending: boolean;
  productPrice?: number;
  productSalePrice?: number;
  productTitle?: string;
  itemName?: string;
  isEdit?: boolean;
  currentStock?: number;
  productNetWeight?: number;
};

const ProductVariantForm = ({
  onSubmit,
  defaultValues,
  isPending,
  productPrice,
  productSalePrice,
  productTitle,
  itemName,
  isEdit = false,
  currentStock = 0,
  productNetWeight,
}: Props) => {
  const form = useForm<ProductVariantType>({
    resolver: zodResolver(ProductVariantSchema),
    defaultValues: defaultValues,
  });

  const { fields: gemstoneFields, append: addGemstone, remove: removeGemstone } = useFieldArray({
    control: form.control,
    name: "gemstones",
  });

  // Filter size options based on product's item type
  const filteredSizeOptions = useMemo(
    () => getSizeOptionsForItem(itemName),
    [itemName]
  );

  const { size, price, salePrice, color, weight: variantWeight, gemstones } = form.watch();

  // Fetch colors for the selector
  const { data: colorsRaw } = useGetColor();
  const colorOptions = useMemo(() => {
    const colors = colorsRaw?.data?.data?.colors ?? colorsRaw?.data?.colors ?? [];
    return colors.map((c: any) => ({ label: c.color_name, value: c._id }));
  }, [colorsRaw]);

  // ── Auto Price Calculation ─────────────────────────────────────────
  // Price per gram from product
  const pricePerGram = useMemo(() => {
    if (!productPrice || !productNetWeight || productNetWeight <= 0) return null;
    return productPrice / productNetWeight;
  }, [productPrice, productNetWeight]);

  // Sale price per gram
  const salePricePerGram = useMemo(() => {
    if (!productSalePrice || !productNetWeight || productNetWeight <= 0) return null;
    return productSalePrice / productNetWeight;
  }, [productSalePrice, productNetWeight]);

  // Variant gemstone total cost
  const variantGemstoneCost = useMemo(() => {
    if (!gemstones || gemstones.length === 0) return 0;
    return gemstones.reduce((sum, g) => {
      const w = Number(g.weight) || 0;
      const p = Number(g.pricePerCarat) || 0;
      return sum + Math.round(w * p * 100) / 100;
    }, 0);
  }, [gemstones]);

  // Auto-calculated prices
  const autoPrice = useMemo(() => {
    if (!pricePerGram || !variantWeight) return null;
    const w = Number(variantWeight);
    if (!w || w <= 0) return null;
    return Math.round((pricePerGram * w + variantGemstoneCost) * 100) / 100;
  }, [pricePerGram, variantWeight, variantGemstoneCost]);

  const autoSalePrice = useMemo(() => {
    if (!salePricePerGram || !variantWeight) return null;
    const w = Number(variantWeight);
    if (!w || w <= 0) return null;
    return Math.round((salePricePerGram * w + variantGemstoneCost) * 100) / 100;
  }, [salePricePerGram, variantWeight, variantGemstoneCost]);

  // Auto-update price fields when weight or gemstones change
  useEffect(() => {
    if (autoPrice != null && autoPrice > 0) {
      form.setValue("price", String(autoPrice));
    }
  }, [autoPrice, form]);

  useEffect(() => {
    if (autoSalePrice != null && autoSalePrice > 0) {
      form.setValue("salePrice", String(autoSalePrice));
    }
  }, [autoSalePrice, form]);

  // Fallback: auto-fill from product price if no weight-based calc available
  useEffect(() => {
    if (pricePerGram) return; // weight-based calc takes priority
    if (productPrice && productPrice > 0) {
      const currentPrice = form.getValues("price");
      if (!currentPrice || currentPrice === "0") {
        form.setValue("price", String(productPrice));
      }
    }
  }, [productPrice, pricePerGram, form]);

  useEffect(() => {
    if (salePricePerGram) return;
    if (productSalePrice && productSalePrice > 0) {
      const currentSalePrice = form.getValues("salePrice");
      if (!currentSalePrice || currentSalePrice === "0") {
        form.setValue("salePrice", String(productSalePrice));
      }
    }
  }, [productSalePrice, salePricePerGram, form]);

  // Calculate discount percentage
  const discountPercent = useMemo(() => {
    const p = Number(price);
    const sp = Number(salePrice);
    if (p > 0 && sp > 0 && sp < p) {
      return Math.round(((p - sp) / p) * 100);
    }
    return 0;
  }, [price, salePrice]);


  return (
    <FormProvider
      className="space-y-6"
      methods={form}
      onSubmit={form.handleSubmit(onSubmit, (errors) => console.log(errors))}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Variant Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Price Reference & Auto Calculation */}
          {productPrice != null && productPrice > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  Price Calculation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Product Base Info */}
                <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                  <div className="text-sm font-medium text-blue-700 mb-2">
                    {productTitle ? `${productTitle} — Product Base` : "Product Base"}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                    <div>Price: <strong>₹{productPrice.toLocaleString("en-IN")}</strong></div>
                    {productNetWeight != null && productNetWeight > 0 && (
                      <div>Net Weight: <strong>{productNetWeight}g</strong></div>
                    )}
                    {pricePerGram != null && (
                      <div>Rate/gram: <strong>₹{Math.round(pricePerGram).toLocaleString("en-IN")}</strong></div>
                    )}
                    {productSalePrice != null && productSalePrice > 0 && (
                      <div>Sale Price: <strong>₹{productSalePrice.toLocaleString("en-IN")}</strong></div>
                    )}
                  </div>
                </div>

                {/* Variant Price Breakdown */}
                {autoPrice != null && Number(variantWeight) > 0 && (
                  <div className="p-3 bg-green-50 rounded-md border border-green-200">
                    <div className="text-sm font-medium text-green-700 mb-2">
                      Variant Price Breakdown
                    </div>
                    <div className="space-y-1 text-sm text-green-800">
                      <div className="flex justify-between">
                        <span>Metal cost ({variantWeight}g × ₹{Math.round(pricePerGram!).toLocaleString("en-IN")}/g)</span>
                        <span className="font-medium">
                          ₹{Math.round(pricePerGram! * Number(variantWeight)).toLocaleString("en-IN")}
                        </span>
                      </div>
                      {variantGemstoneCost > 0 && (
                        <div className="flex justify-between">
                          <span>Gemstone cost ({gemstones?.length} stone{gemstones && gemstones.length !== 1 ? "s" : ""})</span>
                          <span className="font-medium">₹{variantGemstoneCost.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 border-t border-green-300 font-semibold">
                        <span>Auto Price</span>
                        <span>₹{autoPrice.toLocaleString("en-IN")}</span>
                      </div>
                      {autoSalePrice != null && autoSalePrice !== autoPrice && (
                        <div className="flex justify-between font-semibold">
                          <span>Auto Sale Price</span>
                          <span>₹{autoSalePrice.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Prices auto-update when weight or gemstones change. You can override manually.
                    </p>
                  </div>
                )}

                {/* No weight entered hint */}
                {pricePerGram != null && (!variantWeight || Number(variantWeight) <= 0) && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Enter variant weight below to auto-calculate price
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Variant Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Size */}
              <div className="flex flex-col gap-1">
                <FormLabel>Size</FormLabel>
                <ComboboxSelect
                  className="w-full"
                  name="size"
                  value={size}
                  placeholder="Select Size"
                  onValueChange={(e) => {
                    form.setValue("size", e, { shouldValidate: true });
                    if (e !== "Custom") {
                      form.setValue("customSize", "");
                    }
                  }}
                  options={filteredSizeOptions}
                />
                {form.formState.errors.size && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.size.message}
                  </p>
                )}
              </div>

              {/* Custom Size Input */}
              {size === "Custom" && (
                <div className="flex flex-col gap-1">
                  <FormLabel>Custom Size</FormLabel>
                  <Input
                    placeholder="Enter custom size (e.g. 2.5 inches)"
                    {...form.register("customSize")}
                  />
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Specify a size not covered by the standard options
                  </p>
                </div>
              )}

              {/* Metal Color */}
              <div className="flex flex-col gap-1">
                <FormLabel>Metal Color</FormLabel>
                <ComboboxSelect
                  className="w-full"
                  name="color"
                  value={color ?? ""}
                  placeholder="Select Metal Color"
                  onValueChange={(e) => {
                    form.setValue("color", e, { shouldValidate: true });
                  }}
                  options={colorOptions}
                />
              </div>

              {/* Price & Sale Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="Price (₹)"
                  name="price"
                  control={form.control}
                  type="number"
                  placeholder="Enter price"
                  required
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FormLabel>Sale Price (₹)</FormLabel>
                    {discountPercent > 0 && (
                      <Badge variant="secondary" className="text-green-700 bg-green-100">
                        {discountPercent}% off
                      </Badge>
                    )}
                  </div>
                  <Input
                    type="number"
                    placeholder="Enter sale price"
                    {...form.register("salePrice")}
                  />
                  {form.formState.errors.salePrice && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.salePrice.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Weight */}
              <FormInput
                label="Weight (grams)"
                name="weight"
                control={form.control}
                type="number"
                placeholder="Enter weight in grams"
              />

              {/* Stock */}
              {isEdit ? (
                <StockAdjustment
                  currentStock={currentStock}
                  form={form}
                />
              ) : (
                <FormInput
                  label="Stock"
                  name="stock"
                  control={form.control}
                  type="number"
                  placeholder="Enter stock quantity"
                  required
                />
              )}
            </CardContent>
          </Card>

          {/* Gemstones Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Gemstones</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addGemstone({ name: "Diamond", weight: 0.5, pricePerCarat: 0 })}
                disabled={gemstoneFields.length >= 50}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Gemstone
              </Button>
            </CardHeader>
            <CardContent>
              {gemstoneFields.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No gemstones added</p>
              ) : (
                <div className="space-y-4">
                  {gemstoneFields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-3 p-3 border rounded-md">
                      <div className="flex-1">
                        <Label>Type</Label>
                        <Select
                          value={form.watch(`gemstones.${index}.name`)}
                          onValueChange={(val) => form.setValue(`gemstones.${index}.name`, val as any)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GEMSTONE_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {form.watch(`gemstones.${index}.name`) === "Custom" && (
                        <div className="flex-1">
                          <Label>Custom Name</Label>
                          <Input
                            {...form.register(`gemstones.${index}.customName`)}
                            placeholder="Custom gemstone name"
                          />
                        </div>
                      )}
                      <div className="w-24">
                        <Label>Weight (ct)</Label>
                        <Input
                          type="number"
                          step="0.001"
                          {...form.register(`gemstones.${index}.weight`, { valueAsNumber: true })}
                        />
                      </div>
                      <div className="w-32">
                        <Label>Price/Carat (₹)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          {...form.register(`gemstones.${index}.pricePerCarat`, { valueAsNumber: true })}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeGemstone(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column — Status & Images */}
        <div className="space-y-6">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">Status & Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Is Active Toggle */}
              <FormSwitch
                control={form.control}
                name="isActive"
                label="Active"
                description="If active, this variant will be visible to customers"
              />

              {/* Image Upload */}
              <div>
                <FormImageInput
                  name="imageUrls"
                  label="Variant Images"
                  helperText="Upload images for this variant"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t">
                <Button className="w-full" type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                  {isPending ? "Saving..." : "Submit"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FormProvider>
  );
};

// ── Stock Adjustment Sub-Component (Edit mode) ──────────────────────

function StockAdjustment({
  currentStock,
  form,
}: {
  currentStock: number;
  form: ReturnType<typeof useForm<ProductVariantType>>;
}) {
  const [adjustment, setAdjustment] = useState(0);

  const newStock = currentStock + adjustment;

  const handleAdjustmentChange = useCallback(
    (value: number) => {
      setAdjustment(value);
      form.setValue("stock", String(currentStock + value));
      form.setValue("stockAdjustment", String(value));
    },
    [currentStock, form]
  );

  return (
    <div className="space-y-3">
      <FormLabel>Stock Management</FormLabel>
      <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
        {/* Current Stock Display */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Current Stock</span>
          <span className="text-lg font-semibold">{currentStock}</span>
        </div>

        {/* Adjustment Input */}
        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Adjust By</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => handleAdjustmentChange(adjustment - 1)}
              disabled={newStock <= 0}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              value={adjustment}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                if (currentStock + val >= 0) {
                  handleAdjustmentChange(val);
                }
              }}
              className="text-center"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => handleAdjustmentChange(adjustment + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* New Stock Preview */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm font-medium">New Stock</span>
          <span
            className={`text-lg font-bold ${
              adjustment > 0
                ? "text-green-600"
                : adjustment < 0
                ? "text-red-600"
                : ""
            }`}
          >
            {newStock}
            {adjustment !== 0 && (
              <span className="text-xs ml-1 font-normal">
                ({adjustment > 0 ? "+" : ""}
                {adjustment})
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ProductVariantForm;
