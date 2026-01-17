import { useEffect, useMemo, useRef, useState } from "react";
import LoadingScreen from "../common/loading-screen";
import { Input } from "../ui/input";
import { CategoryColumns } from "./columns";
import Category from "./category-model";
import { useGetCategories } from "@/lib/react-query/category-query";
import { DataTable } from "../table/data-table";
import { useParams } from "react-router";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";

const CategoryPage = () => {
  const [search, setSearch] = useState<string>("");
  const searchInput = useRef<HTMLInputElement>();
  const [categorys, setcategorys] = useState<Category[]>([]);

  const { id } = useParams();
  const { isLoading, data, isSuccess } = useGetCategories();

  useEffect(() => {
    if (isSuccess) {
      const categorys: any[] = Array.from(data.data.categories).filter(
        (category: any) => category.parentId === id
      );
      setcategorys(categorys);
    }
  }, [isSuccess, data, id]);

  const currentCategory: any = useMemo(() => {
    if (data)
      return Array.from(data.data.categories).find(
        (category: any) => category._id === id
      );

    return null;
  }, [data, id]);

  const parentCategory: any = useMemo(() => {
    if (data)
      return Array.from(data.data.categories).find(
        (category: any) => category._id === currentCategory?.parentId
      );

    return null;
  }, [data, currentCategory]);

  useEffect(() => {
    if (searchInput.current) searchInput.current.focus();
  });

  return (
    <section className="">
      <div className="bg-white p-4">
        <h3 className="text-lg border-b pb-4 font-semibold mb-2">
          Category Details
        </h3>
        <div className="flex gap-12">
          <div>
            <h4 className="text-sm mb-1 font-semibold">Category Name</h4>
            <p className="text-sm">{currentCategory?.name}</p>
          </div>
          <div>
            <h4 className="text-sm mb-1 font-semibold">Category Type</h4>
            <p className="text-sm">{currentCategory?.type}</p>
          </div>
          <div>
            <h4 className="text-sm mb-1  font-semibold">Category Image</h4>
            <img
              src={currentCategory?.imageUrl}
              alt={currentCategory?.name}
              className="w-16 h-16 object-cover bg-gray-50"
            />
          </div>
          <div>
            <h4 className="text-sm mb-1  font-semibold">Parent Category</h4>
            <p className="text-sm">{parentCategory?.name ?? "Main Category"}</p>
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-lg border bg-white px-4 py-6">
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold pb-4 border-b mb-4 tracking-wide">
            Sub Categories
          </h2>
          <Link to={`/dashboard/categories/add?parentId=${id}`}>
            <Button>Add Sub Category</Button>
          </Link>
        </div>
        <header className="mb-5  ml-2 flex items-center">
          <span className="mr-3 h-8 w-5 rounded-md bg-violet-300"></span>
          <Input
            value={search}
            placeholder="Search sub categories here"
            onChange={(e) => setSearch(e.target.value)}
            className="w-96 placeholder:text-base"
          />
        </header>
        {isSuccess && <DataTable columns={CategoryColumns} data={categorys} />}
        {isLoading && <LoadingScreen />}
      </div>
    </section>
  );
};

export default CategoryPage;
