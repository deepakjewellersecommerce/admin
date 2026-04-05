import { useEffect, useMemo, useRef, useState } from "react";
import LoadingScreen from "../common/loading-screen";
import DataTable from "../table/data-table-server";
import { Input } from "../ui/input";
import { Order } from "./orders";
import { useGetOrders } from "@/lib/react-query/order-query";
import { OrderColumns } from "./order-columns";
import { orderAPI } from "@/lib/axios/order-API";
import * as XLSX from "xlsx";
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
  const summary = (data as any)?.summary || {
    totalOrders: 0,
    completedOrders: 0,
    avgOrderValue: 0,
    repeatRate: 0,
  };

  const orders: Order[] = useMemo(() => {
    if (data) {
      return (data as any).data || [];
    }
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

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      // Fetch all matching orders (no pagination for export)
      const res = await orderAPI.exportOrders({
        ...filter,
        pageSize: 10000, // Large number to get all results
      });

      const exportData = (res as any)?.data?.data?.data || [];
      console.log("Export Data for XLSX (Extracted):", exportData);

      if (!exportData || !Array.isArray(exportData) || exportData.length === 0) {
        alert("No data available to export.");
        return;
      }

      // Convert data to sheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Orders");
      
      const fileName = `Orders_Export_${new Date().toISOString().split("T")[0]}.csv`;
      
      // Use different logic based on how XLSX is imported
      const writeFn = (XLSX as any).writeFile || (XLSX as any).default?.writeFile;
      if (typeof writeFn === "function") {
        writeFn(wb, fileName, { bookType: "csv" });
      } else {
        XLSX.writeFile(wb, fileName, { bookType: "csv" });
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export orders. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const hasActiveFilters =
    filter.search || filter.payment_status || filter.order_status ||
    filter.startDate || filter.endDate;

  return (
    <section>
      <h2 className="mb-2 text-3xl tracking-wide">Orders List</h2>

      {/* ── Analytics metric cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 mb-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100/50 shadow-sm hover:shadow-md transition-all duration-300 group">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <CardDescription className="text-indigo-600/80 font-medium mb-1">Total Orders</CardDescription>
                <div className="text-3xl font-bold tracking-tight text-indigo-950">
                  {summary.totalOrders || 0}
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/15 transition-colors">
                <Box className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100/50 shadow-sm hover:shadow-md transition-all duration-300 group">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <CardDescription className="text-emerald-600/80 font-medium mb-1">Total Revenue</CardDescription>
                <div className="text-3xl font-bold tracking-tight text-emerald-950">
                  {formatCurrency(summary.totalRevenue || 0)}
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/15 transition-colors">
                <Coins className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100/50 shadow-sm hover:shadow-md transition-all duration-300 group">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <CardDescription className="text-amber-600/80 font-medium mb-1">Repeat Rate</CardDescription>
                <div className="text-3xl font-bold tracking-tight text-amber-950">
                  {summary.repeatRate || 0}%
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/15 transition-colors">
                <Users className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100/50 shadow-sm hover:shadow-md transition-all duration-300 group">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <CardDescription className="text-blue-600/80 font-medium mb-1">Delivered</CardDescription>
                <div className="text-3xl font-bold tracking-tight text-blue-950">
                  {summary.completedOrders || 0}
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/15 transition-colors">
                <Check className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filter bar ── */}
      <div className="mt-4 rounded-xl border bg-white/70 backdrop-blur-sm px-6 py-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-1 min-w-[300px] items-center gap-3">
            <div className="relative flex-1 group">
              <Input
                placeholder="Search name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-4 h-11 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/10 rounded-lg group-hover:border-gray-300 transition-colors"
              />
              {search && (
                <button 
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status:</span>
              <select
                className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 hover:border-gray-300 transition-colors outline-none min-w-[130px]"
                value={filter.order_status}
                onChange={(e) => setFilter(prev => ({ ...prev, order_status: e.target.value, pageIndex: 0 }))}
              >
                <option value="">Order Status</option>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{prettyLabel(s)}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment:</span>
              <select
                className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 hover:border-gray-300 transition-colors outline-none min-w-[140px]"
                value={filter.payment_status}
                onChange={(e) => setFilter(prev => ({ ...prev, payment_status: e.target.value, pageIndex: 0 }))}
              >
                <option value="">Payment Status</option>
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{prettyLabel(s)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">From:</span>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange("startDate", e.target.value)}
                className="h-11 w-44 border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">To:</span>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange("endDate", e.target.value)}
                className="h-11 w-44 border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={handleReset}
                className="h-11 px-6 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset Filters
              </Button>
            )}
            <Button 
              className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm shadow-indigo-200 transition-all font-medium disabled:opacity-70 disabled:cursor-not-allowed"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isExporting ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md">


        {isSuccess && (
          <div className="p-1">
            <DataTable
              columns={OrderColumns}
              data={orders}
              page={filter.pageIndex}
              totalPage={Math.ceil((data?.total || 0) / (filter.pageSize || 10)) || 1}
              changePage={changePage}
            />
          </div>
        )}
        {isLoading && <LoadingScreen />}
      </div>
    </section>
  );
};

export default OrdersList;
