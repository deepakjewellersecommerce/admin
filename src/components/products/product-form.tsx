import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
import FormImageInput from "../form/FormImage";
import FormInput from "../form/FormInput";
import FormTextArea from "../form/FormTextArea";
import { useAddProduct } from "@/lib/react-query/product-query";
import FormProvider from "../form/FormProvider";
import { useGetCategories } from "@/lib/react-query/category-query";
import { useMemo, useEffect } from "react";
import FormSwitch from "../form/form-switch";
import { useGetBrandOptions } from "@/lib/react-query/brand-query";
import FormGroupSelect from "../form/FormCombobox";
import { useNavigate } from "react-router-dom";
import { nestedLabel } from "@/lib/utils/category-utils";
import { toast } from "sonner";

// Define TypeScript type for form data
type ProductFormData = {
  productTitle: string;
  productSlug: string;
  skuNo: string;
  regularPrice: string;
  salePrice: string;
  productDescription: string;
  careHandling: string;
  category: string;
  gst: string;
  productImageUrl?: string;
  brand: string;
  isActive?: boolean;
  isFeatured?: boolean;
  ingredients?: string;
  benefits?: string;
  shlokText?: string;
  shlokMeaning?: string;
  amazonLink?: string;
  // Removed silver-jewelry dynamic pricing fields
};

