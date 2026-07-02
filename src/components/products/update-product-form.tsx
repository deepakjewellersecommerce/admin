import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
import FormInput from "../form/FormInput";
import FormTextArea from "../form/FormTextArea";
import {
  useGetProduct,
  useUpdateProduct,
  useGetProductVariants,
  useAddProductVariant,
  useUpdateProductVariant,
  useDeleteProductVariant,
} from "@/lib/react-query/product-query";
import FormProvider from "../form/FormProvider";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LoadingScreen from "../common/loading-screen";
import FormSwitch from "../form/form-switch";
import {
  useGetAllMaterials,
  useGetAllGenders,
  useGetAllItems,
  useGetAllCategories,
  useGetAllSubcategories,
  useGetSubcategoryPricing,
} from "@/lib/react-query/category-hierarchy-query";
import { useGetAllMetalPrices } from "@/lib/react-query/metal-price-query";
import { useGetColor } from "@/lib/react-query/color-query";
import { ComboboxSelect } from "../ui/combobox";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VariantState {
  // undefined _id = new (not yet saved), string = existing
  _id?: string;
  productId?: string;
  size: string;
  color: string;
  grossWeight: string;
  netWeight: string;
  stock: string;
  price: string;
  discountType: "FIXED" | "PERCENTAGE";
  discountValue: string;
  isActive: boolean;
  // images to upload (new files)
  images: File[];
  imagePreviews: string[];
  // existing Cloudinary URLs
  imageUrls: string[];
  expanded: boolean;
  // track dirty state for existing variants
  dirty: boolean;
}

// ---------------------------------------------------------------------------
// Zod schema (weights optional at product level)
// ---------------------------------------------------------------------------

const editProductSchema = z.object({
  productTitle: z.string().min(3, "Product title must be at least 3 characters"),
  productSlug: z.string().min(1, "Product slug is required"),
  productDescription: z.string().min(10, "Description must be at least 10 characters"),
  careHandling: z.string().optional(),
  pricingMode: z.enum(["SUBCATEGORY_DYNAMIC", "STATIC_PRICE"]),
  staticPrice: z.preprocess(
    (v) => (v === "" || (typeof v === "number" && isNaN(v as number)) ? undefined : v),
    z.number().min(0).optional()
  ),
  salePrice: z.preprocess(
    (v) => (v === "" || (typeof v === "number" && isNaN(v as number)) ? undefined : v),
    z.number().min(0).optional()
  ),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
}).refine(
  (d) => d.pricingMode !== "STATIC_PRICE" || (d.staticPrice && d.staticPrice > 0),
  { message: "Static price is required when using static pricing mode", path: ["staticPrice"] }
);

type EditProductFormData = z.infer<typeof editProductSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const extractMetalType = (material: any): string | null => {
  if (!material) return null;
  if (material.metalType) return material.metalType;
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
          ? comp.frozenValue / weightGrams
          : comp.metalPriceMode === "MANUAL" && comp.manualMetalPrice
          ? comp.manualMetalPrice
          : metalRatePerGram;
      val = weightGrams * rate;
      metalCost = val;
    } else if (comp.isFrozen && comp.frozenValue != null) {
      val = comp.frozenValue;
    } else {
      switch (comp.calculationType) {
        case "PER_GRAM": val = weightGrams * (comp.value || 0); break;
        case "PERCENTAGE": val = ((comp.percentageOf === "subtotal" ? subtotal : metalCost) * (comp.value || 0)) / 100; break;
        case "FIXED": val = comp.value || 0; break;
      }
    }
    subtotal += Math.round(val * 100) / 100;
  }
  return Math.round(subtotal);
}

const CARE_OPTIONS = [
  "Store in a cool, dry place",
  "Avoid contact with water",
  "Clean with a soft cloth",
  "Remove before sleeping or exercising",
  "Avoid exposure to chemicals and perfume",
  "Store separately to avoid scratches",
];

