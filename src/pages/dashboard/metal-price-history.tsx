import { useState } from "react";
import { useGetAllMetalPriceHistory } from "@/lib/react-query/metal-price-history-query";
import { PriceHistory } from "@/lib/axios/metal-price-API";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, History } from "lucide-react";

const METAL_TYPE_OPTIONS = [
  { value: "ALL", label: "All Metals" },
  { value: "GOLD_24K", label: "Gold 24K" },
  { value: "GOLD_22K", label: "Gold 22K" },
  { value: "SILVER_999", label: "Silver 999" },
  { value: "SILVER_925", label: "Silver 925" },
  { value: "PLATINUM", label: "Platinum" },
];

const SKELETON_ROW_COUNT = 8;

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 7 }).map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 bg-muted animate-pulse rounded w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
}

function ChangePercentBadge({ value }: { value: number | undefined }) {
  if (value === undefined || value === null) {
    return <span className="text-muted-foreground">—</span>;
  }
  const formatted = `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  return (
    <Badge
      variant="outline"
      className={
        value > 0
          ? "border-green-500 text-green-600 bg-green-50"
          : value < 0
          ? "border-red-500 text-red-600 bg-red-50"
          : "border-gray-400 text-gray-600"
      }
    >
      {formatted}
    </Badge>
  );
}

export default function MetalPriceHistoryPage() {
  const [metalTypeFilter, setMetalTypeFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const queryParams = {
    metalTypes: metalTypeFilter !== "ALL" ? metalTypeFilter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  };

  const { data: historyData, isLoading } = useGetAllMetalPriceHistory(queryParams);

  // API returns: { status, data: { history: [...], total, limit, offset } }
  const rawRows: PriceHistory[] =
    Array.isArray(historyData?.data?.history)
      ? historyData.data.history
      : Array.isArray(historyData?.data)
      ? historyData.data
      : Array.isArray(historyData)
      ? historyData
      : [];

  const rows: PriceHistory[] = [...rawRows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleDownloadCSV = () => {
    const header = [
      "Date",
      "Metal Type",
      "Old Price",
      "New Price",
      "Change %",
      "Source",
      "Updated By",
    ];
    const csvRows = rows.map((r) => [
      new Date(r.createdAt).toLocaleString("en-IN"),
      r.metalType,
      r.oldPricePerGram,
      r.newPricePerGram,
      r.changePercent?.toFixed(2),
      r.source,
      r.updatedBy,
    ]);
    const csvContent = [header, ...csvRows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metal-price-history-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="h-7 w-7 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold">Metal Price History</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Full log of all metal price changes
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleDownloadCSV}
          disabled={isLoading || rows.length === 0}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            {/* Metal Type Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">Metal Type</label>
              <Select value={metalTypeFilter} onValueChange={setMetalTypeFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Select metal" />
                </SelectTrigger>
                <SelectContent>
                  {METAL_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">Start Date</label>
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* End Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">End Date</label>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Clear filters */}
            {(metalTypeFilter !== "ALL" || startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMetalTypeFilter("ALL");
                  setStartDate("");
                  setEndDate("");
                }}
                className="self-end"
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Price Change Log</CardTitle>
          <CardDescription>
            {isLoading ? "Loading..." : `${rows.length} record${rows.length !== 1 ? "s" : ""} found`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date / Time</TableHead>
                <TableHead>Metal Type</TableHead>
                <TableHead className="text-right">Old Price (₹/g)</TableHead>
                <TableHead className="text-right">New Price (₹/g)</TableHead>
                <TableHead className="text-center">Change %</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Updated By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    No price history records found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row._id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{row.metalType}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ₹{row.oldPricePerGram?.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium">
                      ₹{row.newPricePerGram?.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-center">
                      <ChangePercentBadge value={row.changePercent} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.source || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.updatedBy || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
