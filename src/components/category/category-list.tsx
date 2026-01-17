import { useEffect, useMemo, useRef, useState } from "react";
import LoadingScreen from "../common/loading-screen";
import { Input } from "../ui/input";
import { CategoryColumns } from "./columns";
import Category from "./category-model";
import { useGetCategories } from "@/lib/react-query/category-query";
import { DataTable } from "../table/data-table";

type TableFilter = {
  date: string;
  pageIndex: number;
  pageSize: number;
  search: string;
};
const CategoryList = () => {
  const [search, setSearch] = useState<string>("");
  const searchInput = useRef<HTMLInputElement>();
  const [filter, setFilter] = useState<TableFilter>({
    pageIndex: 0,
    pageSize: 10,
    date: "",
    search: "",
  });

  const { isLoading, data, isSuccess } = useGetCategories();

  const categories: Category[] = useMemo(() => {
    if (isSuccess) {
      const categories: Category[] = Array.from(data.data.categories);

      return categories
        .filter((category) =>
          category?.name
            ?.toLocaleLowerCase()
            .includes(filter?.search.toLocaleLowerCase())
        )
        .filter((category) => !category.parentId);
    }
    return [];
  }, [isSuccess, data, filter.search]);

  useEffect(() => {
    if (searchInput.current) searchInput.current.focus();
  });
  useEffect(() => {
    setFilter({ search, pageIndex: 0, pageSize: 10, date: "" });
  }, [search]);

  return (
    <section className="">
      <h2 className="mb-2 text-3xl tracking-wide">Category List</h2>
      <div className="mt-4 rounded-lg border bg-white px-4 py-6">
        <header className="mb-5  ml-2 flex items-center">
          <span className="mr-3 h-8 w-5 rounded-md bg-violet-300"></span>
          <Input
            value={search}
            placeholder="Search categorys here"
            onChange={(e) => setSearch(e.target.value)}
            className="w-96 placeholder:text-base"
          />
        </header>
        {isSuccess && <DataTable columns={CategoryColumns} data={categories} />}
        {isLoading && <LoadingScreen />}
      </div>
    </section>
  );
};

export default CategoryList;
