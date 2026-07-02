import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
import FormInput from "../form/FormInput";
import FormTextArea from "../form/FormTextArea";
import { useAddProduct, useAddProductVariant } from "@/lib/react-query/product-query";
import { useGetColor } from "@/lib/react-query/color-query";
import { ComboboxSelect } from "../ui/combobox";
import FormProvider from "../form/FormProvider";
import { useMemo, useEffect, useState, useRef } from "react";
import FormSwitch from "../form/form-switch";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  useGetAllMaterials,
  useGetAllGenders,
  useGetAllItems,
  useGetAllCategories,
  useGetAllSubcategories,
  useGetSubcategory,
  useGetSubcategoryPricing,
} from "@/lib/react-query/category-hierarchy-query";
import { useGetAllMetalPrices } from "@/lib/react-query/metal-price-query";
import { useGetNextSKU } from "@/lib/react-query/product-sequence-query";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { AlertCircle, Calculator, ChevronDown, ChevronUp, Info, Plus, ShieldCheck, Trash2, Upload, X } from "lucide-react";
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VariantForm {
  id: string;
  size: string;
  color: string;
  grossWeight: string;
  netWeight: string;
  stock: string;
  price: string;
  discountType: "FIXED" | "PERCENTAGE";
  discountValue: string;
  isActive: boolean;
  images: File[];
  imagePreviews: string[];
  expanded: boolean;
}

