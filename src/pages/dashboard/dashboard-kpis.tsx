import { 
  useDashboardKPIs, 
  usePendingOrdersDetails, 
  useStockOutOrdersDetails, 
  usePricingErrorsDetails,
  useRevenueByMetal,
  usePerformanceByItem,
  useDiscountEfficiency,
  useInventoryHealth,
  useOrderFunnel
} from "@/lib/react-query/dashboard-analytics-query";
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, PieLabelRenderProps,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList
} from "recharts";
import { useState } from "react";
import dayjs from "dayjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Package, TrendingUp, TrendingDown, RefreshCw, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Utility functions moved outside so all components can use them
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getVolatilityColor = (change: number) => {
  if (change > 2) return "text-red-600";
  if (change > 0) return "text-orange-600";
  if (change < -2) return "text-green-600";
  return "text-gray-600";
};

const getVolatilityIcon = (change: number) => {
  if (change > 0) return <TrendingUp className="h-4 w-4" />;
  if (change < 0) return <TrendingDown className="h-4 w-4" />;
  return null;
};

const DashboardKPIs = () => {
  const { data: kpiData, isLoading, refetch } = useDashboardKPIs();
  const kpis = kpiData?.data;

  // Analytics Hooks
  const initialEnd = dayjs().endOf('day');
  const initialStart = dayjs().subtract(29, 'day').startOf('day');
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: initialStart.format('YYYY-MM-DD'),
    endDate: initialEnd.format('YYYY-MM-DD'),
  });

  const { data: revenueData, isLoading: isLoadingRevenue, refetch: refetchRevenue } = useRevenueByMetal(dateRange);
  const { data: itemData, isLoading: isLoadingItem, refetch: refetchItem } = usePerformanceByItem(dateRange);
  const { data: discountData, isLoading: isLoadingDiscount, refetch: refetchDiscount } = useDiscountEfficiency(dateRange);
  const { data: inventoryData, isLoading: isLoadingInventory, refetch: refetchInventory } = useInventoryHealth();
  const { data: funnelData, isLoading: isLoadingFunnel, refetch: refetchFunnel } = useOrderFunnel(dateRange);

  const revenueByMetal: { metalType: string; revenue: number }[] = revenueData?.data?.data || [];
  const performanceByItem: { itemName: string; revenue: number; salesCount: number }[] = itemData?.data?.data || [];
  const discountStats = discountData?.data || {
    grossRevenue: 0,
    totalDiscount: 0,
    netRevenue: 0,
    withCoupon: 0,
    withoutCoupon: 0
  };
  const inventoryStats = inventoryData?.data || {
    valuation: 0,
    totalStockCount: 0,
    stuckStock: { count: 0, items: [] }
  };
  const orderFunnel: { status: string; count: number }[] = funnelData?.data?.data || [];
  const COLORS = ["#FFD700", "#C0C0C0", "#E5E4E2", "#B87333", "#A9A9A9"];

  const handleRefresh = () => {
    refetch();
    refetchRevenue();
    refetchItem();
    refetchDiscount();
    refetchInventory();
    refetchFunnel();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white border rounded-md px-3 py-1 text-sm shadow-sm">
            <span className="text-muted-foreground font-medium">Period:</span>
            <input
              type="date"
              value={dateRange.startDate}
              max={dateRange.endDate}
              onChange={e => setDateRange(r => ({ ...r, startDate: e.target.value }))}
              className="border-none focus:ring-0 p-0 text-sm"
            />
            <span className="text-muted-foreground mx-1">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              min={dateRange.startDate}
              max={dayjs().format('YYYY-MM-DD')}
              onChange={e => setDateRange(r => ({ ...r, endDate: e.target.value }))}
              className="border-none focus:ring-0 p-0 text-sm"
            />
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Critical Alerts Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Pending Orders Alert */}
        <Card className={kpis?.alerts?.pendingOrders?.total > 0 ? "border-red-200 bg-red-50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {kpis?.alerts?.pendingOrders?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {kpis?.alerts?.pendingOrders?.over24h || 0} over 24h old
            </p>
            {kpis?.alerts?.pendingOrders?.total > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </DialogTrigger>
                <PendingOrdersDialog />
              </Dialog>
            )}
          </CardContent>
        </Card>

        {/* Today's Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(kpis?.todayRevenue?.amount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {kpis?.todayRevenue?.orderCount || 0} orders
            </p>
          </CardContent>
        </Card>

        {/* Stock-Out Orders Alert */}
        <Card className={kpis?.alerts?.stockOutOrders > 0 ? "border-orange-200 bg-orange-50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock-Out Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {kpis?.alerts?.stockOutOrders || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Orders waiting for stock
            </p>
            {kpis?.alerts?.stockOutOrders > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </DialogTrigger>
                <StockOutOrdersDialog />
              </Dialog>
            )}
          </CardContent>
        </Card>

        {/* Pricing Errors Alert */}
        <Card className={kpis?.alerts?.pricingErrors > 0 ? "border-yellow-200 bg-yellow-50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pricing Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {kpis?.alerts?.pricingErrors || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Products with config issues
            </p>
            {kpis?.alerts?.pricingErrors > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </DialogTrigger>
                <PricingErrorsDialog />
              </Dialog>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue by Metal Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Revenue by Metal Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingRevenue ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin" />
              </div>
            ) : revenueByMetal.length === 0 ? (
              <div className="text-center text-muted-foreground py-24">No revenue data for selected period.</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueByMetal}
                    dataKey="revenue"
                    nameKey="metalType"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(props: PieLabelRenderProps) => `${props.name}: ${(props.percent ? props.percent * 100 : 0).toFixed(0)}%`}
                  >
                    {revenueByMetal.map((_, idx: number) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any, name?: any) => [formatCurrency(typeof value === 'number' ? value : 0), name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Performance by Item Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Performance by Item Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingItem ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin" />
              </div>
            ) : performanceByItem.length === 0 ? (
              <div className="text-center text-muted-foreground py-24">No item performance data for selected period.</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceByItem} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="itemName" 
                    type="category" 
                    width={100} 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: any) => [formatCurrency(typeof value === 'number' ? value : 0), "Revenue"]}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="#3b82f6" 
                    radius={[0, 4, 4, 0]} 
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Discount Efficiency Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Discount Summary</CardTitle>
            <CardDescription>Overall discount impact</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm font-medium text-muted-foreground">Gross Revenue</span>
              <span className="font-bold">{formatCurrency(discountStats.grossRevenue)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm font-medium text-red-600">Total Discounts</span>
              <span className="font-bold text-red-600">-{formatCurrency(discountStats.totalDiscount)}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-medium">Net Revenue</span>
              <span className="text-xl font-bold text-green-600">{formatCurrency(discountStats.netRevenue)}</span>
            </div>
            <div className="bg-muted p-3 rounded-lg mt-4">
              <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Efficiency</div>
              <div className="text-2xl font-bold">
                {discountStats.grossRevenue > 0 
                  ? ((discountStats.totalDiscount / discountStats.grossRevenue) * 100).toFixed(1) 
                  : 0}%
              </div>
              <div className="text-xs text-muted-foreground">discount of total gross</div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-primary flex items-center gap-2">
              <Package className="h-5 w-5" />
              Coupon Usage vs Full Price
            </CardTitle>
            <CardDescription>Distribution of orders by coupon application</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingDiscount ? (
              <div className="flex items-center justify-center h-48">
                <RefreshCw className="h-8 w-8 animate-spin" />
              </div>
            ) : (discountStats.withCoupon + discountStats.withoutCoupon) === 0 ? (
              <div className="text-center text-muted-foreground py-16">No order data for selected period.</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "With Coupon", value: discountStats.withCoupon },
                      { name: "Full Price", value: discountStats.withoutCoupon }
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#10b981" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inventory Health Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inventory Valuation</CardTitle>
            <CardDescription>Total value of items in stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {formatCurrency(inventoryStats.valuation)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {inventoryStats.totalStockCount} units available
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Stuck Stock (90+ Days)
              </CardTitle>
              <CardDescription>Items in stock that haven't sold in 3 months</CardDescription>
            </div>
            <Badge variant="destructive" className="text-sm">
              {inventoryStats.stuckStock.count} Items
            </Badge>
          </CardHeader>
          <CardContent>
            {isLoadingInventory ? (
              <div className="flex items-center justify-center h-24">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : inventoryStats.stuckStock.items.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No stuck stock found. Great!</p>
            ) : (
              <div className="space-y-3">
                {inventoryStats.stuckStock.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                    <div className="truncate pr-4">
                      <span className="font-medium">{item.productTitle}</span>
                      <div className="text-xs text-muted-foreground font-mono">{item.skuNo}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold">{item.availableStock} in stock</div>
                      <div className="text-xs text-muted-foreground">{item.category}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Status Funnel Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Order Status Funnel
          </CardTitle>
          <CardDescription>Visualizing the conversion path from Placed to Delivered</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingFunnel ? (
            <div className="flex items-center justify-center h-48">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : orderFunnel.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No order flow data found.</div>
          ) : (
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={orderFunnel}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={60}>
                    <LabelList dataKey="count" position="top" style={{ fill: '#4f46e5', fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-between px-10 text-xs text-muted-foreground mt-2 uppercase tracking-wider font-semibold">
                <span>Start</span>
                <span>-------- Flow --------</span>
                <span>End</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metal Rates Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Live Metal Rates
          </CardTitle>
          <CardDescription>
            Current rates with 24h change. Last updated: {kpis?.metalVolatility?.GOLD_24K?.lastUpdated ? formatDate(kpis.metalVolatility.GOLD_24K.lastUpdated) : 'Never'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(kpis?.metalVolatility || {}).map(([metalType, data]: [string, any]) => {
              const displayName = metalType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
              return (
                <div key={metalType} className="text-center p-4 border rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground">{displayName}</div>
                  <div className="text-2xl font-bold">{formatCurrency(data.current)}</div>
                  <div className={`text-sm flex items-center justify-center gap-1 ${getVolatilityColor(data.change24h)}`}>
                    {getVolatilityIcon(data.change24h)}
                    {data.change24h > 0 ? '+' : ''}{data.change24h}%
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Dialog Components
const PendingOrdersDialog = () => {
  const { data: ordersData } = usePendingOrdersDetails(24);

  return (
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Pending Orders (24h+)</DialogTitle>
        <DialogDescription>
          Orders that have been pending for more than 24 hours
        </DialogDescription>
      </DialogHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordersData?.data?.map((order: any) => (
            <TableRow key={order._id}>
              <TableCell className="font-mono">{order._id.slice(-8)}</TableCell>
              <TableCell>{order.buyer?.displayName || 'N/A'}</TableCell>
              <TableCell>{formatDate(order.createdAt)}</TableCell>
              <TableCell>
                <Badge variant="secondary">{order.order_status}</Badge>
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm">View Order</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DialogContent>
  );
};

const StockOutOrdersDialog = () => {
  const { data: stockOutData } = useStockOutOrdersDetails();

  return (
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Stock-Out Orders</DialogTitle>
        <DialogDescription>
          Orders waiting for products that are currently out of stock
        </DialogDescription>
      </DialogHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Variant</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Order Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stockOutData?.data?.map((item: any) => (
            <TableRow key={`${item.orderId}-${item.variantId}`}>
              <TableCell className="font-mono">{item.orderId.slice(-8)}</TableCell>
              <TableCell>{item.buyerName}</TableCell>
              <TableCell>{item.productName}</TableCell>
              <TableCell>{item.variantSize}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{formatDate(item.orderDate)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DialogContent>
  );
};

const PricingErrorsDialog = () => {
  const { data: errorsData } = usePricingErrorsDetails();

  return (
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Pricing Errors</DialogTitle>
        <DialogDescription>
          Products with pricing configuration issues that may prevent checkout
        </DialogDescription>
      </DialogHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Pricing Mode</TableHead>
            <TableHead>Metal Type</TableHead>
            <TableHead>Subcategory</TableHead>
            <TableHead>Issues</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {errorsData?.data?.map((error: any) => (
            <TableRow key={error._id}>
              <TableCell>{error.name}</TableCell>
              <TableCell>{error.pricingMode}</TableCell>
              <TableCell>{error.metalType || 'Missing'}</TableCell>
              <TableCell>{error.subcategoryName || 'N/A'}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {!error.metalType && <Badge variant="destructive">No Metal Type</Badge>}
                  {!error.grossWeight && <Badge variant="destructive">No Gross Weight</Badge>}
                  {!error.netWeight && <Badge variant="destructive">No Net Weight</Badge>}
                  {error.pricingMode === 'SUBCATEGORY_DYNAMIC' && !error.hasSubcategoryPricing && (
                    <Badge variant="destructive">No Subcategory Pricing</Badge>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DialogContent>
  );
};

export default DashboardKPIs;