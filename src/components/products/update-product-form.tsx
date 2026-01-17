import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
import FormImageInput from "../form/FormImage";
import FormInput from "../form/FormInput";
import FormTextArea from "../form/FormTextArea";
import FormGroupSelect from "../form/form-select";
import {
  useGetProduct,
  useUpdateProduct,
} from "@/lib/react-query/product-query";
import FormProvider from "../form/FormProvider";
import { useGetCategories } from "@/lib/react-query/category-query";
import { useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import LoadingScreen from "../common/loading-screen";
import FormSwitch from "../form/form-switch";
import { useGetBrandOptions } from "@/lib/react-query/brand-query";
import { nestedLabel } from "@/lib/utils/category-utils";
// ...existing imports

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
  
});

export type ProductType = z.infer<typeof productSchema>;
const emptyProduct: ProductType = {
  productTitle: "",
  productSlug: "",
  skuNo: "",
  regularPrice: "",
  category: "",
  salePrice: "",
  productDescription: "",
  isActive: true,
  isFeatured: false,
  careHandling: "",
  gst: "",
  productImageUrl: "",
  brand: "",
  ingredients: "",
  benefits: "",
  shlokText: "",
  shlokMeaning: "",
  amazonLink: "",
};

const UpdateProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: productData, isLoading: productLoading } = useGetProduct(
    id ?? ""
  );
  const { options: brandOptions } = useGetBrandOptions();

  const { data, isLoading } = useGetCategories();
  const categoryOptions = useMemo(() => {
    if (data) {
      const categories = Array.from(data.data.categories)
        .map((category: any) => {
          return {
            label:
              nestedLabel(category, data.data.categories) || category.name,
            value: category._id,
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label));
      return categories;
    }
    return [];
  }, [data]);
  const { mutate, isPending } = useUpdateProduct();

  const form = useForm<ProductType>({
    resolver: zodResolver(productSchema),
    defaultValues: emptyProduct,
  });
  useEffect(() => {
    try {
      const product = productData?.data.data.product;
      if (productData) {
          const formData = {
          productTitle: product.productTitle,
          productSlug: product.productSlug,
          skuNo: product.skuNo,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          regularPrice: String(product.regularPrice),
          category: product.category._id,
          salePrice: String(product.salePrice),
          productDescription: product.productDescription,
          careHandling: product.careHandling ?? " ",
          gst: String(product.gst),
          // Normalize productImageUrl to a single string for the form UI
          productImageUrl: Array.isArray(product.productImageUrl)
            ? (product.productImageUrl[0] ?? "")
            : (product.productImageUrl ?? ""),
          brand: product.brand,
          ingredients: product.ingredients ?? "",
          benefits: product.benefits ?? "",
          shlokText: product.shlok?.shlokText ?? "",
          shlokMeaning: product.shlok?.shlokMeaning ?? "",
          amazonLink: product.amazonLink ?? "",
          
        };
        form.reset(formData);
      }
    } catch (e) {
      console.log(e, "error");
    }
  }, [form, productData]);
  if (productLoading || isLoading) return <LoadingScreen />;
  const onSubmit = (data: any) => {
    // Transform form data to match API expectations
    const transformedData = {
      ...data,
      productImageUrl: Array.isArray(data.productImageUrl)
        ? data.productImageUrl
        : (data.productImageUrl ? [data.productImageUrl] : []),
      ingredients: data.ingredients || "",
      benefits: data.benefits || "",
      shlok: {
        shlokText: data.shlokText || "",
        shlokMeaning: data.shlokMeaning || "",
      },
      amazonLink: data.amazonLink || "",
    };

    // If images files are present in the form state, the route will accept multipart uploads.
    mutate({
      product: transformedData,
      _id: id,
    }, {
      onSuccess: () => {
        navigate(`/dashboard/products/list`);
      }
    });
  };

  return (
    <section className="flex flex-col  space-y-4">
      <header className="border-b mb-10 pb-4">
        <h1 className="text-2xl font-bold">Update Product</h1>
        <p className="text-sm text-gray-500">
          Update your product product to your store.
        </p>
      </header>
      <main className="max-w-lg p-4 bg-white mt-20">
        <FormProvider
          className="space-y-4"
          methods={form}
          onSubmit={form.handleSubmit(onSubmit, console.error)}
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
          <FormInput
            control={form.control}
            name="productTitle"
            placeholder="Enter Product Title"
            label="Product Title"
          />
          <FormGroupSelect
            placeholder="Select Category"
            disabled={isLoading}
            control={form.control}
            name="category"
            defaultValue={productData?.data?.data?.product?.category?._id ?? ""}
            label="Category"
            options={categoryOptions}
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
          {/* Size Chart removed as not required */}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </FormProvider>
      </main>
    </section>
  );
};

export default UpdateProductForm;
