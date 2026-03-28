import { useForm } from "react-hook-form";
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
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  useGetAllSubcategoriesFlat,
  useGetAllMaterials,
  useGetAllGenders,
  useGetAllItems,
  useGetAllCategories,
  useGetAllSubcategories,
  useGetSubcategory,
} from "@/lib/react-query/category-hierarchy-query";
import { useGetAllMetalPrices } from "@/lib/react-query/metal-price-query";
import { useGetNextSKU } from "@/lib/react-query/product-sequence-query";
import type { SubcategoryFlat } from "@/lib/axios/category-hierarchy-API";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { AlertCircle, Calculator, Info, ShieldCheck } from "lucide-react";
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

// Validation schema
const productSchema = z.object({
  productTitle: z.string().min(3, "Product title must be at least 3 characters"),
  productSlug: z.string().min(1, "Product slug is required"),
  skuNo: z.string().min(1, "SKU is required"),
  boxNumber: z.number().int().min(1, "Box number is required"),
  productDescription: z.string().min(10, "Product description is required and must be at least 10 characters"),
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

  // Pricing Mode
  pricingMode: z.enum(["SUBCATEGORY_DYNAMIC", "STATIC_PRICE"]),
  staticPrice: z.preprocess(
    (val) => (val === "" || (typeof val === "number" && isNaN(val as number)) ? undefined : val),
    z.number().min(0, "Static price cannot be negative").optional()
  ),

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
  boxNumber: 1,
  productDescription: "",
  careHandling: "",
  materialId: "",
  genderId: "",
  itemId: "",
  categoryId: "",
  subcategoryId: "",
  grossWeight: 0,
  netWeight: 0,
  pricingMode: "SUBCATEGORY_DYNAMIC",
  staticPrice: undefined,
  isActive: true,
  isFeatured: false,
  productImageUrl: "",
  seoTitle: "",
  seoDescription: "",
};

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

const CARE_OPTIONS = [
  "Store in a cool, dry place",
  "Avoid contact with water",
  "Clean with a soft cloth",
  "Remove before sleeping or exercising",
  "Avoid exposure to chemicals and perfume",
  "Store separately to avoid scratches",
];

const ProductFormV2 = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedSubcategoryId = searchParams.get("subcategoryId") ?? "";

  const [pricePreview] = useState<any>(null);
  const [weightWarning, setWeightWarning] = useState<string | null>(null);
  const [skuPreview, setSkuPreview] = useState<string>("");
  const [selectedCareItems, setSelectedCareItems] = useState<string[]>([]);

  // Hierarchy selection state
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [selectedGenderId, setSelectedGenderId] = useState<string>("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  // Watch form values
  const subcategoryId = form.watch("subcategoryId");
  const boxNumber = form.watch("boxNumber");
  const grossWeight = form.watch("grossWeight");
  const netWeight = form.watch("netWeight");
  const pricingMode = form.watch("pricingMode");

  // Fetch hierarchy data
  const { data: materialsRaw } = useGetAllMaterials();
  const { data: gendersRaw } = useGetAllGenders();
  const { data: itemsRaw } = useGetAllItems();
  const { data: categoriesRaw } = useGetAllCategories({
    ...(selectedMaterialId ? { materialId: selectedMaterialId } : {}),
    ...(selectedGenderId ? { genderId: selectedGenderId } : {}),
    ...(selectedItemId ? { itemId: selectedItemId } : {}),
  });
  const { data: subcategoriesRaw } = useGetAllSubcategories({
    ...(selectedCategoryId ? { categoryId: selectedCategoryId } : {}),
  });

  // Fetch the preselected subcategory (from ?subcategoryId= URL param)
  const { data: preselectedSubRaw } = useGetSubcategory(preselectedSubcategoryId);

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

  // Fetch next SKU for preview
  const { data: skuData, isLoading: skuLoading } = useGetNextSKU(
    subcategoryId,
    boxNumber,
    Boolean(subcategoryId && boxNumber > 0)
  );

  const { data: metalPricesData } = useGetAllMetalPrices();

  const { mutate: addProduct, isPending } = useAddProduct();

  // Get selected subcategory details for display and auto-populating hierarchy
  const selectedSubcategory = useMemo((): any | null => {
    if (!subcategories || !subcategoryId) return null;
    return subcategories.find((s: any) => s._id === subcategoryId) || null;
  }, [subcategories, subcategoryId]);

  // Reset child selections when parent changes
  const handleMaterialChange = (id: string) => {
    console.log("handleMaterialChange:", id);
    setSelectedMaterialId(String(id));
    setSelectedGenderId("");
    setSelectedItemId("");
    setSelectedCategoryId("");
    form.setValue("materialId", String(id), { shouldValidate: false });
    form.setValue("genderId", "", { shouldValidate: false });
    form.setValue("itemId", "", { shouldValidate: false });
    form.setValue("categoryId", "", { shouldValidate: false });
    form.setValue("subcategoryId", "", { shouldValidate: false });
  };

  const handleGenderChange = (id: string) => {
    console.log("handleGenderChange:", id);
    setSelectedGenderId(String(id));
    setSelectedItemId("");
    setSelectedCategoryId("");
    form.setValue("genderId", String(id), { shouldValidate: false });
    form.setValue("itemId", "", { shouldValidate: false });
    form.setValue("categoryId", "", { shouldValidate: false });
    form.setValue("subcategoryId", "", { shouldValidate: false });
  };

  const handleItemChange = (id: string) => {
    console.log("handleItemChange:", id);
    setSelectedItemId(String(id));
    setSelectedCategoryId("");
    form.setValue("itemId", String(id), { shouldValidate: false });
    form.setValue("categoryId", "", { shouldValidate: false });
    form.setValue("subcategoryId", "", { shouldValidate: false });
  };

  const handleCategoryChange = (id: string) => {
    console.log("handleCategoryChange:", id);
    setSelectedCategoryId(String(id));
    form.setValue("categoryId", String(id), { shouldValidate: false });
    form.setValue("subcategoryId", "", { shouldValidate: false });
  };

  const handleSubcategoryChange = (id: string) => {
    console.log("handleSubcategoryChange:", id);
    form.setValue("subcategoryId", String(id), { shouldValidate: true });
  };

  // Auto-populate hierarchy fields from selected state (already strings)
  useEffect(() => {
    if (selectedMaterialId || selectedGenderId || selectedItemId || selectedCategoryId) {
      console.log("Auto-populating from selected state:", {
        materialId: selectedMaterialId,
        genderId: selectedGenderId,
        itemId: selectedItemId,
        categoryId: selectedCategoryId,
      });

      // Use the already-selected string IDs from state, not from selectedSubcategory
      if (selectedMaterialId) {
        form.setValue("materialId", String(selectedMaterialId), { shouldValidate: false });
      }
      if (selectedGenderId) {
        form.setValue("genderId", String(selectedGenderId), { shouldValidate: false });
      }
      if (selectedItemId) {
        form.setValue("itemId", String(selectedItemId), { shouldValidate: false });
      }
      if (selectedCategoryId) {
        form.setValue("categoryId", String(selectedCategoryId), { shouldValidate: false });
      }
    }
  }, [selectedMaterialId, selectedGenderId, selectedItemId, selectedCategoryId, form]);

  // Pre-populate hierarchy from ?subcategoryId URL param
  useEffect(() => {
    if (!preselectedSubcategoryId || !preselectedSubRaw) return;
    const sub =
      preselectedSubRaw?.data?.subcategory ??
      preselectedSubRaw?.subcategory ??
      preselectedSubRaw?.data;
    if (!sub) return;

    const catId =
      typeof sub.categoryId === "object" ? sub.categoryId?._id : sub.categoryId;
    const matId =
      typeof sub.materialId === "object" ? sub.materialId?._id : sub.materialId;
    const genId =
      typeof sub.genderId === "object" ? sub.genderId?._id : sub.genderId;
    const itmId =
      typeof sub.itemId === "object" ? sub.itemId?._id : sub.itemId;

    if (matId) setSelectedMaterialId(matId);
    if (genId) setSelectedGenderId(genId);
    if (itmId) setSelectedItemId(itmId);
    if (catId) {
      setSelectedCategoryId(catId);
      form.setValue("categoryId", catId, { shouldValidate: false });
    }
    form.setValue("subcategoryId", preselectedSubcategoryId, { shouldValidate: false });
  }, [preselectedSubRaw, preselectedSubcategoryId, form]);

  // Auto-update SKU preview when subcategory or box number changes
  useEffect(() => {
    if (skuData?.skuPreview) {
      setSkuPreview(skuData.skuPreview);
      // Auto-populate skuNo field if not manually edited
      const skuDirty = form.formState?.dirtyFields?.skuNo;
      if (!skuDirty) {
        form.setValue("skuNo", skuData.skuPreview, {
          shouldDirty: false,
          shouldTouch: false,
          shouldValidate: false,
        });
      }
    }
  }, [skuData, form]);

  // Auto-fill static price with current market value when STATIC_PRICE is selected
  // Triggers when: mode changes to static, subcategory selected, net weight entered, or metal prices load
  useEffect(() => {
    if (pricingMode === "STATIC_PRICE" && selectedSubcategory && netWeight > 0) {
      const metalType = extractMetalType(selectedSubcategory?.material);
      const prices = metalPricesData?.data?.prices || metalPricesData?.prices || [];

      if (metalType && prices.length > 0) {
        const metalPrice = prices.find((p: any) => p.metalType === metalType);
        if (metalPrice && metalPrice.pricePerGram) {
          const marketPrice = metalPrice.pricePerGram * netWeight;
          // Only auto-fill if the static price is currently empty or 0
          const currentStaticPrice = form.getValues("staticPrice");
          if (currentStaticPrice === undefined || currentStaticPrice === null || currentStaticPrice === 0) {
            form.setValue("staticPrice", Math.round(marketPrice), { shouldDirty: true });
          }
        }
      }
    }
  }, [pricingMode, selectedSubcategory, netWeight, metalPricesData, form]);

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

  const onSubmit = async (data: ProductFormData) => {
    console.log("=== FORM SUBMISSION STARTED ===");
    console.log("Form data:", data);
    console.log("Selected subcategory:", selectedSubcategory);

    toast.dismiss();

    try {
      console.log("Step 1: Preparing product data...");

      const productData = {
        productTitle: data.productTitle,
        productSlug: data.productSlug,
        skuNo: data.skuNo,
        boxNumber: data.boxNumber,
        productDescription: data.productDescription || "",
        careHandling: selectedCareItems.join(" | "),
        subcategoryId: data.subcategoryId,
        // Include hierarchy fields from selected subcategory
        materialId: data.materialId,
        genderId: data.genderId,
        itemId: data.itemId,
        categoryId: data.categoryId,
        metalType: selectedSubcategory?.material?.metalType || "",
        grossWeight: data.grossWeight,
        netWeight: data.netWeight,
        pricingMode: data.pricingMode,
        staticPrice: data.pricingMode === "STATIC_PRICE" ? data.staticPrice : undefined,
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
        seoTitle: data.seoTitle || "",
        seoDescription: data.seoDescription || "",
        productImageUrl: data.productImageUrl ? [data.productImageUrl] : [],
      };

      console.log("Step 2: Product data prepared:", productData);
      console.log("productImageUrl value:", productData.productImageUrl);
      console.log("productImageUrl length:", JSON.stringify(productData.productImageUrl).length);

      // Handle file uploads
      let transformedData: any = productData;
      try {
        console.log("Step 3: Checking for image files...");
        const selectedFiles = ((form.getValues() as any).images || []) as File[];
        console.log("Selected files:", selectedFiles);

        if (selectedFiles && selectedFiles.length > 0) {
          console.log("Files found, creating FormData...");
          const formData = new FormData();
          Object.entries(productData).forEach(([key, value]) => {
            // IMPORTANT: Skip productImageUrl field to avoid hitting multer field size limits
            // We're uploading actual image files instead
            if (key === "productImageUrl") {
              console.log("Skipping productImageUrl field (uploading actual files instead)");
              return;
            } else if (value !== undefined && value !== null && !Array.isArray(value)) {
              formData.append(key, String(value));
            }
          });
          selectedFiles.forEach((file) => {
            formData.append("images", file);
          });
          transformedData = formData;
          console.log("FormData created with files");
        } else {
          console.log("No image files, using JSON data");
          // If no files, send as JSON (will include productImageUrl if provided)
        }
      } catch (fileError) {
        console.error("Error handling files:", fileError);
        transformedData = productData;
      }

      console.log("Step 4: Calling addProduct API...");
      console.log("Data to send:", transformedData);

      addProduct(transformedData, {
        onSuccess: () => {
          // Toast is already shown by useAddProduct's onSuccess handler in product-query.tsx
          setTimeout(() => {
            navigate("/dashboard/products/list");
          }, 1500);
        },
        onError: (error: any) => {
          console.error("=== ERROR ===");
          console.error("Full error object:", error);
          console.error("Error response:", error.response?.data);
          console.error("Error message:", error.message);

          // Extract specific error message from backend response
          let errorMsg = "Failed to add product. Please check all fields and try again.";

          if (error.response?.data) {
            const errorData = error.response.data;
            const errorObj = errorData.error || errorData;

            // Handle structured validation errors
            if (errorObj.fields) {
              const fieldErrors: Record<string, string> = {
                metalType: "Metal type is required. Please select a valid category hierarchy.",
                subcategoryId: "Please select a valid subcategory.",
                productTitle: "Product title is required (3+ characters).",
                productSlug: "Product slug is invalid or already exists.",
                skuNo: "SKU number is invalid or already exists.",
                grossWeight: "Gross weight is required and must be positive.",
                netWeight: "Net weight is required and must be positive and less than gross weight.",
                productDescription: "Product description is required (10+ characters).",
                category: "Please select a valid category.",
                boxNumber: "Box number must be a positive number.",
              };

              // Build error message from fields
              const errorMessages: string[] = [];
              Object.keys(errorObj.fields).forEach((field) => {
                const msg = fieldErrors[field] || `${field}: ${errorObj.fields[field]}`;
                errorMessages.push(msg);
              });

              if (errorMessages.length > 0) {
                errorMsg = errorMessages.slice(0, 3).join("\n"); // Show first 3 errors
                if (errorMessages.length > 3) {
                  errorMsg += `\n...and ${errorMessages.length - 3} more error(s)`;
                }
              } else {
                errorMsg = errorObj.message || errorMsg;
              }
            } else if (errorObj.message) {
              // Simple string message
              errorMsg = errorObj.message;
            } else if (errorData.message) {
              errorMsg = errorData.message;
            }
          } else if (error.message) {
            // Network or other error
            if (error.message.includes("500")) {
              errorMsg = "Server error occurred. Please try again later.";
            } else if (error.message.includes("Network") || error.message.includes("ERR_NETWORK")) {
              errorMsg = "Network error. Please check your connection and try again.";
            } else if (error.message.includes("timeout")) {
              errorMsg = "Request timeout. Please try again.";
            } else {
              errorMsg = `Error: ${error.message}`;
            }
          }

          console.error("Final error message:", errorMsg);
          toast.error(errorMsg);
        },
      });
    } catch (error) {
      console.error("=== SUBMISSION ERROR ===");
      console.error("Error:", error);
      toast.error("An error occurred while processing your request");
    }
  };

  const preselectedSubName = (() => {
    const sub =
      preselectedSubRaw?.data?.subcategory ??
      preselectedSubRaw?.subcategory ??
      preselectedSubRaw?.data;
    return sub?.name ?? null;
  })();

  return (
    <section className="flex flex-col space-y-6">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-bold">Add Product</h1>
        <p className="text-sm text-gray-500">Create a new jewelry product with dynamic pricing</p>
      </header>

      {preselectedSubcategoryId && preselectedSubName && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
          Subcategory <span className="font-semibold mx-1">"{preselectedSubName}"</span> has been pre-selected for this product.
        </div>
      )}

      <FormProvider
        methods={form}
        onSubmit={form.handleSubmit(
          (data) => {
            console.log("Form validation passed, submitting...");
            onSubmit(data);
          },
          (errors) => {
            console.error("=== FORM VALIDATION ERRORS ===");
            console.error("Validation errors:", errors);
            Object.entries(errors).forEach(([field, error]: [string, any]) => {
              console.error(`Field "${field}":`, error?.message);
            });
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

            {/* Category Hierarchy Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Category Hierarchy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Material */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Material *</Label>
                  <select
                    value={selectedMaterialId}
                    onChange={(e) => handleMaterialChange(e.target.value)}
                    className="w-full h-9 rounded-md border px-3 text-sm bg-background"
                  >
                    <option value="">Select Material</option>
                    {materials.map((m: any) => (
                      <option key={m._id} value={m._id}>{m.displayName || m.name}</option>
                    ))}
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Gender *</Label>
                  <select
                    value={selectedGenderId}
                    onChange={(e) => handleGenderChange(e.target.value)}
                    disabled={!selectedMaterialId}
                    className="w-full h-9 rounded-md border px-3 text-sm bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">{!selectedMaterialId ? "Select material first" : "Select Gender"}</option>
                    {genders.map((g: any) => (
                      <option key={g._id} value={g._id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                {/* Item Type */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Item Type *</Label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => handleItemChange(e.target.value)}
                    disabled={!selectedMaterialId || !selectedGenderId}
                    className="w-full h-9 rounded-md border px-3 text-sm bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">{(!selectedMaterialId || !selectedGenderId) ? "Select above first" : "Select Item Type"}</option>
                    {items.map((i: any) => (
                      <option key={i._id} value={i._id}>{i.name}</option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Category *</Label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    disabled={!selectedMaterialId || !selectedGenderId || !selectedItemId}
                    className="w-full h-9 rounded-md border px-3 text-sm bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">{(!selectedMaterialId || !selectedGenderId || !selectedItemId) ? "Select above first" : "Select Category"}</option>
                    {categories.map((c: any) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Subcategory */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Subcategory *</Label>
                  <select
                    value={subcategoryId}
                    onChange={(e) => handleSubcategoryChange(e.target.value)}
                    disabled={!selectedCategoryId}
                    className="w-full h-9 rounded-md border px-3 text-sm bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">{!selectedCategoryId ? "Select category first" : "Select Subcategory"}</option>
                    {subcategories.map((s: any) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                  {form.formState.errors.subcategoryId && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.subcategoryId.message}</p>
                  )}
                </div>

                {selectedSubcategory && (
                  <div className="p-3 bg-blue-50 rounded-md space-y-2 mt-4">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Selected Hierarchy</span>
                    </div>
                    <div className="text-sm text-blue-700">
                      {selectedSubcategory.displayLabel || selectedSubcategory.name}
                    </div>
                    {selectedSubcategory.material && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs text-blue-600">Metal Type:</span>
                        <Badge variant="secondary">
                          {extractMetalType(selectedSubcategory.material) || selectedSubcategory.material.name || 'Unknown'}
                        </Badge>
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
                  <div>
                    <Label htmlFor="boxNumber">Box Number *</Label>
                    <Input
                      id="boxNumber"
                      type="number"
                      min="1"
                      {...form.register("boxNumber", { valueAsNumber: true })}
                      placeholder="1"
                    />
                    {form.formState.errors.boxNumber && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.boxNumber.message}</p>
                    )}
                  </div>
                </div>

                {/* SKU Preview Section */}
                <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                  <Label className="text-sm font-medium text-blue-900">Auto-Generated SKU Preview</Label>
                  {skuLoading ? (
                    <p className="text-sm text-blue-700 mt-1">Loading SKU...</p>
                  ) : skuPreview ? (
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-lg font-bold text-blue-900 bg-white px-2 py-1 rounded">
                        {skuPreview}
                      </code>
                      <span className="text-xs text-blue-600">(Will be auto-filled)</span>
                    </div>
                  ) : (
                    <p className="text-sm text-blue-600 mt-1">Select subcategory and box number to generate SKU</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    control={form.control}
                    name="skuNo"
                    label="SKU Number (Manual Override)"
                    placeholder="G22FNGBOX11"
                  />
                </div>

                <FormTextArea
                  control={form.control}
                  name="productDescription"
                  label="Description *"
                  placeholder="Enter product description (minimum 10 characters)"
                />
                {form.formState.errors.productDescription && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.productDescription.message}</p>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={15} className="text-violet-500" />
                    <span className="text-sm font-medium">Care &amp; Handling</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {CARE_OPTIONS.map((option) => {
                      const checked = selectedCareItems.includes(option);
                      return (
                        <label
                          key={option}
                          className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer text-sm transition-colors ${
                            checked
                              ? "border-violet-400 bg-violet-50 text-violet-800"
                              : "border-gray-200 bg-white text-muted-foreground hover:border-violet-200 hover:bg-violet-50/50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="accent-violet-600"
                            checked={checked}
                            onChange={() =>
                              setSelectedCareItems((prev) =>
                                checked
                                  ? prev.filter((i) => i !== option)
                                  : [...prev, option]
                              )
                            }
                          />
                          {option}
                        </label>
                      );
                    })}
                  </div>
                  {selectedCareItems.length > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {selectedCareItems.length} instruction{selectedCareItems.length > 1 ? "s" : ""} selected
                    </p>
                  )}
                </div>
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
                  <div className="space-y-2">
                    <Label htmlFor="staticPrice">Static Price (₹)</Label>
                    <Input
                      id="staticPrice"
                      type="number"
                      step="0.01"
                      {...form.register("staticPrice", { valueAsNumber: true })}
                      placeholder="Enter fixed price"
                    />
                    {selectedSubcategory && netWeight > 0 && (() => {
                      const metalType = extractMetalType(selectedSubcategory?.material);
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

                {subcategoryId && grossWeight > 0 && netWeight > 0 && pricingMode === "SUBCATEGORY_DYNAMIC" && (
                  <p className="text-xs text-blue-600 flex items-start gap-1">
                    <Calculator className="h-3 w-3 mt-0.5 shrink-0" />
                    Price will be auto-calculated from subcategory pricing config and live metal rates immediately after saving.
                  </p>
                )}

                <div className="pt-4 border-t">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isPending}
                    onClick={(e) => {
                      console.log("Create Product button clicked");
                      console.log("Button disabled state:", isPending);
                      console.log("Form state:", form.formState);
                    }}
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
