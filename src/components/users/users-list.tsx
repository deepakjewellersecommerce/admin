import { useEffect, useMemo, useRef, useState } from "react";
import LoadingScreen from "../common/loading-screen";
import DataTable from "../table/data-table-server";
import { Input } from "../ui/input";
import IUsers from "./user";
import { UserColumns } from "./columns";
import { useGetAllUsers } from "@/lib/react-query/user-query";
import { useTopUsers, useTopLocations, useRepeatPurchaseRate } from "@/lib/react-query/dashboard-analytics-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Users, MapPin, Trophy } from "lucide-react";
import { InfoTip } from "@/lib/analytics-utils";
import CustomSelect from "../ui/custom-select";

type TableFilter = {
  pageIndex: number;
  pageSize: number;
  search: string;
  accountStatus: string;
  hasOrders: string;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

function GeoTooltip({ active, payload, totalRevenue }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const avg = d.orderCount > 0 ? d.revenue / d.orderCount : 0;
  const share = totalRevenue > 0 ? ((d.revenue / totalRevenue) * 100).toFixed(1) : "0";

  return (
    <div className="rounded-lg border bg-white shadow-lg p-3 text-xs min-w-[180px]">
      <p className="font-semibold text-sm mb-2 text-foreground">
        {d.city}{d.state && d.state !== d.city ? `, ${d.state}` : ""}
      </p>
      <div className="space-y-1.5">
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Revenue</span>
          <span className="font-medium text-violet-700">{formatCurrency(d.revenue)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Orders</span>
          <span className="font-medium">{d.orderCount}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Customers</span>
          <span className="font-medium">{d.customers ?? "—"}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Avg Order Value</span>
          <span className="font-medium">{formatCurrency(Math.round(avg))}</span>
        </div>
        <div className="border-t pt-1.5 flex justify-between gap-6">
          <span className="text-muted-foreground">% of Revenue</span>
          <span className="font-semibold text-violet-600">{share}%</span>
        </div>
      </div>
    </div>
  );
}

const UsersList = () => {
  const searchInput = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<TableFilter>({
    pageIndex: 0,
    pageSize: 10,
    search: "",
    accountStatus: "all",
    hasOrders: "all",
  });

  const changePage = ({ pageIndex }: { pageIndex: number }) => {
    setFilter((prev) => ({ ...prev, pageIndex: pageIndex }));
  };

  const { isLoading, data, isSuccess } = useGetAllUsers(filter);
  const { data: topUsersRaw } = useTopUsers();
  const { data: topLocationsRaw } = useTopLocations();
  const { data: repeatRaw } = useRepeatPurchaseRate();

  const topUsersData = Array.isArray(topUsersRaw?.data ?? topUsersRaw) ? (topUsersRaw?.data ?? topUsersRaw) : [];
  const topLocationsData = Array.isArray(topLocationsRaw?.data ?? topLocationsRaw) ? (topLocationsRaw?.data ?? topLocationsRaw) : [];
  const repeatData = repeatRaw?.data ?? repeatRaw;

  const topUsers = useMemo(() => (topUsersData || []).slice(0, 5), [topUsersData]);
  const topLocations = useMemo(() => (topLocationsData || []).slice(0, 5), [topLocationsData]);
  const totalRevenue = useMemo(() => topLocations.reduce((sum: number, l: any) => sum + (l.revenue ?? 0), 0), [topLocations]);
  const topCity = useMemo(() => topLocations[0]?.city || "N/A", [topLocations]);

  const users: IUsers[] = isSuccess ? Array.from(data?.data?.data?.users ?? []) : [];

  useEffect(() => {
    if (searchInput.current) searchInput.current.focus();
  }, []);

  const totalPage = Math.max(
    1,
    Math.ceil((data?.data?.data?.total ?? 0) / (data?.data?.data?.limit ?? filter.pageSize))
  );

  return (
    <section className="">
      <h2 className="mb-2 text-3xl tracking-wide">Users List</h2>

      {/* Customer Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Users className="h-4 w-4" /> Total Users<InfoTip text="Total registered users on the platform" /></CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.data?.data?.total ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Users className="h-4 w-4" /> Repeat Customers<InfoTip text="Customers who placed more than one order" /></CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{repeatData?.repeatCustomers ?? 0}</span>
              <Badge variant="secondary">{repeatData?.rate ?? 0}%</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><MapPin className="h-4 w-4" /> Top City<InfoTip text="City with the highest revenue from orders" /></CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topCity}</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Users + Geographic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5" />
              Top Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Spent</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsers.map((u: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(u.totalSpent)}</TableCell>
                    <TableCell className="text-right">{u.orderCount}</TableCell>
                  </TableRow>
                ))}
                {topUsers.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" />
              Geographic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topLocations.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topLocations} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="city" type="category" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip content={<GeoTooltip totalRevenue={totalRevenue} />} />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                    {topLocations.map((_: any, i: number) => (
                      <Cell key={i} fill={i === 0 ? "#7c3aed" : `hsl(263, ${70 - i * 10}%, ${55 + i * 5}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No location data</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 rounded-lg border bg-white px-4 py-6">
        <header className="mb-5 ml-2 flex flex-wrap items-center gap-4">
          <span className="mr-3 h-8 w-5 rounded-md bg-violet-300"></span>
          <Input
            ref={searchInput}
            value={filter.search}
            placeholder="Search Users here"
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, search: e.target.value, pageIndex: 0 }))
            }
            className="w-96 placeholder:text-base"
          />
          <CustomSelect
            options={[
              { label: "All Statuses", value: "all" },
              { label: "Active", value: "active" },
              { label: "Blocked", value: "blocked" },
            ]}
            placeholder="Account Status"
            value={filter.accountStatus}
            onValueChange={(value) =>
              setFilter((prev) => ({ ...prev, accountStatus: value, pageIndex: 0 }))
            }
            className="w-44"
          />
          <CustomSelect
            options={[
              { label: "All Users", value: "all" },
              { label: "Has Orders", value: "yes" },
              { label: "Registered Only", value: "no" },
            ]}
            placeholder="Has Orders"
            value={filter.hasOrders}
            onValueChange={(value) =>
              setFilter((prev) => ({ ...prev, hasOrders: value, pageIndex: 0 }))
            }
            className="w-44"
          />
        </header>
        {isSuccess && (
          <DataTable
            columns={UserColumns}
            data={users}
            page={filter.pageIndex}
            totalPage={totalPage}
            changePage={changePage}
          />
        )}
        {isLoading && <LoadingScreen />}
      </div>
    </section>
  );
};

export default UsersList;
