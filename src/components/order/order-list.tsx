import { useEffect, useMemo, useRef, useState } from "react";
import LoadingScreen from "../common/loading-screen";
import DataTable from "../table/data-table-server";
import { Input } from "../ui/input";
import { Order } from "./orders";
import { useGetOrders } from "@/lib/react-query/order-query";
import { OrderColumns } from "./order-columns";
import { useOrderFunnel, useRevenueTrends, useRepeatPurchaseRate } from "@/lib/react-query/dashboard-analytics-query";
import { Card, CardContent, CardHeader, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Box, Check, Coins, RefreshCw, Users } from "lucide-react";

type TableFilter = {
  date: string;
  pageIndex: number;
  pageSize: number;
  search: string;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

const OrdersList = () => {
  const [search, setSearch] = useState<string>("");
  const searchInput = useRef<HTMLInputElement>();
  const [filter, setFilter] = useState<TableFilter>({
    pageIndex: 0,
    pageSize: 10,
    date: "",
    search: "",
  });

  // Date filter state
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });

  const changePage = ({ pageIndex }: { pageIndex: number }) => {
    setFilter((prev) => ({ ...prev, pageIndex: pageIndex }));
  };

  const { isLoading, data, isSuccess } = useGetOrders(filter);

  // Analytics hooks
  const dateParams = useMemo(() => {
    if (dateRange.startDate && dateRange.endDate) return dateRange;
    // Default to last 30 days
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return { startDate: start.toISOString().split("T")[0], endDate: end.toISOString().split("T")[0] };
  }, [dateRange]);

  const { data: funnelRaw } = useOrderFunnel(dateParams);
  const { data: trendsRaw } = useRevenueTrends(dateParams);
  const { data: repeatRaw } = useRepeatPurchaseRate(dateParams);

  const funnelData = Array.isArray(funnelRaw?.data ?? funnelRaw) ? (funnelRaw?.data ?? funnelRaw) : [];
  const trendsData = Array.isArray(trendsRaw?.data ?? trendsRaw) ? (trendsRaw?.data ?? trendsRaw) : [];
  const repeatData = repeatRaw?.data ?? repeatRaw;

  const orders: Order[] = useMemo(() => {
    if (data) return data?.data?.data?.docs ?? data?.data?.data ?? [];
    return [];
  }, [data]);

  const totalOrders = useMemo(() => {
    if (!funnelData) return 0;
    return funnelData.reduce((s: number, f: any) => s + f.count, 0);
  }, [funnelData]);

  const completedOrders = useMemo(() => {
    if (!funnelData) return 0;
    return funnelData.find((f: any) => f.status === "DELIVERED")?.count || 0;
  }, [funnelData]);

  const avgOrderValue = useMemo(() => {
    if (!trendsData || trendsData.length === 0) return 0;
    const sum = trendsData.reduce((s: number, t: any) => s + (t.aov || 0), 0);
    return sum / trendsData.length;
  }, [trendsData]);

  useEffect(() => {
    if (searchInput.current) searchInput.current.focus();
  });
  useEffect(() => {
    setFilter({ search, pageIndex: 0, pageSize: 10, date: "" });
  }, [search]);

  return (
    <section className="">
      <h2 className="mb-2 text-3xl tracking-wide">Orders List</h2>

      {/* Date Filter */}
      <div className="mt-4 mb-4 flex items-center gap-3 flex-wrap">
        <input
          type="date"
          value={dateRange.startDate}
          onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
          className="h-8 rounded-md border px-2 text-sm"
        />
        <span className="text-sm text-muted-foreground">to</span>
        <input
          type="date"
          value={dateRange.endDate}
          onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
          className="h-8 rounded-md border px-2 text-sm"
        />
        {dateRange.startDate && (
          <Button variant="ghost" size="sm" onClick={() => setDateRange({ startDate: "", endDate: "" })}>
            <RefreshCw className="h-3 w-3 mr-1" /> Reset
          </Button>
        )}
      </div>

      {/* Order Trend Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Box className="h-4 w-4" /> Total Orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Check className="h-4 w-4" /> Completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Coins className="h-4 w-4" /> Avg Order Value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgOrderValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Users className="h-4 w-4" /> Repeat Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{repeatData?.rate ?? 0}%</span>
              <Badge variant="secondary" className="text-xs">{repeatData?.repeatCustomers ?? 0} repeat</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 rounded-lg border bg-white px-4 py-6">
        <header className="mb-5  ml-2 flex items-center">
          <span className="mr-3 h-8 w-5 rounded-md bg-violet-300"></span>
          <Input
            value={search}
            placeholder="Search Orders here"
            onChange={(e) => setSearch(e.target.value)}
            className="w-96 placeholder:text-base"
          />
        </header>
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
