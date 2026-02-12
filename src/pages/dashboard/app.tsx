import DashboardCard from "@/components/dashboard/card";
import LowStockAlert from "@/components/products/low-stock-alert";
import { useDashboardData } from "@/lib/react-query/auth-query";
import { useGetLowStockProducts } from "@/lib/react-query/product-query";
import { useGetAllMetalPrices } from "@/lib/react-query/metal-price-query";
import {
  useRevenueTrends,
  useRepeatPurchaseRate,
  useDashboardKPIs,
} from "@/lib/react-query/dashboard-analytics-query";
import {
  Box,
  Package,
  User,
  ShoppingCart,
  TimerIcon,
  Check,
  X,
  LucideIcon,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Gem,
  AlertTriangle,
  Star,
  Users,
  Calendar,
  Coins,
  RefreshCw,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { InfoTip, formatCurrency } from "@/lib/analytics-utils";

type TimeFilter = "daily" | "weekly" | "monthly" | "yearly" | "lifetime";

const getDateRange = (filter: TimeFilter, customRange?: { startDate: string; endDate: string }) => {
  if (customRange?.startDate && customRange?.endDate) return customRange;
  const now = new Date();
  const start = new Date();
  switch (filter) {
    case "daily":
      start.setDate(now.getDate() - 1);
      break;
    case "weekly":
      start.setDate(now.getDate() - 7);
      break;
    case "monthly":
      start.setMonth(now.getMonth() - 1);
      break;
    case "yearly":
      start.setFullYear(now.getFullYear() - 1);
      break;
    case "lifetime":
      return {};
  }
  return { startDate: start.toISOString().split("T")[0], endDate: now.toISOString().split("T")[0] };
};

const getGroupBy = (filter: TimeFilter) => {
  switch (filter) {
    case "daily": return "day";
    case "weekly": return "day";
    case "monthly": return "week";
    case "yearly": return "month";
    case "lifetime": return "month";
  }
};

const DashboardHome = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("monthly");
  const [customRange, setCustomRange] = useState({ startDate: "", endDate: "" });

  const dateRange = useMemo(() => getDateRange(timeFilter, customRange.startDate ? customRange : undefined), [timeFilter, customRange]);
  const groupBy = useMemo(() => getGroupBy(timeFilter), [timeFilter]);

  // Existing data hooks — these metric cards are unique to Overview
  const defaultOrderMetrics = useMemo(() => [
    { title: "Total Orders", value: "0", icon: Box },
    { title: "Complete Orders", value: "0", icon: Check },
    { title: "Pending Orders", value: "0", icon: TimerIcon },
    { title: "Canceled Orders", value: "0", icon: X },
  ], []);

  const defaultRevenueMetrics = useMemo(() => [
    { title: "Revenue", value: "₹0", icon: IndianRupee },
    { title: "Orders (Revenue)", value: "0", icon: Calendar },
    { title: "Total Revenue", value: "₹0", icon: TrendingUp },
    { title: "Avg Order Value", value: "₹0", icon: Coins },
  ], []);

  const defaultProductMetrics = useMemo(() => [
    { title: "Total Products", value: "0", icon: ShoppingCart },
    { title: "Active Products", value: "0", icon: Check },
    { title: "Out of Stock", value: "0", icon: AlertTriangle },
    { title: "Featured Products", value: "0", icon: Star },
  ], []);

  const defaultCustomerMetrics = useMemo(() => [
    { title: "Total Customers", value: "0", icon: Users },
    { title: "New Users", value: "0", icon: User },
    { title: "Total Categories", value: "0", icon: Package },
    { title: "Total Subcategories", value: "0", icon: Box },
  ], []);

  const { data } = useDashboardData(dateRange);
  const { data: lowStockData, isLoading: isLoadingLowStock } = useGetLowStockProducts(5);
  const { data: metalPricesData } = useGetAllMetalPrices();

  // Revenue trend & repeat rate for growth KPIs
  const { data: trendsRaw } = useRevenueTrends({ ...dateRange, groupBy });
  const { data: repeatRaw } = useRepeatPurchaseRate(dateRange);
  const { data: kpiData } = useDashboardKPIs();

  // Unwrap nested data
  const trendsData = trendsRaw?.data ?? trendsRaw;
  const repeatData = repeatRaw?.data ?? repeatRaw;

  const lowStockItems = useMemo(() => lowStockData?.data?.data?.items || [], [lowStockData]);
  const metalPrices = useMemo(() => metalPricesData?.data?.prices || metalPricesData?.prices || [], [metalPricesData]);

  const { orderMetrics, revenueMetrics, productMetrics, customerMetrics } = useMemo(() => {
    if (data?.data?.data) {
      return {
        orderMetrics: data.data.data.orderMetrics ?? [],
        revenueMetrics: data.data.data.revenueMetrics ?? [],
        productMetrics: data.data.data.productMetrics ?? [],
        customerMetrics: data.data.data.customerMetrics ?? [],
      };
    }
    return { orderMetrics: [], revenueMetrics: [], productMetrics: [], customerMetrics: [] };
  }, [data]);

  const mergeMetrics = (defaults: any[], api: any[]) =>
    defaults.map((d, i) => ({
      ...d,
      title: api[i]?.title || d.title,
      value: api[i]?.value || d.value,
    }));
  const displayOrderMetrics = useMemo(() => mergeMetrics(defaultOrderMetrics, orderMetrics), [defaultOrderMetrics, orderMetrics]);
  const displayRevenueMetrics = useMemo(() => mergeMetrics(defaultRevenueMetrics, revenueMetrics), [defaultRevenueMetrics, revenueMetrics]);
  const displayProductMetrics = useMemo(() => mergeMetrics(defaultProductMetrics, productMetrics), [defaultProductMetrics, productMetrics]);
  const displayCustomerMetrics = useMemo(() => mergeMetrics(defaultCustomerMetrics, customerMetrics), [defaultCustomerMetrics, customerMetrics]);

  // Computed growth KPIs
  const trendsList = Array.isArray(trendsData) ? trendsData : [];
  const totalRevenue = useMemo(() => trendsList.reduce((s: number, t: any) => s + (t.revenue || 0), 0), [trendsList]);
  const avgAOV = useMemo(() => {
    if (!trendsList.length) return 0;
    const sum = trendsList.reduce((s: number, t: any) => s + (t.aov || 0), 0);
    return sum / trendsList.length;
  }, [trendsList]);

  const getPriceChangeColor = (change24h: number) => {
    if (change24h > 0) return "text-red-600";
    if (change24h < 0) return "text-green-600";
    return "text-gray-600";
  };

  const timeFilters: { label: string; value: TimeFilter }[] = [
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
    { label: "Yearly", value: "yearly" },
    { label: "Lifetime", value: "lifetime" },
  ];

  const handleQuickPreset = (preset: string) => {
    const now = new Date();
    const start = new Date();
    switch (preset) {
      case "this-week":
        start.setDate(now.getDate() - now.getDay());
        break;
      case "this-month":
        start.setDate(1);
        break;
      case "this-year":
        start.setMonth(0, 1);
        break;
    }
    setCustomRange({
      startDate: start.toISOString().split("T")[0],
      endDate: now.toISOString().split("T")[0],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard Home</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Time Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1">
              {timeFilters.map((f) => (
                <Button
                  key={f.value}
                  variant={timeFilter === f.value && !customRange.startDate ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setTimeFilter(f.value); setCustomRange({ startDate: "", endDate: "" }); }}
                >
                  {f.label}
                </Button>
              ))}
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="flex gap-1">
              {[
                { label: "This Week", value: "this-week" },
                { label: "This Month", value: "this-month" },
                { label: "This Year", value: "this-year" },
              ].map((p) => (
                <Button key={p.value} variant="ghost" size="sm" onClick={() => handleQuickPreset(p.value)}>
                  {p.label}
                </Button>
              ))}
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customRange.startDate}
                onChange={(e) => setCustomRange((prev) => ({ ...prev, startDate: e.target.value }))}
                className="h-8 rounded-md border px-2 text-sm"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <input
                type="date"
                value={customRange.endDate}
                onChange={(e) => setCustomRange((prev) => ({ ...prev, endDate: e.target.value }))}
                className="h-8 rounded-md border px-2 text-sm"
              />
              {customRange.startDate && (
                <Button variant="ghost" size="sm" onClick={() => setCustomRange({ startDate: "", endDate: "" })}>
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Alerts Banner */}
      {kpiData && (kpiData.alerts?.pendingOrders > 0 || kpiData.alerts?.stockOutOrders > 0 || kpiData.alerts?.pricingErrors > 0) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="font-semibold text-amber-800 text-sm">Action Required</span>
            </div>
            <div className="flex flex-wrap gap-4">
              {kpiData.alerts.pendingOrders > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="destructive">{kpiData.alerts.pendingOrders}</Badge>
                  <span className="text-amber-900">orders pending &gt;24h</span>
                </div>
              )}
              {kpiData.alerts.stockOutOrders > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="destructive">{kpiData.alerts.stockOutOrders}</Badge>
                  <span className="text-amber-900">orders with out-of-stock items</span>
                </div>
              )}
              {kpiData.alerts.pricingErrors > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary">{kpiData.alerts.pricingErrors}</Badge>
                  <span className="text-amber-900">products with pricing issues</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue Trend
          </CardTitle>
          <CardDescription>Revenue over the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {trendsList.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendsList}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip formatter={(value: any) => formatCurrency(Number(value))} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="orderCount" stroke="#06b6d4" strokeWidth={2} name="Orders" yAxisId={0} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">No trend data available</p>
          )}
        </CardContent>
      </Card>

      {/* Growth KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Order Value<InfoTip text="Average amount spent per order in the selected period" /></CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgAOV)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Repeat Purchase Rate<InfoTip text="Percentage of customers who placed more than one order" /></CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{repeatData?.rate ?? 0}%</span>
              <Badge variant="secondary">{repeatData?.repeatCustomers ?? 0} / {repeatData?.totalCustomers ?? 0}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue (Period)<InfoTip text="Sum of all order grand totals in the selected time period" /></CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert Section */}
      {!isLoadingLowStock && lowStockItems.length > 0 && (
        <LowStockAlert items={lowStockItems} threshold={5} />
      )}

      {/* Revenue Metrics */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <IndianRupee className="h-5 w-5" />
          Revenue & Sales
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {displayRevenueMetrics.map((metric: { icon: LucideIcon; title: string; value: string }, index: number) => (
            <DashboardCard key={index} Icon={metric.icon} title={metric.title} value={metric.value} />
          ))}
        </div>
      </section>

      {/* Order Metrics */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Box className="h-5 w-5" />
          Orders
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {displayOrderMetrics.map((metric: { icon: LucideIcon; title: string; value: string }, index: number) => (
            <DashboardCard key={index} Icon={metric.icon} title={metric.title} value={metric.value} />
          ))}
        </div>
      </section>

      {/* Product Metrics */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Products & Inventory
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {displayProductMetrics.map((metric: { icon: LucideIcon; title: string; value: string }, index: number) => (
            <DashboardCard key={index} Icon={metric.icon} title={metric.title} value={metric.value} />
          ))}
        </div>
      </section>

      {/* Customer & Catalog Metrics */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Customers & Catalog
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {displayCustomerMetrics.map((metric: { icon: LucideIcon; title: string; value: string }, index: number) => (
            <DashboardCard key={index} Icon={metric.icon} title={metric.title} value={metric.value} />
          ))}
        </div>
      </section>

      {/* Metal Prices Section */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gem className="h-5 w-5" />
              Current Metal Prices
            </CardTitle>
            <CardDescription>
              Live metal rates - Last updated: {metalPrices[0]?.lastUpdated
                ? new Date(metalPrices[0].lastUpdated).toLocaleString('en-IN')
                : 'Not available'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {metalPrices.map((metal: any) => {
                const change24h = metal.change24h || 0;
                return (
                  <div key={metal._id} className="text-center p-4 border rounded-lg bg-gradient-to-br from-white to-gray-50">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      {metal.displayName || metal.metalType}
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(metal.pricePerGram)}
                    </div>
                    <div className={`text-xs flex items-center justify-center gap-1 mt-1 ${getPriceChangeColor(change24h)}`}>
                      {change24h > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : change24h < 0 ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : null}
                      {change24h > 0 ? '+' : ''}{change24h.toFixed(2)}%
                    </div>
                    <Badge
                      variant={metal.source === 'API' ? 'default' : 'secondary'}
                      className="mt-2 text-xs"
                    >
                      {metal.source}
                    </Badge>
                  </div>
                );
              })}
            </div>
            {metalPrices.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No metal price data available
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default DashboardHome;
