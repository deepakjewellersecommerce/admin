import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
import FormImageInput from "../form/FormImage";
import FormInput from "../form/FormInput";
import FormTextArea from "../form/FormTextArea";
import { useAddProduct } from "@/lib/react-query/product-query";
import FormProvider from "../form/FormProvider";
import { useMemo, useEffect, useState } from "react";
import FormSwitch from "../form/form-switch";
import FormGroupSelect from "../form/FormCombobox";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  useGetAllSubcategoriesFlat,
} from "@/lib/react-query/category-hierarchy-query";
import type { SubcategoryFlat } from "@/lib/axios/category-hierarchy-API";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { AlertCircle, Plus, Trash2, Calculator, Info } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

// Gemstone types
const GEMSTONE_TYPES = [
  "Diamond",
  "Ruby",
  "Emerald",
  "Sapphire",
  "Pearl",
  "Topaz",
  "Amethyst",
  "Garnet",
  "Opal",
  "Turquoise",
  "Aquamarine",
  "Peridot",
  "Citrine",
  "Tanzanite",
  "Custom",
] as const;

// Gemstone schema
const gemstoneSchema = z.object({
  name: z.enum(GEMSTONE_TYPES),
  customName: z.string().optional(),
  weight: z.number().min(0.001, "Weight must be at least 0.001 carats"),
  pricePerCarat: z.number().min(0, "Price cannot be negative"),
});

// Validation schema
const productSchema = z.object({
  productTitle: z.string().min(3, "Product title must be at least 3 characters"),
  productSlug: z.string().min(1, "Product slug is required"),
  skuNo: z.string().min(1, "SKU is required"),
  productDescription: z.string().optional(),
  careHandling: z.string().optional(),

  // Category Hierarchy
  materialId: z.string().min(1, "Material is required"),
  genderId: z.string().min(1, "Gender is required"),
  itemId: z.string().min(1, "Item type is required"),
  categoryId: z.string().min(1, "Category is required"),
  subcategoryId: z.string().min(1, "Subcategory is required"),

  // Weights
  grossWeight: z.number().min(0.001, "Gross weight must be positive"),
  netWeight: z.number().min(0.001, "Net weight must be positive"),

  // Gemstones
  gemstones: z.array(gemstoneSchema).max(50, "Maximum 50 gemstones allowed").optional(),

  // Pricing Mode
  pricingMode: z.enum(["SUBCATEGORY_DYNAMIC", "STATIC_PRICE"]),
  staticPrice: z.number().optional(),

  // Other fields
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  productImageUrl: z.string().optional(),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
}).refine(
  (data) => data.netWeight <= data.grossWeight,
  {
    message: "Net weight cannot exceed gross weight",
    path: ["netWeight"],
  }
).refine(
  (data) => data.pricingMode !== "STATIC_PRICE" || (data.staticPrice && data.staticPrice > 0),
  {
    message: "Static price is required when using static pricing mode",
    path: ["staticPrice"],
  }
);

type ProductFormData = z.infer<typeof productSchema>;

const defaultValues: ProductFormData = {
  productTitle: "",
  productSlug: "",
  skuNo: "",
  productDescription: "",
  careHandling: "",
  materialId: "",
  genderId: "",
  itemId: "",
  categoryId: "",
  subcategoryId: "",
  grossWeight: 0,
  netWeight: 0,
  gemstones: [],
  pricingMode: "SUBCATEGORY_DYNAMIC",
  staticPrice: undefined,
  isActive: true,
  isFeatured: false,
  productImageUrl: "",
  seoTitle: "",
  seoDescription: "",
};