// ---------------------------------------------------------------------------
// Validation schema (weights removed)
// ---------------------------------------------------------------------------

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

  // Pricing Mode
  pricingMode: z.enum(["SUBCATEGORY_DYNAMIC", "STATIC_PRICE"]),
  staticPrice: z.preprocess(
    (val) => (val === "" || (typeof val === "number" && isNaN(val as number)) ? undefined : val),
    z.number().min(0, "Static price cannot be negative").optional()
  ),

  // Other fields
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
}).refine(
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
  pricingMode: "SUBCATEGORY_DYNAMIC",
  staticPrice: undefined,
  isActive: true,
  isFeatured: false,
  seoTitle: "",
  seoDescription: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const extractMetalType = (material: any): string | null => {
  if (!material) return null;
  if (material.metalType) return material.metalType;
  const idAttr = material.idAttribute;
  if (idAttr) {
    const mapping: Record<string, string> = {
      G24: "GOLD_24K",
      G22: "GOLD_22K",
      S999: "SILVER_999",
      S925: "SILVER_925",
      PT: "PLATINUM",
    };
    if (mapping[idAttr]) return mapping[idAttr];
  }
  const name = material.name || material.displayName || "";
  if (name.includes("Gold") || name.includes("GOLD")) {
    if (name.includes("24")) return "GOLD_24K";
    if (name.includes("22")) return "GOLD_22K";
  }
  if (name.includes("Silver") || name.includes("SILVER")) {
    if (name.includes("999")) return "SILVER_999";
    if (name.includes("925")) return "SILVER_925";
  }
  if (name.includes("Platinum") || name.includes("PLATINUM")) return "PLATINUM";
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

// ---------------------------------------------------------------------------
// Price estimation from subcategory pricing config + metal rate + weight
// Mirrors the backend calculation logic
// ---------------------------------------------------------------------------

function computeEstimatedPrice(
  components: any[],
  metalRatePerGram: number,
  weightGrams: number
): number | null {
  if (!components?.length || !metalRatePerGram || !weightGrams || weightGrams <= 0) return null;

  let subtotal = 0;
  let metalCost = 0;

  for (const comp of components) {
    if (comp.isActive === false) continue;

    let val = 0;

    if (comp.componentKey === "metal_cost") {
      const rate =
        comp.isFrozen && comp.frozenValue != null
          ? comp.frozenValue / (weightGrams || 1) // frozen total → back to per-gram isn't perfect but approximates
          : comp.metalPriceMode === "MANUAL" && comp.manualMetalPrice
          ? comp.manualMetalPrice
          : metalRatePerGram;
      val = weightGrams * rate;
      metalCost = val;
    } else if (comp.isFrozen && comp.frozenValue != null) {
      val = comp.frozenValue;
    } else {
      switch (comp.calculationType) {
        case "PER_GRAM":
          val = weightGrams * (comp.value || 0);
          break;
        case "PERCENTAGE": {
          const base = comp.percentageOf === "subtotal" ? subtotal : metalCost;
          val = (base * (comp.value || 0)) / 100;
          break;
        }
        case "FIXED":
          val = comp.value || 0;
          break;
      }
    }

    subtotal += Math.round(val * 100) / 100;
  }

  return Math.round(subtotal);
}

function computeSalePrice(price: number, discountType: "FIXED" | "PERCENTAGE", discountValue: string): number {
  const d = Number(discountValue);
  if (!d || d <= 0 || !price) return 0;
  if (discountType === "FIXED") return Math.max(0, Math.round((price - d) * 100) / 100);
  if (discountType === "PERCENTAGE") return Math.max(0, Math.round(price * (1 - d / 100) * 100) / 100);
  return 0;
}

const newVariant = (): VariantForm => ({
  id: crypto.randomUUID(),
  size: "",
  color: "",
  grossWeight: "",
  netWeight: "",
  stock: "",
  price: "",
  discountType: "FIXED",
  discountValue: "",
  isActive: true,
  images: [],
  imagePreviews: [],
  expanded: true,
});

// ---------------------------------------------------------------------------
// Multi-image picker (standalone, no RHF context needed)
// ---------------------------------------------------------------------------

interface MultiImagePickerProps {
  previews: string[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
}

function MultiImagePicker({ previews, onAdd, onRemove }: MultiImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onAdd(Array.from(files));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {previews.map((src, i) => (
          <div key={i} className="relative group">
            <img
              src={src}
              alt={`preview-${i}`}
              className="h-20 w-20 rounded-md border object-cover"
            />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow"
            >
              <X size={10} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
        >
          <Upload size={16} />
          <span className="text-xs">Add</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant row
// ---------------------------------------------------------------------------

interface VariantRowProps {
  variant: VariantForm;
  index: number;
  onChange: (id: string, field: keyof VariantForm, value: any) => void;
  onAddImages: (id: string, files: File[]) => void;
  onRemoveImage: (id: string, index: number) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  // Pricing context — passed from parent which has them in scope
  pricingComponents: any[];
  metalRatePerGram: number | null;
  colorOptions: { label: string; value: string }[];
}

function VariantRow({ variant, index, onChange, onAddImages, onRemoveImage, onRemove, onToggle, pricingComponents, metalRatePerGram, colorOptions }: VariantRowProps) {
  const summary = [variant.size, variant.color, variant.stock ? `Stock: ${variant.stock}` : ""]
    .filter(Boolean)
    .join(" · ");

  // Compute estimated price from net weight (metal content) whenever inputs change
  const estimatedPrice = useMemo(() => {
    const w = Number(variant.netWeight);
    if (!w || w <= 0 || !metalRatePerGram) return null;
    return computeEstimatedPrice(pricingComponents, metalRatePerGram, w);
  }, [variant.netWeight, pricingComponents, metalRatePerGram]);

  // Always sync price from estimate whenever weight/pricing changes
  useEffect(() => {
    if (estimatedPrice != null && estimatedPrice > 0) {
      onChange(variant.id, "price", String(estimatedPrice));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimatedPrice]);

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer select-none"
        onClick={() => onToggle(variant.id)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Variant {index + 1}</span>
          {summary && (
            <span className="text-xs text-gray-500">{summary}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(variant.id); }}
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            <Trash2 size={14} />
          </button>
          {variant.expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {/* Body */}
      {variant.expanded && (
        <div className="px-4 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-1 block">Size *</Label>
              <Input
                value={variant.size}
                onChange={(e) => onChange(variant.id, "size", e.target.value)}
                placeholder="e.g. S, M, L, 6, 7"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block">Color</Label>
              <ComboboxSelect
                className="w-full"
                name={`variant-color-${variant.id}`}
                value={variant.color}
                placeholder="Select Metal Color"
                onValueChange={(val) => onChange(variant.id, "color", val)}
                options={colorOptions}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-1 block">Gross Weight (grams)</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={variant.grossWeight}
                onChange={(e) => onChange(variant.id, "grossWeight", e.target.value)}
                placeholder="e.g. 5.250"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block">Net Weight (grams)</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={variant.netWeight}
                onChange={(e) => onChange(variant.id, "netWeight", e.target.value)}
                placeholder="e.g. 4.800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-1 block">Discount <span className="text-muted-foreground font-normal">— optional</span></Label>
              <div className="flex gap-2">
                <div className="flex rounded-md border overflow-hidden shrink-0">
                  <button
                    type="button"
                    onClick={() => onChange(variant.id, "discountType", "FIXED")}
                    className={`px-3 py-2 text-xs font-medium transition-colors ${variant.discountType === "FIXED" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                  >
                    ₹
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(variant.id, "discountType", "PERCENTAGE")}
                    className={`px-3 py-2 text-xs font-medium transition-colors ${variant.discountType === "PERCENTAGE" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                  >
                    %
                  </button>
                </div>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={variant.discountValue}
                  onChange={(e) => onChange(variant.id, "discountValue", e.target.value)}
                  placeholder={variant.discountType === "PERCENTAGE" ? "e.g. 10" : "e.g. 500"}
                />
              </div>
            </div>
            <div>
              <div className="mb-1">
                <Label className="text-sm font-medium">Price (₹) *</Label>
              </div>
              <Input
                type="text"
                inputMode="decimal"
                value={variant.price}
                onChange={(e) => onChange(variant.id, "price", e.target.value)}
                placeholder={estimatedPrice != null ? `Est. ₹${estimatedPrice.toLocaleString("en-IN")}` : "Enter price"}
              />
              {(() => {
                const sp = computeSalePrice(Number(variant.price), variant.discountType, variant.discountValue);
                return sp > 0 ? (
                  <p className="mt-1 text-xs text-green-600 font-medium">
                    Sale price: ₹{sp.toLocaleString("en-IN")}
                    {variant.discountType === "PERCENTAGE" && variant.discountValue
                      ? ` (${variant.discountValue}% off)`
                      : variant.discountValue
                      ? ` (₹${variant.discountValue} off)`
                      : ""}
                  </p>
                ) : null;
              })()}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-1 block">Quantity *</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={variant.stock}
              onChange={(e) => onChange(variant.id, "stock", e.target.value)}
              placeholder="e.g. 10"
            />
          </div>

          {!metalRatePerGram && pricingComponents.length === 0 && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle size={11} />
              Select a subcategory with pricing config to auto-calculate price from weight.
            </p>
          )}

          <div>
            <Label className="text-sm font-medium mb-2 block">Variant Images</Label>
            <MultiImagePicker
              previews={variant.imagePreviews}
              onAdd={(files) => onAddImages(variant.id, files)}
              onRemove={(i) => onRemoveImage(variant.id, i)}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`variant-active-${variant.id}`}
              checked={variant.isActive}
              onChange={(e) => onChange(variant.id, "isActive", e.target.checked)}
              className="accent-violet-600"
            />
            <Label htmlFor={`variant-active-${variant.id}`} className="text-sm cursor-pointer">Active</Label>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------

const ProductFormV2 = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedSubcategoryId = searchParams.get("subcategoryId") ?? "";

  const [skuPreview, setSkuPreview] = useState<string>("");
  const [selectedCareItems, setSelectedCareItems] = useState<string[]>([]);

  // Product images
  const [productImages, setProductImages] = useState<File[]>([]);
  const [productImagePreviews, setProductImagePreviews] = useState<string[]>([]);

  // Variants
  const [variants, setVariants] = useState<VariantForm[]>([]);

  // Hierarchy selection state
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [selectedGenderId, setSelectedGenderId] = useState<string>("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  const subcategoryId = form.watch("subcategoryId");
  const boxNumber = form.watch("boxNumber");
  const pricingMode = form.watch("pricingMode");

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
  const { data: preselectedSubRaw } = useGetSubcategory(preselectedSubcategoryId);

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

  const { data: skuData, isLoading: skuLoading } = useGetNextSKU(
    subcategoryId,
    boxNumber,
    Boolean(subcategoryId && boxNumber > 0)
  );

  const { data: metalPricesData } = useGetAllMetalPrices();
  const { data: subcategoryPricingData } = useGetSubcategoryPricing(subcategoryId);
  const { data: colorsRaw } = useGetColor();
  const { mutate: addProduct, isPending } = useAddProduct();
  const { mutate: addVariant } = useAddProductVariant();

  const selectedSubcategory = useMemo((): any | null => {
    if (!subcategories || !subcategoryId) return null;
    return subcategories.find((s: any) => s._id === subcategoryId) || null;
  }, [subcategories, subcategoryId]);

  // Pricing config components from the subcategory
  const pricingComponents = useMemo(() => {
    const cfg =
      subcategoryPricingData?.data?.pricingConfig ??
      subcategoryPricingData?.pricingConfig ??
      subcategoryPricingData?.data;
    return cfg?.components ?? [];
  }, [subcategoryPricingData]);

  // Live metal rate for the selected subcategory's material
  const metalRatePerGram = useMemo(() => {
    const material = selectedSubcategory?.materialId ?? selectedSubcategory?.material;
    if (material) {
      // Use override price if active (mirrors effectivePrice virtual)
      if (material.priceOverride?.isActive && material.priceOverride?.overridePrice > 0) {
        return material.priceOverride.overridePrice;
      }
      // Use stored pricePerGram (now included in populate)
      if (material.pricePerGram && material.pricePerGram > 0) return material.pricePerGram;
      // Fallback: look up in metal prices list by metalType (legacy)
      const metalType = extractMetalType(material);
      if (metalType) {
        const prices = metalPricesData?.data?.prices ?? metalPricesData?.prices ?? [];
        const entry = prices.find((p: any) => p.metalType === metalType);
        if (entry?.pricePerGram) return entry.pricePerGram;
      }
    }
    // Last resort: use manualMetalPrice from pricing config components
    const metalComp = pricingComponents.find((c: any) => c.componentKey === "metal_cost" && c.metalPriceMode === "MANUAL" && c.manualMetalPrice);
    return metalComp?.manualMetalPrice ?? null;
  }, [selectedSubcategory, metalPricesData, pricingComponents]);

  const colorOptions = useMemo(() => {
    const colors = colorsRaw?.data?.data?.colors ?? colorsRaw?.data?.colors ?? [];
    return colors.map((c: any) => ({ label: c.color_name, value: c._id }));
  }, [colorsRaw]);

  // Hierarchy change handlers
  const handleMaterialChange = (id: string) => {
    setSelectedMaterialId(id);
    setSelectedGenderId("");
    setSelectedItemId("");
    setSelectedCategoryId("");
    form.setValue("materialId", id, { shouldValidate: false });
    form.setValue("genderId", "", { shouldValidate: false });
    form.setValue("itemId", "", { shouldValidate: false });
    form.setValue("categoryId", "", { shouldValidate: false });
    form.setValue("subcategoryId", "", { shouldValidate: false });
  };

  const handleGenderChange = (id: string) => {
    setSelectedGenderId(id);
    setSelectedItemId("");
    setSelectedCategoryId("");
    form.setValue("genderId", id, { shouldValidate: false });
    form.setValue("itemId", "", { shouldValidate: false });
    form.setValue("categoryId", "", { shouldValidate: false });
    form.setValue("subcategoryId", "", { shouldValidate: false });
  };

  const handleItemChange = (id: string) => {
    setSelectedItemId(id);
    setSelectedCategoryId("");
    form.setValue("itemId", id, { shouldValidate: false });
    form.setValue("categoryId", "", { shouldValidate: false });
    form.setValue("subcategoryId", "", { shouldValidate: false });
  };

  const handleCategoryChange = (id: string) => {
    setSelectedCategoryId(id);
    form.setValue("categoryId", id, { shouldValidate: false });
    form.setValue("subcategoryId", "", { shouldValidate: false });
  };

  const handleSubcategoryChange = (id: string) => {
    form.setValue("subcategoryId", id, { shouldValidate: true });
  };

  // Sync hierarchy state → form values
  useEffect(() => {
    if (selectedMaterialId) form.setValue("materialId", selectedMaterialId, { shouldValidate: false });
    if (selectedGenderId) form.setValue("genderId", selectedGenderId, { shouldValidate: false });
    if (selectedItemId) form.setValue("itemId", selectedItemId, { shouldValidate: false });
    if (selectedCategoryId) form.setValue("categoryId", selectedCategoryId, { shouldValidate: false });
  }, [selectedMaterialId, selectedGenderId, selectedItemId, selectedCategoryId, form]);

  // Pre-populate hierarchy from ?subcategoryId param
  useEffect(() => {
    if (!preselectedSubcategoryId || !preselectedSubRaw) return;
    const sub =
      preselectedSubRaw?.data?.subcategory ??
      preselectedSubRaw?.subcategory ??
      preselectedSubRaw?.data;
    if (!sub) return;
    const catId = typeof sub.categoryId === "object" ? sub.categoryId?._id : sub.categoryId;
    const matId = typeof sub.materialId === "object" ? sub.materialId?._id : sub.materialId;
    const genId = typeof sub.genderId === "object" ? sub.genderId?._id : sub.genderId;
    const itmId = typeof sub.itemId === "object" ? sub.itemId?._id : sub.itemId;
    if (matId) setSelectedMaterialId(matId);
    if (genId) setSelectedGenderId(genId);
    if (itmId) setSelectedItemId(itmId);
    if (catId) { setSelectedCategoryId(catId); form.setValue("categoryId", catId, { shouldValidate: false }); }
    form.setValue("subcategoryId", preselectedSubcategoryId, { shouldValidate: false });
  }, [preselectedSubRaw, preselectedSubcategoryId, form]);

  // SKU preview auto-fill
  useEffect(() => {
    if (skuData?.skuPreview) {
      setSkuPreview(skuData.skuPreview);
      if (!form.formState?.dirtyFields?.skuNo) {
        form.setValue("skuNo", skuData.skuPreview, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
      }
    }
  }, [skuData, form]);

  // Auto-generate slug from title
  useEffect(() => {
    const sub = form.watch((value, { name }) => {
      if (name === "productTitle") {
        const titleVal = value.productTitle || "";
        if (!form.formState?.dirtyFields?.productSlug) {
          const generated = titleVal.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
          form.setValue("productSlug", generated, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
        }
      }
    });
    return () => sub.unsubscribe();
  }, [form]);

  // ---------------------------------------------------------------------------
  // Product image handlers
  // ---------------------------------------------------------------------------

  const handleAddProductImages = (files: File[]) => {
    const previews = files.map((f) => URL.createObjectURL(f));
    setProductImages((prev) => [...prev, ...files]);
    setProductImagePreviews((prev) => [...prev, ...previews]);
  };

  const handleRemoveProductImage = (index: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
    setProductImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ---------------------------------------------------------------------------
  // Variant handlers
  // ---------------------------------------------------------------------------

  const handleAddVariant = () => {
    setVariants((prev) => [...prev, newVariant()]);
  };

  const handleRemoveVariant = (id: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const handleToggleVariant = (id: string) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, expanded: !v.expanded } : v))
    );
  };

  const handleVariantChange = (id: string, field: keyof VariantForm, value: any) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const handleAddVariantImages = (id: string, files: File[]) => {
    const previews = files.map((f) => URL.createObjectURL(f));
    setVariants((prev) =>
      prev.map((v) =>
        v.id === id
          ? { ...v, images: [...v.images, ...files], imagePreviews: [...v.imagePreviews, ...previews] }
          : v
      )
    );
  };

  const handleRemoveVariantImage = (id: string, index: number) => {
    setVariants((prev) =>
      prev.map((v) =>
        v.id === id
          ? { ...v, images: v.images.filter((_, i) => i !== index), imagePreviews: v.imagePreviews.filter((_, i) => i !== index) }
          : v
      )
    );
  };

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const onSubmit = async (data: ProductFormData) => {
    toast.dismiss();

    try {
      const formData = new FormData();

      // Scalar fields
      const fields: Record<string, any> = {
        productTitle: data.productTitle,
        productSlug: data.productSlug,
        skuNo: data.skuNo,
        boxNumber: data.boxNumber,
        productDescription: data.productDescription || "",
        careHandling: selectedCareItems.join(" | "),
        subcategoryId: data.subcategoryId,
        materialId: data.materialId,
        genderId: data.genderId,
        itemId: data.itemId,
        categoryId: data.categoryId,
        metalType: selectedSubcategory?.material?.metalType || "",
        pricingMode: data.pricingMode,
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
        seoTitle: data.seoTitle || "",
        seoDescription: data.seoDescription || "",
        ...(data.pricingMode === "STATIC_PRICE" ? { staticPrice: data.staticPrice } : {}),
      };

      Object.entries(fields).forEach(([key, val]) => {
        if (val !== undefined && val !== null) formData.append(key, String(val));
      });

      // Product images
      productImages.forEach((file) => formData.append("images", file));

      addProduct(formData, {
        onSuccess: (res: any) => {
          const productId =
            res?.data?.product?._id ??
            res?.data?._id ??
            res?.product?._id ??
            res?._id;

          // Submit variants sequentially
          if (variants.length > 0 && productId) {
            let submitted = 0;
            let failed = 0;

            const submitNext = (i: number) => {
              if (i >= variants.length) {
                if (failed > 0) {
                  toast.warning(`Product created but ${failed} variant(s) failed to save.`);
                }
                setTimeout(() => navigate("/dashboard/products/list"), 1500);
                return;
              }

              const v = variants[i];
              if (!v.size || !v.price || !v.stock) {
                failed++;
                submitNext(i + 1);
                return;
              }

              addVariant(
                {
                  productId,
                  size: v.size,
                  color: v.color || undefined,
                  grossWeight: v.grossWeight ? Number(v.grossWeight) : undefined,
                  netWeight: v.netWeight ? Number(v.netWeight) : undefined,
                  stock: Number(v.stock),
                  price: Number(v.price),
                  salePrice: computeSalePrice(Number(v.price), v.discountType, v.discountValue),
                  isActive: v.isActive,
                  images: v.images,
                },
                {
                  onSuccess: () => {
                    submitted++;
                    submitNext(i + 1);
                  },
                  onError: () => {
                    failed++;
                    submitNext(i + 1);
                  },
                }
              );
            };

            submitNext(0);
          } else {
            setTimeout(() => navigate("/dashboard/products/list"), 1500);
          }
        },
        onError: (error: any) => {
          let errorMsg = "Failed to add product. Please check all fields and try again.";
          if (error.response?.data) {
            const ed = error.response.data;
            const eo = ed.error || ed;
            if (eo.fields) {
              const msgs = Object.keys(eo.fields).map((f) => `${f}: ${eo.fields[f]}`);
              errorMsg = msgs.slice(0, 3).join("\n");
              if (msgs.length > 3) errorMsg += `\n...and ${msgs.length - 3} more`;
            } else {
              errorMsg = eo.message || ed.message || errorMsg;
            }
          } else if (error.message) {
            errorMsg = error.message;
          }
          toast.error(errorMsg);
        },
      });
    } catch {
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
          (data) => onSubmit(data),
          () => toast.error("Please fill in all required fields correctly")
        )}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-6">
                <FormSwitch control={form.control} name="isActive" label="Active" description="Product visible to customers" />
                <FormSwitch control={form.control} name="isFeatured" label="Featured" description="Show in featured section" />
              </CardContent>
            </Card>

            {/* Category Hierarchy */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Category Hierarchy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Category *</Label>
                    <button
                      type="button"
                      onClick={() => {
                        const params = new URLSearchParams();
                        if (selectedMaterialId) params.set("materialId", selectedMaterialId);
                        if (selectedGenderId) params.set("genderId", selectedGenderId);
                        if (selectedItemId) params.set("itemId", selectedItemId);
                        navigate(`/dashboard/catalog/categories/add?${params.toString()}`);
                      }}
                      className="text-xs text-violet-600 hover:text-violet-800 font-medium flex items-center gap-1"
                    >
                      <Plus size={11} /> Add New
                    </button>
                  </div>
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

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Subcategory *</Label>
                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedCategoryId) {
                          toast.error("Please select a category first before adding a subcategory.");
                          return;
                        }
                        navigate(`/dashboard/catalog/categories/${selectedCategoryId}/add`);
                      }}
                      className="text-xs text-violet-600 hover:text-violet-800 font-medium flex items-center gap-1"
                    >
                      <Plus size={11} /> Add New
                    </button>
                  </div>
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
                          {extractMetalType(selectedSubcategory.material) || selectedSubcategory.material.name || "Unknown"}
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

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormInput control={form.control} name="productTitle" label="Product Title" placeholder="Enter product title" />

                <div className="grid grid-cols-2 gap-4">
                  <FormInput control={form.control} name="productSlug" label="Product Slug" placeholder="product-slug" />
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

                <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                  <Label className="text-sm font-medium text-blue-900">Auto-Generated SKU Preview</Label>
                  {skuLoading ? (
                    <p className="text-sm text-blue-700 mt-1">Loading SKU...</p>
                  ) : skuPreview ? (
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-lg font-bold text-blue-900 bg-white px-2 py-1 rounded">{skuPreview}</code>
                      <span className="text-xs text-blue-600">(Will be auto-filled)</span>
                    </div>
                  ) : (
                    <p className="text-sm text-blue-600 mt-1">Select subcategory and box number to generate SKU</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormInput control={form.control} name="skuNo" label="SKU Number (Manual Override)" placeholder="G22FNGBOX11" />
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
                                checked ? prev.filter((i) => i !== option) : [...prev, option]
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

            {/* Product Images */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Product Images</CardTitle>
              </CardHeader>
              <CardContent>
                <MultiImagePicker
                  previews={productImagePreviews}
                  onAdd={handleAddProductImages}
                  onRemove={handleRemoveProductImage}
                />
                <p className="text-xs text-muted-foreground mt-2">Upload one or more images. First image is used as the main product thumbnail.</p>
              </CardContent>
            </Card>

            {/* Variants */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Variants</CardTitle>
                {variants.length > 0 && (
                  <span className="text-xs text-muted-foreground">{variants.length} variant{variants.length > 1 ? "s" : ""} added</span>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {variants.length === 0 && (
                  <p className="text-sm text-muted-foreground">No variants added. Variants are optional — add them if this product comes in different sizes or colors.</p>
                )}

                {variants.map((v, i) => (
                  <VariantRow
                    key={v.id}
                    variant={v}
                    index={i}
                    onChange={handleVariantChange}
                    onAddImages={handleAddVariantImages}
                    onRemoveImage={handleRemoveVariantImage}
                    onRemove={handleRemoveVariant}
                    onToggle={handleToggleVariant}
                    pricingComponents={pricingComponents}
                    metalRatePerGram={metalRatePerGram}
                    colorOptions={colorOptions}
                  />
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddVariant}
                  className="w-full mt-2"
                >
                  <Plus size={14} className="mr-1" />
                  {variants.length === 0 ? "Add Variant" : "Add Another Variant"}
                </Button>
              </CardContent>
            </Card>

            {/* SEO */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormInput control={form.control} name="seoTitle" label="SEO Title" placeholder="SEO optimized title (max 60 chars)" />
                <FormTextArea control={form.control} name="seoDescription" label="SEO Description" placeholder="SEO optimized description (max 160 chars)" />
              </CardContent>
            </Card>
          </div>

          {/* ── Right column — Pricing ── */}
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
                      <SelectItem value="SUBCATEGORY_DYNAMIC">Dynamic (Inherit from Subcategory)</SelectItem>
                      <SelectItem value="STATIC_PRICE">Static Price</SelectItem>
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
                    {form.formState.errors.staticPrice && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.staticPrice.message}</p>
                    )}
                  </div>
                )}

                {pricingMode === "SUBCATEGORY_DYNAMIC" && subcategoryId && (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">Price will be calculated automatically based on:</p>
                    <ul className="text-xs text-gray-500 mt-2 space-y-1">
                      <li>• Metal rate for {selectedSubcategory?.material?.metalType || "selected material"}</li>
                      <li>• Subcategory pricing config</li>
                      <li>• Gemstone costs (if any)</li>
                    </ul>
                  </div>
                )}

                {subcategoryId && pricingMode === "SUBCATEGORY_DYNAMIC" && (
                  <p className="text-xs text-blue-600 flex items-start gap-1">
                    <Calculator className="h-3 w-3 mt-0.5 shrink-0" />
                    Price will be auto-calculated from subcategory pricing config and live metal rates immediately after saving.
                  </p>
                )}

                <div className="pt-4 border-t">
                  <Button type="submit" className="w-full" disabled={isPending}>
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
