import { z } from "zod";
import FormProvider from "../form/FormProvider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormInput from "../form/FormInput";
import FormImageInput from "../form/FormImage";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import FormGroupSelect from "../form/form-select";
import { useGetCategories } from "@/lib/react-query/category-query";
import { useEffect, useMemo, useRef } from "react";
import { ComboboxSelect } from "../ui/combobox";
import { Label } from "../ui/label";
import LoadingScreen from "../common/loading-screen";
import FormSwitch from "../form/form-switch";
import { nestedLabel } from "@/lib/utils/category-utils";

const typeOptions = [
  {
    label: "Footer Menu",
    value: "Footer",
  },
  {
    label: "Main Menu",
    value: "main",
  },
];
const categorySchema = z.object({
  type: z.enum(["Footer", "main"]),
  name: z.string().min(1, "Category Name is required"),
  isActive: z.boolean(),
  parentId: z.string().optional(),
  slug: z.string().refine((value) => value.length > 0, {
    message: "Category Slug is required",
  }),
  imageUrl: z.string().url(),
  bannerImageUrl: z.string().url().optional(),
  images: z.array(z.any()).optional(),
});

export type CategoryFormType = z.infer<typeof categorySchema>;

type Props = {
  onSubmit: (data: CategoryFormType) => void;
  isPending: boolean;
  defaultValues: CategoryFormType;
  showUrlInput?: boolean;
};
const CategoryForm = ({ isPending, onSubmit, defaultValues, showUrlInput = true }: Props) => {
  const form = useForm<CategoryFormType>({
    resolver: zodResolver(categorySchema),
    defaultValues: { ...defaultValues },
  });

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
        .sort((a, b) => a.label.localeCompare(b.label))

        categories.unshift({ label: "None", value: "" });

      return categories;
    }
    return [];
  }, [data]);
  const name = form.watch("name");
  const slug = form.watch("slug");
  const autoSlugRef = useRef("");

  // Auto-generate slug from name (lowercase, spaces -> underscore) unless user customized it
  useEffect(() => {
    const currentName = name || "";
    const generated = currentName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .replace(/\s+/g, "_");

    const currentSlug = form.getValues("slug") || "";
    if (!currentSlug || currentSlug === autoSlugRef.current) {
      form.setValue("slug", generated);
      autoSlugRef.current = generated;
    }
  }, [name, form]);

  // Sanitize slug when user edits it: allow lowercase alnum and underscores
  useEffect(() => {
    if (typeof slug !== "undefined") {
      const clean = (slug || "")
        .toLowerCase()
        .replace(/[^a-z0-9_\s]/g, "")
        .trim()
        .replace(/\s+/g, "_");
      if (clean !== slug) {
        form.setValue("slug", clean);
      }
    }
  }, [slug, form]);

  if (isLoading) return <LoadingScreen />;
  
  return (
    <main className="max-w-lg bg-white p-4 rounded-md  mt-20">
      <FormProvider
        className="space-y-4"
        methods={form}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <h2 className="font-semibold text-gray-800 text-xl mb-4">
          Category Form
        </h2>
        {Object.keys(form.formState.errors).length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Form Validation Errors:</p>
            <pre className="text-xs mt-2">{JSON.stringify(form.formState.errors, null, 2)}</pre>
          </div>
        )}
        <FormGroupSelect
          control={form.control}
          name="type"
          placeholder="Select Category Type"
          label="Category Type"
          options={typeOptions}
        />
        <FormSwitch
          control={form.control}
          name="isActive"
          label="Is Active"
          description="If Active it will be shown to the user on the featured products page"
        />
        <div className="flex flex-col gap-2">
          <Label htmlFor="parentId">Parent Category</Label>
          <ComboboxSelect
            className="w-full"
            options={categoryOptions}
            onValueChange={(e) => {
              form.setValue("parentId", e, { shouldValidate: true });
            }}
            value={form.watch("parentId") || ""}
          />
        </div>
        <FormInput
          control={form.control}
          name="name"
          placeholder="Enter Category Name"
          label="Category Name"
        />
        <FormInput
          control={form.control}
          name="slug"
          placeholder="Enter Category Slug"
          label="Category Slug"
        />

        <div className="mt-4">
          <FormImageInput name="imageUrl" label="Category Image" />
          {showUrlInput && (
            <>
              <div className="flex mt-2 items-center gap-2 font-semibold text-gray-700 w-full">
                <Separator className="w-[calc(50%-20px)]" /> OR{" "}
                <Separator className="w-[calc(50%-20px)]" />
              </div>
              <FormInput
                control={form.control}
                name="imageUrl"
                placeholder="Enter Category Image URL"
                label="Category Image"
              />
            </>
          )}
        </div>
        {/* <div className="mt-4">
          <FormImageInput name="bannerImageUrl" label="Category Banner Image" />
          <div className="flex mt-2 items-center gap-2 font-semibold text-gray-700 w-full">
            <Separator className="w-[calc(50%-20px)]" /> OR{" "}
            <Separator className="w-[calc(50%-20px)]" />
          </div>
          <FormInput
            control={form.control}
            name="bannerImageUrl"
            placeholder="Enter Category Banner Image URL"
            label="Category Banner Image"
          />
        </div> */}

        <Button
          className="w-full mt-4 flex justify-center"
          type="submit"
          disabled={isPending}
          onClick={() => {
          }}
        >
          {isPending && <Loader2 className="animate-spin mr-2" size={18} />}
          {isPending ? "Submitting..." : "Submit"}
        </Button>
      </FormProvider>
    </main>
  );
};

export default CategoryForm;
