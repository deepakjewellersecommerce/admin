import {
  useDashboardKPIs,
  usePendingOrdersDetails,
  useStockOutOrdersDetails,
  usePricingErrorsDetails,
} from "@/lib/react-query/dashboard-analytics-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Package, TrendingUp, RefreshCw, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, InfoTip } from "@/lib/analytics-utils";
import { useNavigate } from "react-router-dom";

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const DashboardKPIs = () => {
  const { data: kpiData, isLoading, refetch } = useDashboardKPIs();
  const kpis = kpiData?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading KPI data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">KPIs & Alerts</h1>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Critical Alerts Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Pending Orders Alert */}
        <Card className={kpis?.alerts?.pendingOrders?.total > 0 ? "border-red-200 bg-red-50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Pending<InfoTip text="Orders not yet processed. Includes count of orders older than 24 hours" /></CardTitle>
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
            <CardTitle className="text-sm font-medium">Today's Revenue<InfoTip text="Revenue from orders placed today (midnight to now)" /></CardTitle>
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
            <CardTitle className="text-sm font-medium">Stock-Out Orders<InfoTip text="Orders containing items that are currently out of stock" /></CardTitle>
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
            <CardTitle className="text-sm font-medium">Pricing Errors<InfoTip text="Products with missing or misconfigured pricing (e.g., no metal type, weight, or subcategory pricing)" /></CardTitle>
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

    </div>
  );
};

// Dialog Components
const PendingOrdersDialog = () => {
  const { data: ordersData } = usePendingOrdersDetails(24);
  const navigate = useNavigate();

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
              <TableCell>{order.buyer?.name || order.buyer?.displayName || 'N/A'}</TableCell>
              <TableCell>{formatDate(order.createdAt)}</TableCell>
              <TableCell>
                <Badge variant="secondary">{order.order_status}</Badge>
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/orders/${order._id}`)}>
                  View Order
                </Button>
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