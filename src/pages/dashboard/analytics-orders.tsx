import { useState, useMemo } from "react";
import dayjs from "dayjs";
import {
  useOrderFunnel,
  useRevenueTrends,
  useRevenueByMetal,
  useTopProducts,
  useTopCategories,
  useTopLocations,
} from "@/lib/react-query/dashboard-analytics-query";
import { formatCurrency, MetricSkeleton } from "@/lib/analytics-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend, LabelList, PieLabelRenderProps,
} from "recharts";
import { ShoppingCart, RefreshCw } from "lucide-react";

const COLORS = ["#7c3aed", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

const AnalyticsOrders = () => {
  const initialEnd = dayjs().endOf("day");
  const initialStart = dayjs().subtract(29, "day").startOf("day");
  const [dateRange, setDateRange] = useState({
    startDate: initialStart.format("YYYY-MM-DD"),
    endDate: initialEnd.format("YYYY-MM-DD"),
  });

  const { data: funnelRaw, isLoading: isLoadingFunnel } = useOrderFunnel(dateRange);
  const { data: trendsRaw, isLoading: isLoadingTrends } = useRevenueTrends({ ...dateRange, groupBy: "day" });
  const { data: metalRaw, isLoading: isLoadingMetal } = useRevenueByMetal(dateRange);
  const { data: productsRaw, isLoading: isLoadingProducts } = useTopProducts(dateRange);
  const { data: categoriesRaw, isLoading: isLoadingCategories } = useTopCategories(dateRange);
  const { data: locationsRaw, isLoading: isLoadingLocations } = useTopLocations(dateRange);

  const orderFunnel: any[] = Array.isArray(funnelRaw?.data) ? funnelRaw.data : (Array.isArray(funnelRaw) ? funnelRaw : []);
  const trendsList: any[] = Array.isArray(trendsRaw?.data) ? trendsRaw.data : (Array.isArray(trendsRaw) ? trendsRaw : []);
  const metalData: any[] = Array.isArray(metalRaw?.data) ? metalRaw.data : (Array.isArray(metalRaw) ? metalRaw : []);
  const topProducts: any[] = Array.isArray(productsRaw?.data) ? productsRaw.data : (Array.isArray(productsRaw) ? productsRaw : []);
  const topCategories: any[] = Array.isArray(categoriesRaw?.data) ? categoriesRaw.data : (Array.isArray(categoriesRaw) ? categoriesRaw : []);
  const topLocations: any[] = Array.isArray(locationsRaw?.data) ? locationsRaw.data : (Array.isArray(locationsRaw) ? locationsRaw : []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-7 w-7" />
          Orders & Revenue Analytics
        </h1>
        <div className="flex items-center gap-2 bg-white border rounded-md px-3 py-1 text-sm shadow-sm">
          <span className="text-muted-foreground font-medium">Period:</span>
          <input
            type="date"
            value={dateRange.startDate}
            max={dateRange.endDate}
            onChange={(e) => setDateRange((r) => ({ ...r, startDate: e.target.value }))}
            className="border-none focus:ring-0 p-0 text-sm"
          />
          <span className="text-muted-foreground mx-1">to</span>
          <input
            type="date"
            value={dateRange.endDate}
            min={dateRange.startDate}
            max={dayjs().format("YYYY-MM-DD")}
            onChange={(e) => setDateRange((r) => ({ ...r, endDate: e.target.value }))}
            className="border-none focus:ring-0 p-0 text-sm"
          />
        </div>
      </div>

      {/* Order Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Status Funnel</CardTitle>
          <CardDescription>Conversion path from Placed to Delivered</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingFunnel ? (
            <div className="flex items-center justify-center h-48"><RefreshCw className="h-8 w-8 animate-spin" /></div>
          ) : orderFunnel.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No order flow data found.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={orderFunnel} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                <YAxis hide />
                <RechartsTooltip cursor={{ fill: "#f3f4f6" }} />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={60}>
                  <LabelList dataKey="count" position="top" style={{ fill: "#4f46e5", fontWeight: "bold" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Revenue Trend + Revenue by Metal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTrends ? (
              <div className="flex items-center justify-center h-64"><RefreshCw className="h-8 w-8 animate-spin" /></div>
            ) : trendsList.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No trend data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendsList}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} name="Revenue" />
                  <Line type="monotone" dataKey="orderCount" stroke="#06b6d4" strokeWidth={2} name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue by Metal Type</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingMetal ? (
              <div className="flex items-center justify-center h-64"><RefreshCw className="h-8 w-8 animate-spin" /></div>
            ) : metalData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No revenue data for selected period.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={metalData}
                    dataKey="revenue"
                    nameKey="metalType"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(props: PieLabelRenderProps) => `${props.name}: ${(props.percent ? props.percent * 100 : 0).toFixed(0)}%`}
                  >
                    {metalData.map((_: any, idx: number) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: any, name?: any) => [formatCurrency(typeof value === "number" ? value : 0), name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Rankings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="products">
            <TabsList className="mb-4">
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="locations">Locations</TabsTrigger>
            </TabsList>

            <TabsContent value="products">
              {isLoadingProducts ? (
                <div className="flex items-center justify-center h-24"><RefreshCw className="h-6 w-6 animate-spin" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((p: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{i + 1}</TableCell>
                        <TableCell>{p.name}</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.revenue)}</TableCell>
                        <TableCell className="text-right">{p.orderCount}</TableCell>
                      </TableRow>
                    ))}
                    {topProducts.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="categories">
              {isLoadingCategories ? (
                <div className="flex items-center justify-center h-24"><RefreshCw className="h-6 w-6 animate-spin" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Products</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCategories.map((c: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{i + 1}</TableCell>
                        <TableCell>{c.name}</TableCell>
                        <TableCell className="text-right">{formatCurrency(c.revenue)}</TableCell>
                        <TableCell className="text-right">{c.productCount}</TableCell>
                      </TableRow>
                    ))}
                    {topCategories.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="locations">
              {isLoadingLocations ? (
                <div className="flex items-center justify-center h-24"><RefreshCw className="h-6 w-6 animate-spin" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topLocations.map((l: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{i + 1}</TableCell>
                        <TableCell>{l.city}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{l.state}</TableCell>
                        <TableCell className="text-right">{formatCurrency(l.revenue)}</TableCell>
                        <TableCell className="text-right">{l.orderCount}</TableCell>
                      </TableRow>
                    ))}
                    {topLocations.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsOrders;
