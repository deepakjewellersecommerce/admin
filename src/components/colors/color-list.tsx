import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import LoadingScreen from "../common/loading-screen";
import DataTable from "../table/data-table-server";
import { Input } from "../ui/input";
import { ProductColor } from "./color";
import { useGetColor } from "@/lib/react-query/color-query";
import { ProductColorColumns } from "./columns";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Plus, Search } from "lucide-react";

type TableFilter = {
  date: string;
  pageIndex: number;
  pageSize: number;
  search: string;
};

const ColorList = () => {
  const [search, setSearch] = useState<string>("");
  const searchInput = useRef<HTMLInputElement>();
  const [filter, setFilter] = useState<TableFilter>({
    pageIndex: 0,
    pageSize: 10,
    date: "",
    search: "",
  });

  const changePage = ({ pageIndex }: { pageIndex: number }) => {
    setFilter((prev) => ({ ...prev, pageIndex: pageIndex }));
  };

  const { isLoading, data, isSuccess } = useGetColor();

  const colors: ProductColor[] = useMemo(() => {
    if (isSuccess) {
      return Array.from(data.data.data.colors).filter((color: any) =>
        color.color_name.toLowerCase().includes(search.toLowerCase())
      ) as ProductColor[];
    }
    return [];
  }, [isSuccess, data, search]);

  useEffect(() => {
    if (searchInput.current) searchInput.current.focus();
  });
  useEffect(() => {
    setFilter({ search, pageIndex: 0, pageSize: 10, date: "" });
  }, [search]);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Colors</h2>
          <p className="text-sm text-gray-500">
            Manage colors for product variants
          </p>
        </div>
        <Link to="/dashboard/colors/add">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Color
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">All Colors</CardTitle>
              {isSuccess && (
                <Badge variant="secondary">{colors.length} total</Badge>
              )}
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                placeholder="Search colors..."
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isSuccess && (
            <DataTable
              columns={ProductColorColumns}
              data={colors}
              page={filter.pageIndex}
              totalPage={Math.ceil(data.data.data?.total / data.data.data?.limit)}
              changePage={changePage}
            />
          )}
          {isLoading && <LoadingScreen />}
        </CardContent>
      </Card>
    </section>
  );
};

export default ColorList;
