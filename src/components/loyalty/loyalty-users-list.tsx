import { useState } from "react";
import { useGetAllUsersLoyalty } from "@/lib/react-query/loyalty-query";
import LoadingScreen from "../common/loading-screen";
import DataTable from "../table/data-table-server";
import { Input } from "../ui/input";
import { LoyaltyUserColumns, LoyaltyUser } from "./loyalty-columns";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Users, Trophy, Coins, TrendingUp } from "lucide-react";

type TableFilter = {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: string;
};

const LoyaltyUsersList = () => {
  const [search, setSearch] = useState<string>("");
  const [filter, setFilter] = useState<TableFilter>({
    page: 1,
    limit: 10,
    sortBy: "totalPoints",
    sortOrder: "desc",
  });

  const changePage = ({ pageIndex }: { pageIndex: number }) => {
    setFilter((prev) => ({ ...prev, page: pageIndex + 1 }));
  };

  const { isLoading, data, isSuccess } = useGetAllUsersLoyalty(filter);

  const loyaltyData: LoyaltyUser[] = data?.data?.data?.loyaltyData || [];
  const overallStats = data?.data?.data?.overallStats || {};
  const pagination = data?.data?.data?.pagination || { totalPages: 1 };

  // Filter by search (client-side for now)
  const filteredData = loyaltyData.filter((item) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      item.user?.name?.toLowerCase().includes(searchLower) ||
      item.user?.email?.toLowerCase().includes(searchLower) ||
      item.user?.phoneNumber?.includes(search)
    );
  });

  return (
    <section className="">
      <h2 className="mb-4 text-3xl tracking-wide">Loyalty Management</h2>

      {/* Stats Cards */}
      {isSuccess && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overallStats.totalUsers?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Loyalty program members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points Issued</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {overallStats.totalPointsIssued?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Total points given to customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points Redeemed</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {overallStats.totalPointsRedeemed?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Points used by customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lifetime Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{overallStats.totalLifetimeSpent?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                From loyalty members
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Table */}
      <div className="mt-4 rounded-lg border bg-white px-4 py-6">
        <header className="mb-5 ml-2 flex items-center">
          <span className="mr-3 h-8 w-5 rounded-md bg-violet-300"></span>
          <Input
            value={search}
            placeholder="Search by name, email or phone..."
            onChange={(e) => setSearch(e.target.value)}
            className="w-96 placeholder:text-base"
          />
        </header>

        {isSuccess && (
          <DataTable
            columns={LoyaltyUserColumns}
            data={filteredData}
            page={filter.page - 1}
            totalPage={pagination.totalPages}
            changePage={changePage}
          />
        )}

        {isLoading && <LoadingScreen />}

        {isSuccess && filteredData.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No loyalty members found</p>
            <p className="text-sm">
              Members will appear here once they make purchases
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default LoyaltyUsersList;
