import { useEffect, useMemo, useRef, useState } from "react";
import LoadingScreen from "../common/loading-screen";
import DataTable from "../table/data-table-server";
import { Input } from "../ui/input";
import { Order } from "./orders";
import { useGetOrders } from "@/lib/react-query/order-query";
import { OrderColumns } from "./order-columns";
import { Card, CardContent, CardHeader, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Box, Check, Coins, RefreshCw, Users } from "lucide-react";

type TableFilter = {
  pageIndex: number;
  pageSize: number;
  search: string;
  payment_status: string;
  order_status: string;
  startDate: string;
  endDate: string;
};

const PAYMENT_STATUSES = ["PENDING", "COMPLETE", "FAILED", "REFUNDED"];
const ORDER_STATUSES = [
  "PLACED", "CONFIRMED", "PROCESSING", "SHIPPED",
  "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED_BY_CUSTOMER",
  "CANCELLED_BY_ADMIN", "RETURNED", "REFUNDED",
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount);

const prettyLabel = (s: string) =>
  s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const EMPTY_FILTER: TableFilter = {
  pageIndex: 0,
  pageSize: 10,
  search: "",
  payment_status: "",
  order_status: "",
  startDate: "",
  endDate: "",
};

const OrdersList = () => {
  const [search, setSearch] = useState("");
  const searchInput = useRef<HTMLInputElement>();
  const [filter, setFilter] = useState<TableFilter>(EMPTY_FILTER);

  // Separate state for analytics cards (default to last 30 days if not set)
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });

  const changePage = ({ pageIndex }: { pageIndex: number }) => {
    setFilter((prev) => ({ ...prev, pageIndex }));
  };

  const { isLoading, data, isSuccess } = useGetOrders(filter);

  // Unified metrics from the unified orders API response
  const summary = data?.data?.summary || {
    totalOrders: 0,
    completedOrders: 0,
    avgOrderValue: 0,
    repeatRate: 0,
  };

  const orders: Order[] = useMemo(() => {
    if (data) return data?.data?.data || [];
    return [];
  }, [data]);

  // Focus search on mount
  useEffect(() => {
    if (searchInput.current) searchInput.current.focus();
  }, []);

  // Spread-update so other filter fields are preserved when search changes
  useEffect(() => {
    setFilter((prev) => ({ ...prev, search, pageIndex: 0 }));
  }, [search]);

  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
    setFilter((prev) => ({ ...prev, [field]: value, pageIndex: 0 }));
  };

  const handleReset = () => {
    setSearch("");
    setDateRange({ startDate: "", endDate: "" });
    setFilter(EMPTY_FILTER);
  };

  const hasActiveFilters =
    filter.search || filter.payment_status || filter.order_status ||
    filter.startDate || filter.endDate;

  return (
    <section>
      <h2 className="mb-2 text-3xl tracking-wide">Orders List</h2>

      {/* ── Analytics metric cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Box className="h-4 w-4" /> Total Orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Check className="h-4 w-4" /> Completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.completedOrders}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Coins className="h-4 w-4" /> Avg Order Value
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.avgOrderValue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Users className="h-4 w-4" /> Repeat Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{summary.repeatRate}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filter bar ── */}
      <div className="mt-4 rounded-lg border bg-white px-4 py-5">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="h-8 w-5 rounded-md bg-violet-300 shrink-0" />
            <Input
              ref={searchInput as any}
              value={search}
              placeholder="Search by name or phone…"
              onChange={(e) => setSearch(e.target.value)}
              className="w-72 placeholder:text-sm"
            />
          </div>

          {/* Date range */}
          <input
            type="date"
            value={filter.startDate}
            onChange={(e) => handleDateChange("startDate", e.target.value)}
            className="h-9 rounded-md border px-2 text-sm"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <input
            type="date"
            value={filter.endDate}
            onChange={(e) => handleDateChange("endDate", e.target.value)}
            className="h-9 rounded-md border px-2 text-sm"
          />

          {/* Order status */}
          <select
            value={filter.order_status}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, order_status: e.target.value, pageIndex: 0 }))
            }
            className="h-9 rounded-md border px-2 text-sm bg-white"
          >
            <option value="">All Order Statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{prettyLabel(s)}</option>
            ))}
          </select>

          {/* Payment status */}
          <select
            value={filter.payment_status}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, payment_status: e.target.value, pageIndex: 0 }))
            }
            className="h-9 rounded-md border px-2 text-sm bg-white"
          >
            <option value="">All Payment Statuses</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{prettyLabel(s)}</option>
            ))}
          </select>

          {/* Reset */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RefreshCw className="h-3 w-3 mr-1" /> Reset
            </Button>
          )}
        </div>

        {isSuccess && (
          <DataTable
            columns={OrderColumns}
            data={orders}
            page={filter.pageIndex}
            totalPage={data?.data?.data?.totalPages ?? data?.data?.totalPage}
            changePage={changePage}
          />
        )}
        {isLoading && <LoadingScreen />}
      </div>
    </section>
  );
};

export default OrdersList;
