import { useEffect, useRef, useState } from "react";
import LoadingScreen from "../common/loading-screen";
import DataTable from "../table/data-table-server";
import { Input } from "../ui/input";
import Coupon from "./coupons"; // Assuming you have a Coupon type defined
import { useGetCoupons } from "@/lib/react-query/coupon-query"; // Assuming you have a hook to fetch coupons
import { CouponColumns } from "./column"; // Assuming you have defined columns for the coupons table
import CustomSelect from "../ui/custom-select";

type TableFilter = {
  startDate: string;
  endDate: string;
  pageIndex: number;
  pageSize: number;
  search: string;
  status: string;
  couponType: string;
  availability: string;
};

const CouponsList = () => {
  const searchInput = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<TableFilter>({
    pageIndex: 0,
    pageSize: 10,
    startDate: "",
    endDate: "",
    search: "",
    status: "all",
    couponType: "all",
    availability: "all",
  });

  const changePage = ({ pageIndex }: { pageIndex: number }) => {
    setFilter((prev) => ({ ...prev, pageIndex: pageIndex }));
  };

  const { isLoading, data, isSuccess } = useGetCoupons(filter);
  const coupons: Coupon[] = isSuccess ? Array.from(data?.data?.data?.coupons ?? []) : [];

  useEffect(() => {
    if (searchInput.current) searchInput.current.focus();
  }, []);

  return (
    <section className="">
      <h2 className="mb-2 text-3xl tracking-wide">Coupons List</h2>
      <div className="mt-4 rounded-lg border bg-white px-4 py-6">
        <header className="mb-5 ml-2 flex flex-wrap items-center gap-4">
          <span className="mr-3 h-8 w-5 rounded-md bg-violet-300"></span>
          <Input
            ref={searchInput}
            value={filter.search}
            placeholder="Search Coupons here"
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, search: e.target.value, pageIndex: 0 }))
            }
            className="w-96 placeholder:text-base"
          />
          <CustomSelect
            options={[
              { label: "All Statuses", value: "all" },
              { label: "Active", value: "ACTIVE" },
              { label: "Expired", value: "EXPIRED" },
              { label: "Exhausted", value: "EXHAUSTED" },
            ]}
            placeholder="Status"
            value={filter.status}
            onValueChange={(value) =>
              setFilter((prev) => ({ ...prev, status: value, pageIndex: 0 }))
            }
            className="w-40"
          />
          <CustomSelect
            options={[
              { label: "All Types", value: "all" },
              { label: "INR", value: "INR" },
              { label: "Percentage", value: "PERCENTAGE" },
            ]}
            placeholder="Type"
            value={filter.couponType}
            onValueChange={(value) =>
              setFilter((prev) => ({ ...prev, couponType: value, pageIndex: 0 }))
            }
            className="w-40"
          />
          <CustomSelect
            options={[
              { label: "All Availability", value: "all" },
              { label: "In Stock", value: "in_stock" },
              { label: "Out of Stock", value: "out_of_stock" },
            ]}
            placeholder="Availability"
            value={filter.availability}
            onValueChange={(value) =>
              setFilter((prev) => ({ ...prev, availability: value, pageIndex: 0 }))
            }
            className="w-44"
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
            columns={CouponColumns}
            data={coupons}
            page={filter.pageIndex}
            totalPage={data?.data?.data?.pagination?.totalPages ?? 1}
            changePage={changePage}
          />
        )}
        {isLoading && <LoadingScreen />}
      </div>
    </section>
  );
};

export default CouponsList;
