import { useEffect, useRef, useState } from "react";
import LoadingScreen from "../common/loading-screen";
import DataTable from "../table/data-table-server";
import { Input } from "../ui/input";
import { BannerColumns } from "./columns"; // Assuming you have columns defined for banners
import { useGetBanners } from "@/lib/react-query/banner-query"; // Assuming you have a hook for fetching banners
import { Banner } from "./banner"; // Update import
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import CustomSelect from "../ui/custom-select";

type TableFilter = {
  pageIndex: number;
  pageSize: number;
  search: string;
  isActive: string;
};

const BannersList = () => {
  const searchInput = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<TableFilter>({
    pageIndex: 0,
    pageSize: 10,
    search: "",
    isActive: "all",
  });

  const changePage = ({ pageIndex }: { pageIndex: number }) => {
    setFilter((prev) => ({ ...prev, pageIndex }));
  };

  const { isLoading, data, isSuccess } = useGetBanners(filter);
  const banners: Banner[] = isSuccess ? Array.from(data?.data?.data?.banners ?? []) : [];

  useEffect(() => {
    if (searchInput.current) searchInput.current.focus();
  }, []);

  const totalPage = Math.max(
    1,
    Math.ceil((data?.data?.data?.total ?? 0) / (data?.data?.data?.limit ?? filter.pageSize))
  );

  return (
    <section className="">
      <h2 className="mb-2 text-3xl tracking-wide">Banners List</h2>
      <div className="mt-4 rounded-lg border bg-white px-4 py-6">
        <header className="mb-5 ml-2 flex flex-wrap items-center gap-4">
          <span className="mr-3 h-8 w-5 rounded-md bg-violet-300"></span>
          <Input
            value={filter.search}
            placeholder="Search Banners here"
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, search: e.target.value, pageIndex: 0 }))
            }
            className="w-96 placeholder:text-base"
            ref={searchInput}
          />
          <CustomSelect
            options={[
              { label: "All Banners", value: "all" },
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
            placeholder="Status"
            value={filter.isActive}
            onValueChange={(value) =>
              setFilter((prev) => ({ ...prev, isActive: value, pageIndex: 0 }))
            }
            className="w-40"
          />
          <Link to="/dashboard/banners/add" className="ml-auto">
            <Button>Add Banner</Button>
          </Link>
        </header>
        {isSuccess && (
          <DataTable
            columns={BannerColumns}
            data={banners}
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

export default BannersList;