// Validation schema
const productSchema = z.object({
  productTitle: z
    .string()
    .min(3, { message: "Product Title must be atleast 3 characters long" }),
  productSlug: z
    .string()
    .min(1, { message: "Product Slug must be atleast 1 characters long" }),
  skuNo: z.string().min(1, { message: "SKU No is Required" }),
  regularPrice: z
    .string()
    .min(1, { message: "Regular Price is Required" })
    .refine((value) => !isNaN(Number(value)), {
      message: "Regular Price must be a number",
    }),
  salePrice: z
    .string()
    .min(1, { message: "Sale Price is Required" })
    .refine((value) => !isNaN(Number(value)), {
      message: "Sale Price must be a number",
    }),
  productDescription: z
    .string()
    .min(1, { message: "Product Description is Required" }),
  careHandling: z.string(),
  category: z.string().min(1, { message: "Category is Required" }),
  gst: z
    .string()
    .min(1, { message: "GST is Required" })
    .refine((value) => !isNaN(Number(value)), {
      message: "GST must be a number",
    }),
  productImageUrl: z.string().url().optional(),
  brand: z.string(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  ingredients: z.string().optional(),
  benefits: z.string().optional(),
  shlokText: z.string().optional(),
  shlokMeaning: z.string().optional(),
  amazonLink: z.string().optional(),
  // Silver jewelry specific fields
  // (Removed silver-jewelry dynamic pricing fields)
});

export type ProductType = z.infer<typeof productSchema>;

const defaultValues: ProductType = {
  productTitle: "",
  productSlug: "",
  isActive: true,
  isFeatured: false,
  skuNo: "",
  regularPrice: "",
  category: "",
  salePrice: "",
  productDescription: "",
  careHandling: "",
  gst: "",
  productImageUrl: "",
  brand: "",
  ingredients: "",
  benefits: "",
  shlokText: "",
  shlokMeaning: "",
  amazonLink: "",
  // Silver jewelry specific fields
  // (Removed silver-jewelry dynamic pricing defaults)
};

const ProductForm = () => {
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: defaultValues,
  });

  const { data, isLoading } = useGetCategories();
  const { options: brandOptions } = useGetBrandOptions();

  const categoryOptions = useMemo(() => {
    if (data) {
      return Array.from(data.data.categories).map((category: any) => {
        return {
          label: nestedLabel(category,data.data.categories) || category.name,
          value: category._id,
        }}).sort((a, b) => a.label.localeCompare(b.label));
    }
    return [];
  }, [data]);
  const { mutate, isPending } = useAddProduct();

  // Auto-generate productSlug from productTitle (lowercase, spaces -> underscores)
  // Do not overwrite if the slug field was manually edited (dirty)
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "productTitle") {
        const titleVal = value.productTitle || "";
        // If user has manually edited the slug, don't overwrite
        const slugDirty = form.formState?.dirtyFields?.productSlug;
        if (!slugDirty) {
          const generated = titleVal
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "_");
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

  const onSubmit = async (data: ProductFormData) => {
    // Reset any existing toasts
    toast.dismiss();
    
    try {
      // Validate required fields
      if (!data.productTitle || !data.category || !data.skuNo) {
        toast.error("Please fill in all required fields");
        return;
      }
      
      // Transform form data to match API expectations
      const productData = {
        productTitle: data.productTitle,
        productSlug: data.productSlug || data.productTitle.toLowerCase().replace(/\s+/g, '-'),
        description: data.productDescription,  // Map to the correct field name
        skuNo: data.skuNo,
        category: data.category,
        price: parseFloat(data.regularPrice),  // Convert to number
        salePrice: parseFloat(data.salePrice), // Convert to number
        gst: parseFloat(data.gst),             // Convert to number
        isActive: Boolean(data.isActive),
        isFeatured: Boolean(data.isFeatured || false),
        brand: data.brand || "",
        careHandling: data.careHandling || "",
        ingredients: data.ingredients || "",
        benefits: data.benefits || "",
        shlok: {
          shlokText: data.shlokText || "",
          shlokMeaning: data.shlokMeaning || "",
        },
        amazonLink: data.amazonLink || "",
        
        // Handle image URLs - map to backend's productImageUrl field when a URL is provided
        productImageUrl: data.productImageUrl && data.productImageUrl.trim() !== '' ? [
          data.productImageUrl
        ] : [],
        
        // (Removed jewelry-specific fields - not applicable)
      };
            
      // If files were selected via the FormImage input, they are stored in form state
      // under the key 'images'. When files exist we must send multipart/form-data
      // where 'product' is a stringified JSON and files are appended under 'images'.
      let transformedData: any = productData;
      try {
  const selectedFiles = (((form.getValues() as any).images) || []) as File[];
        if (selectedFiles && selectedFiles.length > 0) {
          const formData = new FormData();
          // Append fields individually to match Postman multipart/form-data style
          formData.append("productTitle", String(productData.productTitle));
          formData.append("productSlug", String(productData.productSlug));
          formData.append("skuNo", String(productData.skuNo));
          formData.append("category", String(productData.category));
          formData.append("regularPrice", String((productData as any).price ?? (productData as any).regularPrice ?? ""));
          formData.append("salePrice", String(productData.salePrice ?? ""));
          formData.append("isFeatured", String(productData.isFeatured ?? false));
          formData.append("isActive", String(productData.isActive ?? true));
          formData.append("productDescription", String((productData as any).description ?? (productData as any).productDescription ?? ""));
          formData.append("careHandling", String(productData.careHandling ?? ""));
          formData.append("gst", String(productData.gst ?? ""));
          formData.append("brand", String(productData.brand ?? ""));
          formData.append("ingredients", String((productData as any).ingredients ?? ""));
          formData.append("benefits", String((productData as any).benefits ?? ""));
          formData.append("shlok", JSON.stringify((productData as any).shlok ?? { shlokText: "", shlokMeaning: "" }));
          formData.append("amazonLink", String((productData as any).amazonLink ?? ""));

          selectedFiles.forEach((file) => {
            formData.append("images", file);
          });
          transformedData = formData;
        }
      } catch (err) {
        // If reading files fails, fall back to sending JSON
        transformedData = productData;
      }
      
      // Rely on mutation's onMutate to show a single 'Sending request to server...' toast
      mutate(transformedData, {
        onSettled: () => {
          // onSettled will rely on mutation's handlers to dismiss toasts
        },
        onSuccess: (response) => {
          toast.success("Product added successfully!");
          navigate('/dashboard/products/list');
        },
        onError: (error: any) => {
          console.error("Failed to add product:", error);
          
          // Show detailed error message to help debug the issue
          const errorMsg = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          "Unknown error occurred";
          
          toast.error(`Failed to add product: ${errorMsg}`);
          
          // Log extra debugging info
          if (error.response) {
            console.log("Error response status:", error.response.status);
            console.log("Error response headers:", error.response.headers);
          } else if (error.request) {
            console.log("Error request:", error.request);
          }
        }
      });
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("An error occurred while processing your request. Please try again.");
    }
  };

  return (
    <section className="flex flex-col space-y-4">
      <header className="border-b mb-10 pb-4">
        <h1 className="text-2xl font-bold">Add Product</h1>
        <p className="text-sm text-gray-500">
          Add a new product to your store.
        </p>
      </header>
      <main className="max-w-lg mt-20">
        <FormProvider
          className="space-y-4"
          methods={form}
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormSwitch
            control={form.control}
            name="isActive"
            label="Is Active"
            description="If Active it will shown to the user"
          />
          <FormSwitch
            control={form.control}
            name="isFeatured"
            label="Featured"
            description="If True will be shown as featured product"
          />
          <FormGroupSelect
            placeholder="Select Category"
            disabled={isLoading}
            control={form.control}
            name="category"
            label="Category"
            options={categoryOptions}
          />
          <FormInput
            control={form.control}
            name="productTitle"
            placeholder="Enter Product Title"
            label="Product Title"
          />
          <FormInput
            control={form.control}
            name="productSlug"
            placeholder="Enter Product Slug"
            label="Product Slug"
          />
          <FormInput
            control={form.control}
            name="skuNo"
            placeholder="Enter SKU No"
            label="SKU No"
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              control={form.control}
              name="regularPrice"
              placeholder="Enter Regular Price"
              label="Regular Price"
            />
            <FormInput
              control={form.control}
              name="salePrice"
              placeholder="Enter Sale Price"
              label="Sale Price"
            />
          </div>

          <FormInput
            control={form.control}
            name="gst"
            placeholder="Enter GST"
            label="GST"
          />
          
          {/* Silver Jewelry Dynamic Pricing removed - not applicable for skin care products */}
          
          <FormGroupSelect
            control={form.control}
            name="brand"
            label="Brand"
            options={brandOptions}
          />
          <FormTextArea
            control={form.control}
            name="productDescription"
            placeholder="Enter Product Description"
            label="Product Description"
          />
          <FormTextArea
            control={form.control}
            name="careHandling"
            placeholder="Enter Care Handling"
            label="Care Handling"
          />
          {/* <FormTextArea
            control={form.control}
            name="ingredients"
            placeholder="Enter Product Ingredients"
            label="Ingredients"
          />
          <FormTextArea
            control={form.control}
            name="benefits"
            placeholder="Enter Product Benefits"
            label="Benefits"
          />
          <FormInput
            control={form.control}
            name="shlokText"
            placeholder="Enter Sanskrit Shlok Text"
            label="Shlok Text (Sanskrit)"
          />
          <FormInput
            control={form.control}
            name="shlokMeaning"
            placeholder="Enter Shlok Meaning in English"
            label="Shlok Meaning (English)"
          />
          <FormInput
            control={form.control}
            name="amazonLink"
            placeholder="Enter Amazon Link (https://...)"
            label="Amazon Link"
          /> */}
          <FormImageInput name="productImageUrl" label="Product Image URL" />
          <Button 
            type="submit" 
            className={`w-full ${isPending ? 'animate-pulse bg-blue-600' : ''}`} 
            disabled={isPending}
          >
            {isPending ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </div>
            ) : "Save"}
          </Button>
          {/* Form submission status indicator */}
          <div className="w-full text-center mt-2">
            <p className={`text-sm ${isPending ? 'text-blue-600' : 'text-gray-500'}`}>
              {isPending ? 'Please wait while we save your product...' : 'Click Save to add the product'}
            </p>
          </div>
          
          {/* <div className="mt-4 p-2 border border-gray-200 rounded-md bg-gray-50">
            <details>
              <summary className="cursor-pointer text-sm text-gray-700 font-medium">Debug Options</summary>
              <div className="mt-2 space-y-2 p-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full text-xs" 
                  onClick={async () => {
                    const { showApiInfo } = await import('@/lib/utils/api-info');
                    await showApiInfo();
                  }}
                >
                  Check API Configuration
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full text-xs" 
                  onClick={async () => {
                    const { checkApiStatus } = await import('@/lib/utils/api-check');
                    toast.info("Checking API connection...");
                    try {
                      const status = await checkApiStatus();
                      console.log("API status:", status);
                      if (status.reachable) {
                        toast.success(`API is reachable (${status.status})`);
                      } else {
                        toast.error(`API is unreachable: ${status.message}`);
                      }
                    } catch (err) {
                      console.error("API check error:", err);
                      toast.error("Failed to check API connection");
                    }
                  }}
                >
                  Test API Connection
                </Button>
              </div>
            </details>
          </div> */}
        </FormProvider>
      </main>
    </section>
  );
};

export default ProductForm;