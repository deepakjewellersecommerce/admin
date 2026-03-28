import { useEffect, useRef, useState } from "react";
import LoadingScreen from "../common/loading-screen";
import DataTable from "../table/data-table-server";
import { Input } from "../ui/input";
import { Blog } from "./blogs";
import { BlogColumns } from "./columns";
import { useGetBlogs } from "@/lib/react-query/blog-query";
import CustomSelect from "../ui/custom-select";


type TableFilter = {
  startDate: string;
  endDate: string;
  pageIndex: number;
  pageSize: number;
  search: string;
  status: string;
};
const BlogsList = () => {
  const searchInput = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<TableFilter>({
    pageIndex: 0,
    pageSize: 10,
    search: "",
    startDate: "",
    endDate: "",
    status: "all",
  });

  const changePage = ({ pageIndex }: { pageIndex: number }) => {
    setFilter((prev) => ({ ...prev, pageIndex: pageIndex }));
  };

  const { isLoading, data, isSuccess } = useGetBlogs(filter);
  const blogs: Blog[] = isSuccess ? Array.from(data?.data?.data?.blogs ?? []) : [];

  useEffect(() => {
    if (searchInput.current) searchInput.current.focus();
  }, []);

  const totalPage = Math.max(
    1,
    Math.ceil((data?.data?.data?.total ?? 0) / (data?.data?.data?.limit ?? filter.pageSize))
  );

  return (
    <section className="">
      <h2 className="mb-2 text-3xl tracking-wide">Blogs List</h2>
      <div className="mt-4 rounded-lg border bg-white px-4 py-6">
        <header className="mb-5 ml-2 flex flex-wrap items-center gap-4">
          <span className="mr-3 h-8 w-5 rounded-md bg-violet-300"></span>
          <Input
            ref={searchInput}
            value={filter.search}
            placeholder="Search Blogs here"
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, search: e.target.value, pageIndex: 0 }))
            }
            className="w-96 placeholder:text-base"
          />
          <CustomSelect
            options={[
              { label: "All Statuses", value: "all" },
              { label: "Published", value: "PUBLISHED" },
              { label: "Draft", value: "DRAFT" },
            ]}
            placeholder="Status"
            value={filter.status}
            onValueChange={(value) =>
              setFilter((prev) => ({ ...prev, status: value, pageIndex: 0 }))
            }
            className="w-40"
          />
          <Input
            type="date"
            value={filter.startDate}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, startDate: e.target.value, pageIndex: 0 }))
            }
            className="w-44"
          />
          <Input
            type="date"
            value={filter.endDate}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, endDate: e.target.value, pageIndex: 0 }))
            }
            className="w-44"
          />
        </header>
        {isSuccess && (
          <DataTable
            columns={BlogColumns}
            data={blogs}
            page={filter.pageIndex}
            totalPage={totalPage}
            changePage={changePage}
          />
        )}
        {isLoading && <LoadingScreen />}
      </div>
    </section>
  );
};

export default BlogsList;