function computeSalePrice(price: number, discountType: "FIXED" | "PERCENTAGE", discountValue: string): number {
  const d = Number(discountValue);
  if (!d || d <= 0 || !price) return 0;
  if (discountType === "FIXED") return Math.max(0, Math.round((price - d) * 100) / 100);
  if (discountType === "PERCENTAGE") return Math.max(0, Math.round(price * (1 - d / 100) * 100) / 100);
  return 0;
}

const newVariant = (productId: string): VariantState => ({
  productId,
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
  imageUrls: [],
  expanded: true,
  dirty: true,
});

// ---------------------------------------------------------------------------
// Multi-image picker
// ---------------------------------------------------------------------------

interface MultiImagePickerProps {
  existingUrls: string[];
  newPreviews: string[];
  onAddFiles: (files: File[]) => void;
  onRemoveExisting: (index: number) => void;
  onRemoveNew: (index: number) => void;
}

function MultiImagePicker({
  existingUrls,
  newPreviews,
  onAddFiles,
  onRemoveExisting,
  onRemoveNew,
}: MultiImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {existingUrls.map((src, i) => (
          <div key={`existing-${i}`} className="relative group">
            <img src={src} alt="" className="h-20 w-20 rounded-md border object-cover" />
            <button
              type="button"
              onClick={() => onRemoveExisting(i)}
              className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        {newPreviews.map((src, i) => (
          <div key={`new-${i}`} className="relative group">
            <img src={src} alt="" className="h-20 w-20 rounded-md border object-cover ring-2 ring-violet-300" />
            <button
              type="button"
              onClick={() => onRemoveNew(i)}
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
        onChange={(e) => {
          if (e.target.files) onAddFiles(Array.from(e.target.files));
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant row
// ---------------------------------------------------------------------------

interface VariantRowProps {
  variant: VariantState;
  index: number;
  isExisting: boolean;
  onChange: (index: number, field: keyof VariantState, value: any) => void;
  onAddImages: (index: number, files: File[]) => void;
  onRemoveNewImage: (index: number, imgIndex: number) => void;
  onRemoveExistingImage: (index: number, imgIndex: number) => void;
  onRemove: (index: number) => void;
  onToggle: (index: number) => void;
  pricingComponents: any[];
  metalRatePerGram: number | null;
  colorOptions: { label: string; value: string }[];
}

function VariantRow({
  variant,
  index,
  isExisting,
  onChange,
  onAddImages,
  onRemoveNewImage,
  onRemoveExistingImage,
  onRemove,
  onToggle,
  pricingComponents,
  metalRatePerGram,
  colorOptions,
}: VariantRowProps) {
  const summary = [variant.size, variant.color, variant.stock ? `Stock: ${variant.stock}` : ""]
    .filter(Boolean)
    .join(" · ");

  const estimatedPrice = useMemo(() => {
    const w = Number(variant.netWeight);
    if (!w || w <= 0 || !metalRatePerGram) return null;
    return computeEstimatedPrice(pricingComponents, metalRatePerGram, w);
  }, [variant.netWeight, pricingComponents, metalRatePerGram]);

  // Always sync price from estimate whenever weight/pricing changes
  useEffect(() => {
    if (estimatedPrice != null && estimatedPrice > 0) {
      onChange(index, "price", String(estimatedPrice));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimatedPrice]);

  return (
    <div className={`rounded-lg border overflow-hidden ${isExisting ? "border-gray-200" : "border-violet-200"}`}>
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 cursor-pointer select-none ${isExisting ? "bg-gray-50" : "bg-violet-50"}`}
        onClick={() => onToggle(index)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            {isExisting ? `Variant ${index + 1}` : `New Variant ${index + 1}`}
          </span>
          {summary && <span className="text-xs text-gray-500">{summary}</span>}
          {isExisting && variant.dirty && (
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Unsaved</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(index); }}
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
                onChange={(e) => onChange(index, "size", e.target.value)}
                placeholder="e.g. S, M, L, 6, 7"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block">Color</Label>
              <ComboboxSelect
                className="w-full"
                name={`variant-color-${index}`}
                value={variant.color}
                placeholder="Select Metal Color"
                onValueChange={(val) => onChange(index, "color", val)}
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
                onChange={(e) => onChange(index, "grossWeight", e.target.value)}
                placeholder="e.g. 5.250"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1 block">Net Weight (grams)</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={variant.netWeight}
                onChange={(e) => onChange(index, "netWeight", e.target.value)}
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
                    onClick={() => onChange(index, "discountType", "FIXED")}
                    className={`px-3 py-2 text-xs font-medium transition-colors ${variant.discountType === "FIXED" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                  >
                    ₹
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(index, "discountType", "PERCENTAGE")}
                    className={`px-3 py-2 text-xs font-medium transition-colors ${variant.discountType === "PERCENTAGE" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                  >
                    %
                  </button>
                </div>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={variant.discountValue}
                  onChange={(e) => onChange(index, "discountValue", e.target.value)}
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
                onChange={(e) => onChange(index, "price", e.target.value)}
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
              onChange={(e) => onChange(index, "stock", e.target.value)}
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
              existingUrls={variant.imageUrls}
              newPreviews={variant.imagePreviews}
              onAddFiles={(files) => onAddImages(index, files)}
              onRemoveExisting={(i) => onRemoveExistingImage(index, i)}
              onRemoveNew={(i) => onRemoveNewImage(index, i)}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`variant-active-${index}`}
              checked={variant.isActive}
              onChange={(e) => onChange(index, "isActive", e.target.checked)}
              className="accent-violet-600"
            />
            <Label htmlFor={`variant-active-${index}`} className="text-sm cursor-pointer">Active</Label>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------

const UpdateProductForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: productDataResponse, isLoading: productLoading } = useGetProduct(id ?? "");
  const product = productDataResponse?.data?.data?.product || productDataResponse?.data?.product;

  const { data: variantsData, isLoading: variantsLoading } = useGetProductVariants(id ?? "");

  const { mutate: updateProduct, isPending } = useUpdateProduct();
  const { mutate: addVariant } = useAddProductVariant();
  const { mutate: updateVariant } = useUpdateProductVariant();
  const { mutate: deleteVariant } = useDeleteProductVariant();

  // Hierarchy data (read-only display)
  const { data: materialsRaw } = useGetAllMaterials();
  const { data: gendersRaw } = useGetAllGenders();
  const { data: itemsRaw } = useGetAllItems();
  const { data: categoriesRaw } = useGetAllCategories();
  const { data: subcategoriesRaw } = useGetAllSubcategories();
  const { data: metalPricesData } = useGetAllMetalPrices();
  const { data: colorsRaw } = useGetColor();
  const subcategoryId = product?.subcategoryId
    ? typeof product.subcategoryId === "object"
      ? product.subcategoryId._id
      : product.subcategoryId
    : "";
  const { data: subcategoryPricingData } = useGetSubcategoryPricing(subcategoryId);

  // Product images state
  const [productImages, setProductImages] = useState<File[]>([]);
  const [productImagePreviews, setProductImagePreviews] = useState<string[]>([]);
  const [existingProductImageUrls, setExistingProductImageUrls] = useState<string[]>([]);

  // Variants state
  const [variants, setVariants] = useState<VariantState[]>([]);
  const [variantsInitialized, setVariantsInitialized] = useState(false);

  // Care handling
  const [selectedCareItems, setSelectedCareItems] = useState<string[]>([]);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

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

  const currentHierarchyNames = useMemo(() => {
    if (!product) return null;
    const idStr = (v: any) => v?.toString?.() ?? String(v ?? "");
    const names: Record<string, string> = {};
    if (product.materialId) {
      const m = materials.find((x: any) => idStr(x._id) === idStr(product.materialId));
      names.material = (m as any)?.displayName || (m as any)?.name || "";
    }
    if (product.genderId) {
      const g = genders.find((x: any) => idStr(x._id) === idStr(product.genderId));
      names.gender = (g as any)?.name || "";
    }
    if (product.itemId) {
      const i = items.find((x: any) => idStr(x._id) === idStr(product.itemId));
      names.item = (i as any)?.name || "";
    }
    if (product.categoryId) {
      const catId = typeof product.categoryId === "object" ? (product.categoryId as any)._id : product.categoryId;
      const c = categories.find((x: any) => idStr(x._id) === idStr(catId));
      names.category = (c as any)?.name || "";
    }
    if (product.subcategoryId) {
      const s = subcategories.find((x: any) => idStr(x._id) === idStr(product.subcategoryId));
      names.subcategory = (s as any)?.name || "";
    }
    return names;
  }, [product, materials, genders, items, categories, subcategories]);

  const selectedSubcategory = useMemo(() => {
    if (!subcategoryId) return null;
    return subcategories.find((s: any) => s._id === subcategoryId) || null;
  }, [subcategories, subcategoryId]);

  const pricingComponents = useMemo(() => {
    const cfg =
      subcategoryPricingData?.data?.pricingConfig ??
      subcategoryPricingData?.pricingConfig ??
      subcategoryPricingData?.data;
    return cfg?.components ?? [];
  }, [subcategoryPricingData]);

  const metalRatePerGram = useMemo(() => {
    const material = (selectedSubcategory as any)?.materialId ?? (selectedSubcategory as any)?.material;
    if (material) {
      // Use override price if active (mirrors effectivePrice virtual)
      if (material.priceOverride?.isActive && material.priceOverride?.overridePrice > 0) {
        return material.priceOverride.overridePrice;
      }
      // Use stored pricePerGram (now included in populate)
      if (material.pricePerGram && material.pricePerGram > 0) return material.pricePerGram;
      // Fallback: look up in metal prices list by metalType (legacy)
      const metalType = extractMetalType(material) ?? (product as any)?.metalType;
      if (metalType) {
        const prices = metalPricesData?.data?.prices ?? metalPricesData?.prices ?? [];
        const entry = prices.find((p: any) => p.metalType === metalType);
        if (entry?.pricePerGram) return entry.pricePerGram;
      }
    }
    // Last resort: use manualMetalPrice from pricing config components
    const metalComp = pricingComponents.find((c: any) => c.componentKey === "metal_cost" && c.metalPriceMode === "MANUAL" && c.manualMetalPrice);
    return metalComp?.manualMetalPrice ?? null;
  }, [selectedSubcategory, metalPricesData, product, pricingComponents]);

  const colorOptions = useMemo(() => {
    const colors = colorsRaw?.data?.data?.colors ?? colorsRaw?.data?.colors ?? [];
    return colors.map((c: any) => ({ label: c.color_name, value: c._id }));
  }, [colorsRaw]);

  // ---------------------------------------------------------------------------
  // Form
  // ---------------------------------------------------------------------------

  const form = useForm<EditProductFormData>({
    resolver: zodResolver(editProductSchema),
    defaultValues: {
      productTitle: "",
      productSlug: "",
      productDescription: "",
      careHandling: "",
      pricingMode: "SUBCATEGORY_DYNAMIC",
      staticPrice: undefined,
      salePrice: undefined,
      isActive: true,
      isFeatured: false,
      seoTitle: "",
      seoDescription: "",
    },
  });

  const pricingMode = form.watch("pricingMode");

  // Pre-populate form when product loads
  useEffect(() => {
    if (!product) return;
    form.reset({
      productTitle: product.productTitle || "",
      productSlug: product.productSlug || "",
      productDescription: product.productDescription || "",
      careHandling: "",
      pricingMode: product.pricingMode || "SUBCATEGORY_DYNAMIC",
      staticPrice: product.staticPrice || undefined,
      salePrice: product.salePrice || undefined,
      isActive: product.isActive ?? true,
      isFeatured: product.isFeatured ?? false,
      seoTitle: product.seoTitle || "",
      seoDescription: product.seoDescription || "",
    });

    // Care handling checkboxes
    if (product.careHandling) {
      setSelectedCareItems(product.careHandling.split(" | ").filter(Boolean));
    }

    // Existing product images
    const urls = Array.isArray(product.productImageUrl)
      ? product.productImageUrl
      : product.productImageUrl
      ? [product.productImageUrl]
      : [];
    setExistingProductImageUrls(urls);
  }, [product, form]);

  // Initialize variants from fetched data (once)
  useEffect(() => {
    if (variantsInitialized || variantsLoading) return;
    const raw =
      variantsData?.data?.data?.variants ??
      variantsData?.data?.variants ??
      variantsData?.variants ??
      [];
    if (!Array.isArray(raw) || raw.length === 0) {
      setVariantsInitialized(true);
      return;
    }
    setVariants(
      raw.map((v: any) => ({
        _id: v._id,
        productId: v.productId,
        size: String(v.size ?? ""),
        color: typeof v.color === "object" ? v.color?._id ?? "" : String(v.color ?? ""),
        grossWeight: v.grossWeight != null ? String(v.grossWeight) : "",
        netWeight: v.netWeight != null ? String(v.netWeight) : "",
        stock: String(v.stock ?? ""),
        price: String(v.price ?? v.regularPrice ?? ""),
        discountType: "FIXED" as const,
        discountValue: (() => {
          const price = Number(v.price ?? v.regularPrice ?? 0);
          const sale = Number(v.salePrice ?? 0);
          return price > 0 && sale > 0 && sale < price ? String(Math.round((price - sale) * 100) / 100) : "";
        })(),
        isActive: v.isActive ?? true,
        images: [],
        imagePreviews: [],
        imageUrls: Array.isArray(v.imageUrls) ? v.imageUrls : [],
        expanded: false,
        dirty: false,
      }))
    );
    setVariantsInitialized(true);
  }, [variantsData, variantsLoading, variantsInitialized]);

  // ---------------------------------------------------------------------------
  // Product image handlers
  // ---------------------------------------------------------------------------

  const handleAddProductImages = (files: File[]) => {
    setProductImages((p) => [...p, ...files]);
    setProductImagePreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const handleRemoveNewProductImage = (i: number) => {
    setProductImages((p) => p.filter((_, idx) => idx !== i));
    setProductImagePreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const handleRemoveExistingProductImage = (i: number) => {
    setExistingProductImageUrls((p) => p.filter((_, idx) => idx !== i));
  };

  // ---------------------------------------------------------------------------
  // Variant handlers
  // ---------------------------------------------------------------------------

  const handleAddVariant = () => {
    setVariants((prev) => [...prev, newVariant(id ?? "")]);
  };

  const handleToggleVariant = (index: number) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, expanded: !v.expanded } : v))
    );
  };

  const handleVariantChange = (index: number, field: keyof VariantState, value: any) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value, dirty: true } : v))
    );
  };

  const handleAddVariantImages = (index: number, files: File[]) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === index
          ? {
              ...v,
              images: [...v.images, ...files],
              imagePreviews: [...v.imagePreviews, ...files.map((f) => URL.createObjectURL(f))],
              dirty: true,
            }
          : v
      )
    );
  };

  const handleRemoveNewVariantImage = (index: number, imgIndex: number) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === index
          ? {
              ...v,
              images: v.images.filter((_, j) => j !== imgIndex),
              imagePreviews: v.imagePreviews.filter((_, j) => j !== imgIndex),
              dirty: true,
            }
          : v
      )
    );
  };

  const handleRemoveExistingVariantImage = (index: number, imgIndex: number) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === index
          ? { ...v, imageUrls: v.imageUrls.filter((_, j) => j !== imgIndex), dirty: true }
          : v
      )
    );
  };

  const handleRemoveVariant = (index: number) => {
    const v = variants[index];
    if (v._id) {
      if (!window.confirm("Delete this variant? This cannot be undone.")) return;
      deleteVariant(v._id, {
        onSuccess: () => {
          setVariants((prev) => prev.filter((_, i) => i !== index));
          toast.success("Variant deleted.");
        },
        onError: () => toast.error("Failed to delete variant."),
      });
    } else {
      setVariants((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const onSubmit = async (data: EditProductFormData) => {
    toast.dismiss();

    // Build product FormData or JSON
    const hasNewImages = productImages.length > 0;
    let productPayload: any;

    if (hasNewImages) {
      const fd = new FormData();
      const fields: Record<string, any> = {
        _id: id,
        productTitle: data.productTitle,
        productSlug: data.productSlug,
        productDescription: data.productDescription,
        careHandling: selectedCareItems.join(" | "),
        pricingMode: data.pricingMode,
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
        seoTitle: data.seoTitle || "",
        seoDescription: data.seoDescription || "",
        ...(data.pricingMode === "STATIC_PRICE" ? { staticPrice: data.staticPrice } : {}),
        ...(data.salePrice ? { salePrice: data.salePrice } : {}),
      };
      if (existingProductImageUrls.length > 0) {
        fields.productImageUrl = JSON.stringify(existingProductImageUrls);
      }
      Object.entries(fields).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, String(v));
      });
      productImages.forEach((f) => fd.append("images", f));
      productPayload = fd;
    } else {
      productPayload = {
        _id: id,
        productTitle: data.productTitle,
        productSlug: data.productSlug,
        productDescription: data.productDescription,
        careHandling: selectedCareItems.join(" | "),
        pricingMode: data.pricingMode,
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
        seoTitle: data.seoTitle || "",
        seoDescription: data.seoDescription || "",
        productImageUrl: existingProductImageUrls,
        ...(data.pricingMode === "STATIC_PRICE" ? { staticPrice: data.staticPrice } : {}),
        ...(data.salePrice ? { salePrice: data.salePrice } : {}),
      };
    }

    updateProduct(productPayload, {
      onSuccess: () => {
        // Now handle variants
        const newVariants = variants.filter((v) => !v._id);
        const dirtyExisting = variants.filter((v) => v._id && v.dirty);

        let pending = newVariants.length + dirtyExisting.length;
        let failed = 0;

        const finish = () => {
          if (failed > 0) toast.warning(`Product updated but ${failed} variant(s) failed.`);
          else toast.success("Product updated successfully!");
          setTimeout(() => navigate("/dashboard/products/list"), 1500);
        };

        if (pending === 0) { finish(); return; }

        const done = () => { pending--; if (pending === 0) finish(); };
        const fail = () => { pending--; failed++; if (pending === 0) finish(); };

        // Add new variants
        newVariants.forEach((v) => {
          if (!v.size || !v.price || !v.stock) { fail(); return; }
          addVariant(
            {
              productId: id,
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
            { onSuccess: done, onError: fail }
          );
        });

        // Update dirty existing variants
        dirtyExisting.forEach((v) => {
          updateVariant(
            {
              _id: v._id,
              productId: id,
              size: v.size,
              color: v.color || undefined,
              grossWeight: v.grossWeight ? Number(v.grossWeight) : undefined,
              netWeight: v.netWeight ? Number(v.netWeight) : undefined,
              stock: Number(v.stock),
              price: Number(v.price),
              salePrice: computeSalePrice(Number(v.price), v.discountType, v.discountValue),
              isActive: v.isActive,
              imageUrls: v.imageUrls,
              images: v.images,
            },
            { onSuccess: done, onError: fail }
          );
        });
      },
      onError: (error: any) => {
        const err = error.response?.data?.error;
        const msg = typeof err === "string" ? err : err?.message ?? error.message ?? "Failed to update product.";
        toast.error(msg);
      },
    });
  };

  if (productLoading) return <LoadingScreen />;

  return (
    <section className="flex flex-col space-y-6">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <p className="text-sm text-gray-500">
          {product?.skuNo && <span className="font-mono text-gray-400 mr-2">{product.skuNo}</span>}
          Update product details and manage variants
        </p>
      </header>

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
              <CardHeader><CardTitle className="text-lg">Status</CardTitle></CardHeader>
              <CardContent className="flex gap-6">
                <FormSwitch control={form.control} name="isActive" label="Active" description="Product visible to customers" />
                <FormSwitch control={form.control} name="isFeatured" label="Featured" description="Show in featured section" />
              </CardContent>
            </Card>

            {/* Category — read-only */}
            {currentHierarchyNames && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Category Hierarchy</CardTitle></CardHeader>
                <CardContent>
                  <div className="p-3 bg-blue-50 rounded-md space-y-2">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Current hierarchy (read-only)</span>
                    </div>
                    <div className="text-sm text-blue-700 space-y-1">
                      {Object.entries(currentHierarchyNames).map(([key, val]) =>
                        val ? (
                          <div key={key}>
                            <span className="text-xs font-medium text-blue-600 capitalize">{key}:</span>
                            <span className="ml-2">{val}</span>
                          </div>
                        ) : null
                      )}
                    </div>
                    <p className="text-xs text-blue-500">Category hierarchy cannot be changed after creation.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Basic Information */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Basic Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormInput control={form.control} name="productTitle" label="Product Title" placeholder="Enter product title" />
                <FormInput control={form.control} name="productSlug" label="Product Slug" placeholder="product-slug" />
                <FormTextArea control={form.control} name="productDescription" label="Description *" placeholder="Enter product description (minimum 10 characters)" />

                <div>
                  <div className="flex items-center gap-2 mb-2">
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
              <CardHeader><CardTitle className="text-lg">Product Images</CardTitle></CardHeader>
              <CardContent>
                <MultiImagePicker
                  existingUrls={existingProductImageUrls}
                  newPreviews={productImagePreviews}
                  onAddFiles={handleAddProductImages}
                  onRemoveExisting={handleRemoveExistingProductImage}
                  onRemoveNew={handleRemoveNewProductImage}
                />
                <p className="text-xs text-muted-foreground mt-2">Existing images shown without ring. New uploads shown with violet ring.</p>
              </CardContent>
            </Card>

            {/* Variants */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Variants</CardTitle>
                {variants.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {variants.filter((v) => v._id).length} saved · {variants.filter((v) => !v._id).length} new
                  </span>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {variants.length === 0 && !variantsLoading && (
                  <p className="text-sm text-muted-foreground">No variants yet. Add one below.</p>
                )}
                {variantsLoading && (
                  <p className="text-sm text-muted-foreground">Loading variants...</p>
                )}

                {variants.map((v, i) => (
                  <VariantRow
                    key={v._id ?? `new-${i}`}
                    variant={v}
                    index={i}
                    isExisting={Boolean(v._id)}
                    onChange={handleVariantChange}
                    onAddImages={handleAddVariantImages}
                    onRemoveNewImage={handleRemoveNewVariantImage}
                    onRemoveExistingImage={handleRemoveExistingVariantImage}
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
              <CardHeader><CardTitle className="text-lg">SEO</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormInput control={form.control} name="seoTitle" label="SEO Title" placeholder="SEO optimized title (max 60 chars)" />
                <FormTextArea control={form.control} name="seoDescription" label="SEO Description" placeholder="SEO optimized description (max 160 chars)" />
              </CardContent>
            </Card>
          </div>

          {/* ── Right column — Pricing ── */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardHeader><CardTitle className="text-lg">Pricing</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {product && (
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <Label className="text-xs text-gray-600">Current Price</Label>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                      {product.regularPrice || product.calculatedPrice
                        ? `₹${(product.regularPrice || product.calculatedPrice).toLocaleString("en-IN")}`
                        : <span className="text-base text-gray-400">Not calculated</span>
                      }
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Auto-calculated from variant weights and metal rates</p>
                  </div>
                )}

                <div>
                  <Label>Pricing Mode</Label>
                  <Select value={pricingMode} onValueChange={(v) => form.setValue("pricingMode", v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUBCATEGORY_DYNAMIC">Dynamic (Inherit from Subcategory)</SelectItem>
                      <SelectItem value="STATIC_PRICE">Static Price</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {pricingMode === "SUBCATEGORY_DYNAMIC"
                      ? "Price calculated from subcategory config and live metal rates"
                      : "Fixed price, unaffected by metal rate changes"}
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

                <div className="pt-2 border-t">
                  <Label htmlFor="salePrice">Discount Price (₹) <span className="text-muted-foreground font-normal text-xs">— optional</span></Label>
                  <Input
                    id="salePrice"
                    type="text"
                    inputMode="decimal"
                    {...form.register("salePrice")}
                    placeholder="Leave empty for no discount"
                  />
                  <p className="text-xs text-gray-500 mt-1">For seasonal promotions.</p>
                </div>

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
                    ) : "Update Product"}
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
