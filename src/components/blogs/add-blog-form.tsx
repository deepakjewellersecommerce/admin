import { useAddBlog } from "@/lib/react-query/blog-query";
import { useNavigate } from "react-router";
import BlogForm from "./blog-form";

const AddBlogForm = () => {
  const navigate = useNavigate();
  const { mutate, isPending } = useAddBlog();
  const onSubmit = (data: any) => {
    mutate(data, {
      onSuccess: () => {
        setTimeout(() => navigate("/dashboard/blogs/list"), 600);
      },
    });
  };
  return (
    <section className="flex flex-col space-y-4">
      <header className="border-b mb-10 pb-4">
        <h1 className="text-2xl font-bold">Add Blog</h1>
        <p className="text-sm text-gray-500">
          Add a new product to your store.
        </p>
      </header>
      <BlogForm isPending={isPending} onSubmit={onSubmit} />
    </section>
  );
};

export default AddBlogForm;
