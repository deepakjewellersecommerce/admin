import { useState, useMemo } from "react";
import dayjs from "dayjs";
import {
  useCustomerCohorts,
  useRepeatPurchaseRate,
  useTopUsers,
} from "@/lib/react-query/dashboard-analytics-query";
import { formatCurrency, MetricSkeleton } from "@/lib/analytics-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";
import { UsersRound, RefreshCw } from "lucide-react";

const AnalyticsCustomers = () => {
  const initialEnd = dayjs().endOf("day");
  const initialStart = dayjs().subtract(29, "day").startOf("day");
  const [dateRange, setDateRange] = useState({
    startDate: initialStart.format("YYYY-MM-DD"),
    endDate: initialEnd.format("YYYY-MM-DD"),
  });

  const { data: repeatRaw, isLoading: isLoadingRepeat } = useRepeatPurchaseRate(dateRange);
  const { data: cohortRaw, isLoading: isLoadingCohort } = useCustomerCohorts();
  const { data: topUsersData, isLoading: isLoadingUsers } = useTopUsers(dateRange);

  // Hooks return { data: actualValue } — unwrap one extra level
  const repeatData = repeatRaw?.data ?? repeatRaw;
  const cohorts: any[] = Array.isArray(cohortRaw) ? cohortRaw : (cohortRaw?.data ?? []);
  const topUsers: any[] = Array.isArray(topUsersData) ? topUsersData : (topUsersData?.data ?? []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <UsersRound className="h-7 w-7" />
          Customer Analytics
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

      {/* Repeat Purchase Rate Card */}
      {isLoadingRepeat ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <MetricSkeleton key={i} />)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardDescription>Repeat Purchase Rate</CardDescription></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{repeatData?.rate ?? 0}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Repeat Customers</CardDescription></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{repeatData?.repeatCustomers ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardDescription>Total Customers</CardDescription></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{repeatData?.totalCustomers ?? 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cohort Retention Bar Chart */}
      {cohorts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cohort Retention</CardTitle>
            <CardDescription>Retention rate by monthly cohort</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cohorts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cohort" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <RechartsTooltip formatter={(value: any) => `${value}%`} />
                <Bar dataKey="retentionRate" fill="#7c3aed" name="Retention %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Customer Cohort Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Customer Cohort Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingCohort ? (
            <div className="flex items-center justify-center h-24"><RefreshCw className="h-6 w-6 animate-spin" /></div>
          ) : cohorts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No cohort data available yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cohort</TableHead>
                  <TableHead className="text-right">Customers</TableHead>
                  <TableHead className="text-right">Repeat</TableHead>
                  <TableHead className="text-right">Retention %</TableHead>
                  <TableHead className="text-right">Total Orders</TableHead>
                  <TableHead className="text-right">Avg Orders/User</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Avg LTV</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cohorts.map((c: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{c.cohort}</TableCell>
                    <TableCell className="text-right">{c.customers}</TableCell>
                    <TableCell className="text-right">{c.repeatCustomers}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={c.retentionRate >= 30 ? "default" : "secondary"}>{c.retentionRate}%</Badge>
                    </TableCell>
                    <TableCell className="text-right">{c.totalOrders}</TableCell>
                    <TableCell className="text-right">{c.avgOrdersPerCustomer}</TableCell>
                    <TableCell className="text-right">{formatCurrency(c.totalRevenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(c.avgLTV)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Top Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Customers</CardTitle>
          <CardDescription>Highest spending customers in the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex items-center justify-center h-24"><RefreshCw className="h-6 w-6 animate-spin" /></div>
          ) : topUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No customer data</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsers.map((u: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{i + 1}</TableCell>
                    <TableCell>{u.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="text-right">{formatCurrency(u.totalSpent)}</TableCell>
                    <TableCell className="text-right">{u.orderCount}</TableCell>
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

export default AnalyticsCustomers;