const ProductFormV2 = () => {
  const navigate = useNavigate();
  const [pricePreview] = useState<any>(null);
  const [weightWarning, setWeightWarning] = useState<string | null>(null);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  const { fields: gemstoneFields, append: addGemstone, remove: removeGemstone } = useFieldArray({
    control: form.control,
    name: "gemstones",
  });

  // Watch form values
  const subcategoryId = form.watch("subcategoryId");
  const grossWeight = form.watch("grossWeight");
  const netWeight = form.watch("netWeight");
  const pricingMode = form.watch("pricingMode");

  // Fetch flat subcategories for single dropdown
  const { data: subcategoriesData } = useGetAllSubcategoriesFlat();

  const { mutate: addProduct, isPending } = useAddProduct();
  const { isPending: isPreviewLoading } = useGetPricePreview();

  // Build options
  const materialOptions = useMemo(() => {
    const materials = materialsData?.data?.materials || [];
    return materials.map((m: any) => ({
      label: `${m.name} (${m.metalType})`,
      value: m._id,
    }));
  }, [materialsData]);

  const genderOptions = useMemo(() => {
    const genders = gendersData?.data?.genders || [];
    return genders.map((g: any) => ({
      label: g.name,
      value: g._id,
    }));
  }, [gendersData]);

  const itemOptions = useMemo(() => {
    const items = itemsData?.data?.items || [];
    return items.map((i: any) => ({
      label: i.name,
      value: i._id,
    }));
  }, [itemsData]);

  const categoryOptions = useMemo(() => {
    const categories = categoriesData?.data?.categories || [];
    return categories.map((c: any) => ({
      label: c.name,
      value: c._id,
    }));
  }, [categoriesData]);
>>>>>>> Stashed changes

  // Build flat subcategory options for single dropdown
  const subcategoryOptions = useMemo(() => {
    const subs: SubcategoryFlat[] = subcategoriesData?.data?.subcategories || [];
    return subs.map((s) => ({
      label: s.displayLabel,
      value: s._id,
    }));
  }, [subcategoriesData]);

  // Get selected subcategory details for display and auto-populating hierarchy
  const selectedSubcategory = useMemo((): SubcategoryFlat | null => {
    if (!subcategoriesData?.data?.subcategories || !subcategoryId) return null;
    return subcategoriesData.data.subcategories.find((s: SubcategoryFlat) => s._id === subcategoryId) || null;
  }, [subcategoriesData, subcategoryId]);

  // Auto-populate hierarchy fields when subcategory is selected
  useEffect(() => {
    if (selectedSubcategory) {
      form.setValue("materialId", selectedSubcategory.materialId || "");
      form.setValue("genderId", selectedSubcategory.genderId || "");
      form.setValue("itemId", selectedSubcategory.itemId || "");
      form.setValue("categoryId", selectedSubcategory.categoryId || "");
    }
  }, [selectedSubcategory, form]);

  // Auto-generate slug
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "productTitle") {
        const titleVal = value.productTitle || "";
        const slugDirty = form.formState?.dirtyFields?.productSlug;
        if (!slugDirty) {
          const generated = titleVal.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
          form.setValue("productSlug", generated, {
            shouldDirty: false,
            shouldTouch: false,
            shouldValidate: false,
          });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Check weight difference warning
  useEffect(() => {
    if (grossWeight > 0 && netWeight > 0) {
      const diff = ((grossWeight - netWeight) / grossWeight) * 100;
      if (diff > 5) {
        setWeightWarning(`Large weight difference (${diff.toFixed(1)}%). Please verify weights.`);
      } else {
        setWeightWarning(null);
      }
    } else {
      setWeightWarning(null);
    }
  }, [grossWeight, netWeight]);

  // Calculate price preview
  const handlePreviewPrice = () => {
    if (!subcategoryId || !grossWeight || !netWeight) {
      toast.error("Please fill in subcategory and weights first");
      return;
    }

    // For new products, we'll simulate a preview
    // In reality, you'd call the API with a temporary product ID or use a preview endpoint
    toast.info("Price preview will be available after product creation");
  };

  const onSubmit = async (data: ProductFormData) => {
    toast.dismiss();

    try {
      const productData = {
        productTitle: data.productTitle,
        productSlug: data.productSlug,
        skuNo: data.skuNo,
        productDescription: data.productDescription || "",
        careHandling: data.careHandling || "",
        subcategoryId: data.subcategoryId,
        // Include hierarchy fields from selected subcategory
        materialId: data.materialId,
        genderId: data.genderId,
        itemId: data.itemId,
        categoryId: data.categoryId,
        metalType: selectedSubcategory?.material?.metalType || "",
        grossWeight: data.grossWeight,
        netWeight: data.netWeight,
        gemstones: data.gemstones || [],
        pricingMode: data.pricingMode,
        staticPrice: data.pricingMode === "STATIC_PRICE" ? data.staticPrice : undefined,
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
        seoTitle: data.seoTitle || "",
        seoDescription: data.seoDescription || "",
        productImageUrl: data.productImageUrl ? [data.productImageUrl] : [],
      };

      // Handle file uploads
      let transformedData: any = productData;
      try {
        const selectedFiles = ((form.getValues() as any).images || []) as File[];
        if (selectedFiles && selectedFiles.length > 0) {
          const formData = new FormData();
          Object.entries(productData).forEach(([key, value]) => {
            if (key === "gemstones") {
              formData.append(key, JSON.stringify(value));
            } else if (value !== undefined && value !== null) {
              formData.append(key, String(value));
            }
          });
          selectedFiles.forEach((file) => {
            formData.append("images", file);
          });
          transformedData = formData;
        }
      } catch {
        transformedData = productData;
      }

      addProduct(transformedData, {
        onSuccess: () => {
          toast.success("Product added successfully!");
          navigate("/dashboard/products/list");
        },
        onError: (error: any) => {
          const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || "Unknown error";
          toast.error(`Failed to add product: ${errorMsg}`);
        },
      });
    } catch (error) {
      toast.error("An error occurred while processing your request");
    }
  };

  return (
    <section className="flex flex-col space-y-6">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-bold">Add Product</h1>
        <p className="text-sm text-gray-500">Create a new jewelry product with dynamic pricing</p>
      </header>

      <FormProvider methods={form} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-6">
                <FormSwitch
                  control={form.control}
                  name="isActive"
                  label="Active"
                  description="Product visible to customers"
                />
                <FormSwitch
                  control={form.control}
                  name="isFeatured"
                  label="Featured"
                  description="Show in featured section"
                />
              </CardContent>
            </Card>

            {/* Category Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Subcategory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormGroupSelect
                  control={form.control}
                  name="subcategoryId"
                  label="Select Subcategory"
                  placeholder="Search or select subcategory..."
                  options={subcategoryOptions}
                />

                {selectedSubcategory && (
                  <div className="p-3 bg-blue-50 rounded-md space-y-2">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Selected Hierarchy</span>
                    </div>
                    <div className="text-sm text-blue-700">
                      {selectedSubcategory.displayLabel}
                    </div>
                    {selectedSubcategory.material && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs text-blue-600">Metal Type:</span>
                        <Badge variant="secondary">{selectedSubcategory.material.metalType}</Badge>
                        {selectedSubcategory.hasPricingConfig && (
                          <Badge variant="outline" className="text-green-600 border-green-300">Has Pricing</Badge>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Basic Info Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormInput
                  control={form.control}
                  name="productTitle"
                  label="Product Title"
                  placeholder="Enter product title"
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    control={form.control}
                    name="productSlug"
                    label="Product Slug"
                    placeholder="product-slug"
                  />
                  <FormInput
                    control={form.control}
                    name="skuNo"
                    label="SKU Number"
                    placeholder="SKU-001"
                  />
                </div>
                <FormTextArea
                  control={form.control}
                  name="productDescription"
                  label="Description"
                  placeholder="Enter product description"
                />
                <FormTextArea
                  control={form.control}
                  name="careHandling"
                  label="Care & Handling"
                  placeholder="Enter care instructions"
                />
              </CardContent>
            </Card>

            {/* Weights Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="grossWeight">Gross Weight (grams)</Label>
                    <Input
                      id="grossWeight"
                      type="number"
                      step="0.001"
                      {...form.register("grossWeight", { valueAsNumber: true })}
                      placeholder="0.000"
                    />
                    {form.formState.errors.grossWeight && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.grossWeight.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="netWeight">Net Weight (grams)</Label>
                    <Input
                      id="netWeight"
                      type="number"
                      step="0.001"
                      {...form.register("netWeight", { valueAsNumber: true })}
                      placeholder="0.000"
                    />
                    {form.formState.errors.netWeight && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.netWeight.message}</p>
                    )}
                  </div>
                </div>

                {weightWarning && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{weightWarning}</AlertDescription>
                  </Alert>
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

            {/* Images Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Images</CardTitle>
              </CardHeader>
              <CardContent>
                <FormImageInput name="productImageUrl" label="Product Images" />
              </CardContent>
            </Card>

            {/* SEO Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormInput
                  control={form.control}
                  name="seoTitle"
                  label="SEO Title"
                  placeholder="SEO optimized title (max 60 chars)"
                />
                <FormTextArea
                  control={form.control}
                  name="seoDescription"
                  label="SEO Description"
                  placeholder="SEO optimized description (max 160 chars)"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Pricing */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Pricing Mode</Label>
                  <Select
                    value={pricingMode}
                    onValueChange={(val) => form.setValue("pricingMode", val as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUBCATEGORY_DYNAMIC">
                        Dynamic (Inherit from Subcategory)
                      </SelectItem>
                      <SelectItem value="STATIC_PRICE">
                        Static Price
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {pricingMode === "SUBCATEGORY_DYNAMIC"
                      ? "Price calculated using subcategory pricing config and live metal rates"
                      : "Fixed price that doesn't change with metal rates"}
                  </p>
                </div>

                {pricingMode === "STATIC_PRICE" && (
                  <div>
                    <Label htmlFor="staticPrice">Static Price (₹)</Label>
                    <Input
                      id="staticPrice"
                      type="number"
                      step="0.01"
                      {...form.register("staticPrice", { valueAsNumber: true })}
                      placeholder="Enter fixed price"
                    />
                    {form.formState.errors.staticPrice && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.staticPrice.message}</p>
                    )}
                  </div>
                )}

                {pricingMode === "SUBCATEGORY_DYNAMIC" && subcategoryId && (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">
                      Price will be calculated automatically based on:
                    </p>
                    <ul className="text-xs text-gray-500 mt-2 space-y-1">
                      <li>• Metal rate for {selectedSubcategory?.material?.metalType || "selected material"}</li>
                      <li>• Net weight: {netWeight || 0}g</li>
                      <li>• Subcategory pricing config</li>
                      <li>• Gemstone costs (if any)</li>
                    </ul>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handlePreviewPrice}
                  disabled={!subcategoryId || !grossWeight || !netWeight}
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Preview Price
                </Button>

                <div className="pt-4 border-t">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <div className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </div>
                    ) : (
                      "Create Product"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </FormProvider>
    </section>
  );
};

export default ProductFormV2;
