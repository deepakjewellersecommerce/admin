import DashboardCard from "@/components/dashboard/card";
import LowStockAlert from "@/components/products/low-stock-alert";
import { useDashboardData } from "@/lib/react-query/auth-query";
import { useGetLowStockProducts } from "@/lib/react-query/product-query";
import { useGetAllMetalPrices } from "@/lib/react-query/metal-price-query";
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
} from "lucide-react"; // Import icons
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Removed unused Button and Card imports if they are truly unused, but let's check

const DashboardHome = () => {
  // Define default metrics with useMemo to avoid recreation on each render
  const defaultOrderMetrics = useMemo(() => [
    { title: "Total Orders", value: "0", icon: Box },
    { title: "Complete Orders", value: "0", icon: Check },
    { title: "Pending Orders", value: "0", icon: TimerIcon },
    { title: "Canceled Orders", value: "0", icon: X },
  ], []);

  const defaultRevenueMetrics = useMemo(() => [
    { title: "Today's Revenue", value: "₹0", icon: IndianRupee },
    { title: "This Month", value: "₹0", icon: Calendar },
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
    { title: "New This Month", value: "0", icon: User },
    { title: "Total Categories", value: "0", icon: Package },
    { title: "Total Subcategories", value: "0", icon: Box },
  ], []);

  const { data } = useDashboardData();
  const { data: lowStockData, isLoading: isLoadingLowStock } = useGetLowStockProducts(5);
  const { data: metalPricesData } = useGetAllMetalPrices();

  const lowStockItems = useMemo(() => {
    return lowStockData?.data?.data?.items || [];
  }, [lowStockData]);

  const metalPrices = useMemo(() => {
    return metalPricesData?.data?.prices || metalPricesData?.prices || [];
  }, [metalPricesData]);

  // Extract metrics from API response
  const { orderMetrics, revenueMetrics, productMetrics, customerMetrics } = useMemo(() => {
    if (data?.data?.data) {
      return {
        orderMetrics: data.data.data.orderMetrics ?? [],
        revenueMetrics: data.data.data.revenueMetrics ?? [],
        productMetrics: data.data.data.productMetrics ?? [],
        customerMetrics: data.data.data.customerMetrics ?? [],
      };
    }
    return {
      orderMetrics: [],
      revenueMetrics: [],
      productMetrics: [],
      customerMetrics: [],
    };
  }, [data]);

  // Combine default metrics with API data
  const displayOrderMetrics = useMemo(() => {
    return defaultOrderMetrics.map((defaultMetric, index) => {
      const apiMetric = orderMetrics[index];
      return {
        ...defaultMetric,
        value: apiMetric?.value || defaultMetric.value
      };
    });
  }, [defaultOrderMetrics, orderMetrics]);

  const displayRevenueMetrics = useMemo(() => {
    return defaultRevenueMetrics.map((defaultMetric, index) => {
      const apiMetric = revenueMetrics[index];
      return {
        ...defaultMetric,
        value: apiMetric?.value || defaultMetric.value
      };
    });
  }, [defaultRevenueMetrics, revenueMetrics]);

  const displayProductMetrics = useMemo(() => {
    return defaultProductMetrics.map((defaultMetric, index) => {
      const apiMetric = productMetrics[index];
      return {
        ...defaultMetric,
        value: apiMetric?.value || defaultMetric.value
      };
    });
  }, [defaultProductMetrics, productMetrics]);

  const displayCustomerMetrics = useMemo(() => {
    return defaultCustomerMetrics.map((defaultMetric, index) => {
      const apiMetric = customerMetrics[index];
      return {
        ...defaultMetric,
        value: apiMetric?.value || defaultMetric.value
      };
    });
  }, [defaultCustomerMetrics, customerMetrics]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get metal price change color
  const getPriceChangeColor = (change24h: number) => {
    if (change24h > 0) return "text-red-600";
    if (change24h < 0) return "text-green-600";
    return "text-gray-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard Home</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
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
          {displayRevenueMetrics.map(
            (
              metric: { icon: LucideIcon; title: string; value: string },
              index: number
            ) => (
              <DashboardCard
                key={index}
                Icon={metric.icon}
                title={metric.title}
                value={metric.value}
              />
            )
          )}
        </div>
      </section>

      {/* Order Metrics */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Box className="h-5 w-5" />
          Orders
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {displayOrderMetrics.map(
            (
              metric: { icon: LucideIcon; title: string; value: string },
              index: number
            ) => (
              <DashboardCard
                key={index}
                Icon={metric.icon}
                title={metric.title}
                value={metric.value}
              />
            )
          )}
        </div>
      </section>

      {/* Product Metrics */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Products & Inventory
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {displayProductMetrics.map(
            (
              metric: { icon: LucideIcon; title: string; value: string },
              index: number
            ) => (
              <DashboardCard
                key={index}
                Icon={metric.icon}
                title={metric.title}
                value={metric.value}
              />
            )
          )}
        </div>
      </section>

      {/* Customer & Catalog Metrics */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Customers & Catalog
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {displayCustomerMetrics.map(
            (
              metric: { icon: LucideIcon; title: string; value: string },
              index: number
            ) => (
              <DashboardCard
                key={index}
                Icon={metric.icon}
                title={metric.title}
                value={metric.value}
              />
            )
          )}
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
