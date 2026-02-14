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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, MapPin, Trophy } from "lucide-react";
import { InfoTip } from "@/lib/analytics-utils";

type TableFilter = {
  date: string;
  pageIndex: number;
  pageSize: number;
  search: string;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

const UsersList = () => {
  const [search, setSearch] = useState<string>("");
  const searchInput = useRef<HTMLInputElement>();
  const [users, setuserss] = useState<IUsers[]>([]);
  const [filter, setFilter] = useState<TableFilter>({
    pageIndex: 0,
    pageSize: 10,
    date: "",
    search: "",
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
  const topCity = useMemo(() => topLocations[0]?.city || "N/A", [topLocations]);

  useEffect(() => {
    if (isSuccess) {
      const userss: IUsers[] = Array.from(data.data.data.users);
      setuserss(userss);
    }
  }, [isSuccess, data]);

  useEffect(() => {
    if (searchInput.current) searchInput.current.focus();
  });
  useEffect(() => {
    setFilter({ search, pageIndex: 0, pageSize: 10, date: "" });
  }, [search]);

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
                  <XAxis type="number" />
                  <YAxis dataKey="city" type="category" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  <Bar dataKey="revenue" fill="#7c3aed" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No location data</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 rounded-lg border bg-white px-4 py-6">
        <header className="mb-5  ml-2 flex items-center">
          <span className="mr-3 h-8 w-5 rounded-md bg-violet-300"></span>
          <Input
            value={search}
            placeholder="Search Users here"
            onChange={(e) => setSearch(e.target.value)}
            className="w-96 placeholder:text-base"
          />
        </header>
        {isSuccess && (
          <DataTable
            columns={UserColumns}
            data={users}
            page={filter.pageIndex}
            totalPage={Math.ceil(data.data.data?.total / data.data.data?.limit)}
            changePage={changePage}
          />
        )}
        {isLoading && <LoadingScreen />}
      </div>
    </section>
  );
};

export default UsersList;
