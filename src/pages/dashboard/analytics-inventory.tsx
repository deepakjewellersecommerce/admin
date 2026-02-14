import { useState } from "react";
import dayjs from "dayjs";
import {
  useInventoryHealth,
  useStockTurnover,
  useInventoryValuationTrend,
} from "@/lib/react-query/dashboard-analytics-query";
import { formatCurrency, MetricSkeleton, InfoTip } from "@/lib/analytics-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";
import { PackageSearch, AlertTriangle, RefreshCw } from "lucide-react";

const AnalyticsInventory = () => {
  const { data: healthData, isLoading: isLoadingHealth } = useInventoryHealth();
  const { data: turnoverData, isLoading: isLoadingTurnover } = useStockTurnover();
  const { data: trendData, isLoading: isLoadingTrend } = useInventoryValuationTrend();

  const inventoryStats = healthData ?? { valuation: 0, totalStockCount: 0, stuckStock: { count: 0, items: [] } };
  const turnoverList: any[] = Array.isArray(turnoverData) ? turnoverData : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <PackageSearch className="h-7 w-7" />
          Stock & Inventory Analytics
        </h1>
      </div>

      {/* Summary Cards */}
      {isLoadingTrend ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <MetricSkeleton key={i} />)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardDescription>Total Valuation<InfoTip text="Sum of (stock quantity × cost price) for all active products" /></CardDescription></CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatCurrency(trendData?.totalValuation || 0)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Total Stock Units<InfoTip text="Total available inventory units across all products" /></CardDescription></CardHeader>
            <CardContent><div className="text-2xl font-bold">{(trendData?.totalStock || 0).toLocaleString("en-IN")}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Active Products<InfoTip text="Number of products currently in stock" /></CardDescription></CardHeader>
            <CardContent><div className="text-2xl font-bold">{trendData?.totalProducts || 0}</div></CardContent>
          </Card>
        </div>
      )}

      {/* Valuation by Category & Sales Velocity */}
      {trendData?.byCategory?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Valuation by Category</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trendData.byCategory.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  <Bar dataKey="totalValue" fill="#7c3aed" name="Value" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Sales Velocity (6 Months)</CardTitle></CardHeader>
            <CardContent>
              {trendData.salesVelocity?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData.salesVelocity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="unitsSold" stroke="#06b6d4" strokeWidth={2} name="Units Sold" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No sales data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stock Turnover Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stock Turnover by Category</CardTitle>
          <CardDescription>How quickly inventory moves through each category</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTurnover ? (
            <div className="flex items-center justify-center h-24"><RefreshCw className="h-6 w-6 animate-spin" /></div>
          ) : turnoverList.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No turnover data available</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Turnover Rate</TableHead>
                  <TableHead className="text-right">Avg Days to Sell</TableHead>
                  <TableHead className="text-right">Total Sold</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {turnoverList.map((item: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{item.category}</TableCell>
                    <TableCell className="text-right">{item.turnoverRate?.toFixed(2) ?? "—"}</TableCell>
                    <TableCell className="text-right">{item.avgDaysToSell ?? "—"}</TableCell>
                    <TableCell className="text-right">{item.totalSold ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Stuck Stock */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Stuck Stock (90+ Days)
            </CardTitle>
            <CardDescription>Items in stock that haven't sold in 3 months</CardDescription>
          </div>
          <Badge variant="destructive" className="text-sm">
            {inventoryStats.stuckStock?.count || 0} Items
          </Badge>
        </CardHeader>
        <CardContent>
          {isLoadingHealth ? (
            <div className="flex items-center justify-center h-24"><RefreshCw className="h-6 w-6 animate-spin" /></div>
          ) : !inventoryStats.stuckStock?.items?.length ? (
            <p className="text-center text-muted-foreground py-4">No stuck stock found. Great!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Available Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryStats.stuckStock.items.map((item: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.productTitle}</TableCell>
                    <TableCell className="font-mono text-sm">{item.skuNo}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right">{item.availableStock}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsInventory;
