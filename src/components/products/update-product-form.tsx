import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
import FormImageInput from "../form/FormImage";
import FormInput from "../form/FormInput";
import FormTextArea from "../form/FormTextArea";
import {
  useGetProduct,
  useUpdateProduct,
} from "@/lib/react-query/product-query";
import FormProvider from "../form/FormProvider";
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LoadingScreen from "../common/loading-screen";
import FormSwitch from "../form/form-switch";
import {
  useGetAllMaterials,
  useGetAllGenders,
  useGetAllItems,
  useGetAllCategories,
  useGetAllSubcategories,
} from "@/lib/react-query/category-hierarchy-query";
import { useGetAllMetalPrices } from "@/lib/react-query/metal-price-query";
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
import { toast } from "sonner";

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

// Validation schema for edit form
const editProductSchema = z.object({
  productTitle: z.string().min(3, "Product title must be at least 3 characters"),
  productSlug: z.string().min(1, "Product slug is required"),
  productDescription: z.string().min(10, "Product description is required and must be at least 10 characters"),
  careHandling: z.string().optional(),

  // Weights
  grossWeight: z.number().min(0.001, "Gross weight must be positive"),
  netWeight: z.number().min(0.001, "Net weight must be positive"),

  // Gemstones
  gemstones: z.array(gemstoneSchema).max(50, "Maximum 50 gemstones allowed").optional(),

  // Pricing
  pricingMode: z.enum(["SUBCATEGORY_DYNAMIC", "STATIC_PRICE"]),
  staticPrice: z.number().optional(),
  salePrice: z.number().min(0).optional(),

  // Status & Features
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),

  // Media & SEO
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

type EditProductFormData = z.infer<typeof editProductSchema>;

// Helper function to extract metal type from material
const extractMetalType = (material: any): string | null => {
  if (!material) return null;

  if (material.metalType) return material.metalType;

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

const UpdateProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [weightWarning, setWeightWarning] = useState<string | null>(null);

  // Load product data
  const { data: productDataResponse, isLoading: productLoading } = useGetProduct(id ?? "");
  const product = productDataResponse?.data?.data?.product || productDataResponse?.data?.product;

  // Mutation hook
  const { mutate: updateProduct, isPending } = useUpdateProduct();

  // Fetch hierarchy data
  const { data: materialsRaw } = useGetAllMaterials();
  const { data: gendersRaw } = useGetAllGenders();
  const { data: itemsRaw } = useGetAllItems();
  const { data: categoriesRaw } = useGetAllCategories();
  const { data: subcategoriesRaw } = useGetAllSubcategories();
  const { data: metalPricesData } = useGetAllMetalPrices();

  // Extract arrays from API responses
  const materials = useMemo(() => {
    const d = materialsRaw?.data?.materials ?? materialsRaw?.materials;
    return Array.isArray(d) ? d : [];
  }, [materialsRaw]);

  const genders = useMemo(() => {
    const d = gendersRaw?.data?.genders ?? gendersRaw?.genders;
    return Array.isArray(d) ? d : [];
  }, [gendersRaw]);

  const items = useMemo(() => {
    const d = itemsRaw?.data?.items ?? itemsRaw?.items;
    return Array.isArray(d) ? d : [];
  }, [itemsRaw]);

  const categories = useMemo(() => {
    const d = categoriesRaw?.data?.categories ?? categoriesRaw?.categories;
    return Array.isArray(d) ? d : [];
  }, [categoriesRaw]);

  const subcategories = useMemo(() => {
    const d = subcategoriesRaw?.data?.subcategories ?? subcategoriesRaw?.subcategories;
    return Array.isArray(d) ? d : [];
  }, [subcategoriesRaw]);

  // Resolve current product's hierarchy names
  const currentHierarchyNames = useMemo(() => {
    if (!product) return null;

    const names: Record<string, string> = {};

    if (product.materialId) {
      const mat = materials.find(m => m._id === product.materialId);
      names.material = mat?.displayName || mat?.name || 'Unknown';
    }
    if (product.genderId) {
      const gen = genders.find(g => g._id === product.genderId);
      names.gender = gen?.name || 'Unknown';
    }
    if (product.itemId) {
      const itm = items.find(i => i._id === product.itemId);
      names.item = itm?.name || 'Unknown';
    }
    if (product.categoryId) {
      const cat = categories.find(c => c._id === product.categoryId);
      names.category = cat?.name || 'Unknown';
    }
    if (product.subcategoryId) {
      const subcat = subcategories.find(s => s._id === product.subcategoryId);
      names.subcategory = subcat?.name || 'Unknown';
    }

    return names;
  }, [product, materials, genders, items, categories, subcategories]);

  // Form initialization
  const defaultValues: EditProductFormData = {
    productTitle: "",
    productSlug: "",
    productDescription: "",
    careHandling: "",
    grossWeight: 0,
    netWeight: 0,
    gemstones: [],
    pricingMode: "SUBCATEGORY_DYNAMIC",
    staticPrice: undefined,
    salePrice: undefined,
    isActive: true,
    isFeatured: false,
    productImageUrl: "",
    seoTitle: "",
    seoDescription: "",
  };

  const form = useForm<EditProductFormData>({
    resolver: zodResolver(editProductSchema),
    defaultValues,
  });

  const { fields: gemstoneFields, append: addGemstone, remove: removeGemstone } = useFieldArray({
    control: form.control,
    name: "gemstones",
  });

  // Watch form values
  const grossWeight = form.watch("grossWeight");
  const netWeight = form.watch("netWeight");
  const pricingMode = form.watch("pricingMode");

  // Pre-populate form when product data loads
  useEffect(() => {
    if (product) {
      const formData: EditProductFormData = {
        productTitle: product.productTitle || "",
        productSlug: product.productSlug || "",
        productDescription: product.productDescription || "",
        careHandling: product.careHandling || "",
        grossWeight: product.grossWeight || 0,
        netWeight: product.netWeight || 0,
        gemstones: product.gemstones || [],
        pricingMode: product.pricingMode || "SUBCATEGORY_DYNAMIC",
        staticPrice: product.staticPrice || undefined,
        salePrice: product.salePrice || undefined,
        isActive: product.isActive ?? true,
        isFeatured: product.isFeatured ?? false,
        productImageUrl: Array.isArray(product.productImageUrl)
          ? product.productImageUrl[0]
          : product.productImageUrl || "",
        seoTitle: product.seoTitle || "",
        seoDescription: product.seoDescription || "",
      };
      form.reset(formData);
    }
  }, [product, form]);

  // Weight warning check
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

  // Auto-fill static price with current market value when STATIC_PRICE is selected
  useEffect(() => {
    if (pricingMode === "STATIC_PRICE" && product && netWeight > 0) {
      const metalType = product.metalType;
      const prices = metalPricesData?.data?.prices || metalPricesData?.prices || [];

      if (metalType && prices.length > 0) {
        const metalPrice = prices.find((p: any) => p.metalType === metalType);
        if (metalPrice && metalPrice.pricePerGram) {
          const marketPrice = metalPrice.pricePerGram * netWeight;
          const currentStaticPrice = form.getValues("staticPrice");
          if (currentStaticPrice === undefined || currentStaticPrice === null || currentStaticPrice === 0) {
            form.setValue("staticPrice", Math.round(marketPrice), { shouldDirty: true });
          }
        }
      }
    }
  }, [pricingMode, netWeight, product, metalPricesData, form]);

  const onSubmit = (data: EditProductFormData) => {
    toast.dismiss();

    try {
      const transformedData = {
        productTitle: data.productTitle,
        productSlug: data.productSlug,
        productDescription: data.productDescription,
        careHandling: data.careHandling || "",
        grossWeight: data.grossWeight,
        netWeight: data.netWeight,
        gemstones: data.gemstones || [],
        pricingMode: data.pricingMode,
        staticPrice: data.pricingMode === "STATIC_PRICE" ? data.staticPrice : undefined,
        salePrice: data.salePrice || undefined,
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
        productImageUrl: data.productImageUrl ? [data.productImageUrl] : [],
        seoTitle: data.seoTitle || "",
        seoDescription: data.seoDescription || "",
      };

      updateProduct(
        {
          product: transformedData,
          _id: id,
        },
        {
          onSuccess: () => {
            toast.success("Product updated successfully!");
            setTimeout(() => {
              navigate("/dashboard/products/list");
            }, 1500);
          },
          onError: (error: any) => {
            let errorMsg = "Failed to update product. Please try again.";

            if (error.response?.data?.error?.message) {
              errorMsg = error.response.data.error.message;
            } else if (error.message) {
              errorMsg = error.message;
            }

            toast.error(errorMsg);
          },
        }
      );
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while processing your request");
    }
  };

  if (productLoading) return <LoadingScreen />;

  return (
    <section className="flex flex-col space-y-6">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <p className="text-sm text-gray-500">Update your jewelry product information</p>
      </header>

      <FormProvider
        methods={form}
        onSubmit={form.handleSubmit(
          (data) => onSubmit(data),
          (errors) => {
            console.error("Validation errors:", errors);
            toast.error("Please fill in all required fields correctly");
          }
        )}
        className="space-y-6"
      >
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

            {/* Category Info - Read Only */}
            {product && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Category Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* SKU Badge */}
                  <div>
                    <Label className="text-sm font-medium text-gray-600">SKU</Label>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-base px-3 py-1">
                        {product.skuNo}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">SKU cannot be changed after creation</p>
                  </div>

                  {/* Category Hierarchy Display */}
                  {currentHierarchyNames && (
                    <div className="p-3 bg-blue-50 rounded-md space-y-3 mt-4">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Category Hierarchy</span>
                      </div>
                      <div className="text-sm text-blue-700 space-y-2">
                        {currentHierarchyNames.material && (
                          <div>
                            <span className="text-xs font-medium text-blue-600">Material:</span>
                            <span className="ml-2">{currentHierarchyNames.material}</span>
                          </div>
                        )}
                        {currentHierarchyNames.gender && (
                          <div>
                            <span className="text-xs font-medium text-blue-600">Gender:</span>
                            <span className="ml-2">{currentHierarchyNames.gender}</span>
                          </div>
                        )}
                        {currentHierarchyNames.item && (
                          <div>
                            <span className="text-xs font-medium text-blue-600">Item:</span>
                            <span className="ml-2">{currentHierarchyNames.item}</span>
                          </div>
                        )}
                        {currentHierarchyNames.category && (
                          <div>
                            <span className="text-xs font-medium text-blue-600">Category:</span>
                            <span className="ml-2">{currentHierarchyNames.category}</span>
                          </div>
                        )}
                        {currentHierarchyNames.subcategory && (
                          <div>
                            <span className="text-xs font-medium text-blue-600">Subcategory:</span>
                            <span className="ml-2">{currentHierarchyNames.subcategory}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-blue-600 mt-2">Category hierarchy cannot be changed after creation</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
                <FormInput
                  control={form.control}
                  name="productSlug"
                  label="Product Slug"
                  placeholder="product-slug"
                />
                <FormTextArea
                  control={form.control}
                  name="productDescription"
                  label="Description *"
                  placeholder="Enter product description (minimum 10 characters)"
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
                {product && (
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <Label className="text-xs text-gray-600">Current Base Price</Label>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                      ₹{product.regularPrice || product.calculatedPrice || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Auto-calculated from weights and metal rates</p>
                  </div>
                )}

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
                  <div className="space-y-2">
                    <Label htmlFor="staticPrice">Static Price (₹)</Label>
                    <Input
                      id="staticPrice"
                      type="number"
                      step="0.01"
                      {...form.register("staticPrice", { valueAsNumber: true })}
                      placeholder="Enter fixed price"
                    />
                    {product && netWeight > 0 && (() => {
                      const metalType = product.metalType;
                      const prices = metalPricesData?.data?.prices || metalPricesData?.prices || [];
                      const metalPrice = prices.find((p: any) => p.metalType === metalType);
                      const suggestedPrice = metalPrice ? Math.round(metalPrice.pricePerGram * netWeight) : 0;

                      return suggestedPrice > 0 ? (
                        <p className="text-xs text-blue-600">
                          Suggested market price: ₹{suggestedPrice}
                          (based on {metalType} rate and {netWeight}g net weight)
                        </p>
                      ) : null;
                    })()}
                    {form.formState.errors.staticPrice && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.staticPrice.message}</p>
                    )}
                  </div>
                )}

                {pricingMode === "SUBCATEGORY_DYNAMIC" && (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">
                      Price will be calculated automatically based on:
                    </p>
                    <ul className="text-xs text-gray-500 mt-2 space-y-1">
                      <li>• Metal rate for {product?.metalType || "selected material"}</li>
                      <li>• Net weight: {netWeight || 0}g</li>
                      <li>• Subcategory pricing config</li>
                      <li>• Gemstone costs (if any)</li>
                    </ul>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <Label htmlFor="salePrice">Sale Price (₹) - Optional</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    {...form.register("salePrice", { valueAsNumber: true })}
                    placeholder="Leave empty for no discount"
                  />
                  <p className="text-xs text-gray-500 mt-1">Used for festival/seasonal sales and promotions</p>
                </div>

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
                      "Update Product"
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

export default UpdateProductForm;
