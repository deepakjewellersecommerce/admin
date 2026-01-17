import CategoryForm, { CategoryFormType } from "./category-form";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetCategories,
  useUpdateCategory,
} from "@/lib/react-query/category-query";
import { useMemo } from "react";

const EditCategoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useGetCategories();

  const { mutate, isPending } = useUpdateCategory();
  const onSubmit = (data: any) => {
    
    // Check if there are uploaded files that need FormData
    const selectedFiles = (((data as any).images) || []) as File[];
    const categoryId = id; // Extract id before FormData creation
    
    if (selectedFiles && selectedFiles.length > 0) {
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append("name", String(data.name));
      formData.append("slug", String(data.slug));
      formData.append("type", String(data.type));
      formData.append("parentId", String(data.parentId || ""));
      formData.append("isActive", String(data.isActive));
      
      // Handle imageUrl - it's always a string URL now
      formData.append("imageUrl", String(data.imageUrl || ""));
      
      selectedFiles.forEach((file) => {
        formData.append("image", file);
      });
      
      mutate({ formData, _id: categoryId }, {
        onSuccess: () => {
          // small delay so the success toast is visible before redirect
          setTimeout(() => navigate("/dashboard/categories/list"), 600);
        },
      });
    } else {
      mutate({ ...data, _id: categoryId }, {
        onSuccess: () => {
          // small delay so the success toast is visible before redirect
          setTimeout(() => navigate("/dashboard/categories/list"), 600);
        },
      });
    }
  };
  const defaultValues: CategoryFormType = useMemo(() => {
    if (!data) return null;
    const category = data.data.categories.find(
      (category: any) => category._id === id
    );
    if (category)
      return {
        name: category.name,
        imageUrl: category.imageUrl,
        bannerImageUrl: category.bannerImageUrl,
        slug: category.slug,
        type: category.type,
        isActive:category.isActive,
        parentId: category.parentId || "",
        images: [],
      } as any;

    return {
      name: "",
      imageUrl: "",
      slug: "",
      type: "main",
      parentId: "",
      images: [],
    };
  }, [data, id]);

  if (isLoading && !defaultValues) return <div>Loading...</div>;

  return (
    <section className="flex flex-col space-y-4">
      <header className="border-b mb-6 pb-4">
        <h1 className="text-2xl font-bold">Edit Category</h1>
        <p className="text-sm text-gray-500">
          update a category in your store.
        </p>
      </header>{" "}
      <CategoryForm
        defaultValues={defaultValues}
        isPending={isPending}
        onSubmit={onSubmit}
        showUrlInput={false}
      />
    </section>
  );
};

export default EditCategoryForm;
