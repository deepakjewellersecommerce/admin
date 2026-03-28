import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { orderAPI } from "@/lib/axios/order-API";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileText,
  TrendingUp,
  Receipt,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ── Helpers ────────────────────────────────────────────────────────────────────

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n ?? 0);

const fmtNum = (n: number) =>
  new Intl.NumberFormat("en-IN").format(n ?? 0);

function SummaryCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card className={accent ? "border-violet-200 bg-violet-50/60" : ""}>
      <CardContent className="pt-5 pb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">
          {label}
        </p>
        <p className={`text-2xl font-bold tabular-nums ${accent ? "text-violet-700" : ""}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── CSV Export ─────────────────────────────────────────────────────────────────

function exportCsv(orders: any[], period: { year: number; month: number | null }) {
  const periodLabel = period.month
    ? `${MONTHS[period.month - 1]}_${period.year}`
    : `FY_${period.year}`;

  const headers = [
    "Order No", "Date", "Customer Name", "Phone", "Email",
    "Payment Mode", "Taxable Value (₹)", "GST (₹)", "Discount (₹)",
    "Shipping (₹)", "Grand Total (₹)", "PAN Verified",
  ];

  const rows = orders.map((o) => [
    o.orderNumber ?? "",
    new Date(o.createdAt).toLocaleDateString("en-IN"),
    o.shippingAddress?.name ?? "",
    o.shippingAddress?.phone ?? "",
    o.buyerInfo?.email ?? "",
    o.payment_mode ?? "",
    o.subtotal ?? 0,
    o.taxAmount ?? 0,
    o.discountAmount ?? 0,
    o.shippingAmount ?? 0,
    o.grandTotal ?? 0,
    o.buyerInfo?.pan?.verified ? "Yes" : "No",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `GST_Report_${periodLabel}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function GstReportPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-based

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState<number | "">(currentMonth);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const isFullYear = month === "";

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["gst-report", year, month],
    queryFn: async () => {
      const res = await orderAPI.getGstReport(year, month !== "" ? month : undefined);
      return (res as any).data?.data ?? (res as any).data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!year,
  });

  const summary = data?.summary;
  const monthly: any[] = data?.monthly ?? [];
  const orders: any[] = data?.orders ?? [];

  // Build chart data — fill in months with 0 if no orders
  const chartData = useMemo(() => {
    if (isFullYear) {
      return Array.from({ length: 12 }, (_, i) => {
        const m = monthly.find((r) => r._id.month === i + 1);
        return {
          month: MONTHS[i].slice(0, 3),
          taxable: m?.taxableValue ?? 0,
          gst: m?.totalTax ?? 0,
          orders: m?.orderCount ?? 0,
        };
      });
    }
    return [];
  }, [monthly, isFullYear]);

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const periodLabel = isFullYear
    ? `FY ${year}`
    : `${MONTHS[(month as number) - 1]} ${year}`;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">GST Report</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monthly tax summary for GSTR-1 &amp; GSTR-3B filing
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Year selector */}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border rounded-md px-3 py-2 text-sm bg-white"
          >
            {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Month selector */}
          <select
            value={month}
            onChange={(e) =>
              setMonth(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="border rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="">Full Year</option>
            {MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>

          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <FileText size={14} className="mr-1.5" />
            Refresh
          </Button>

          {orders.length > 0 && (
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white"
              onClick={() =>
                exportCsv(orders, { year, month: month !== "" ? month : null })
              }
            >
              <Download size={14} className="mr-1.5" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* ── GSTR Filing Reminder ── */}
      {month !== "" && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-medium text-amber-800">Filing Reminders for {MONTHS[(month as number) - 1]}:</span>
            <span className="text-amber-700 ml-1">
              GSTR-1 due by <strong>11th {MONTHS[month % 12]}</strong> &nbsp;|&nbsp;
              GSTR-3B + payment due by <strong>20th {MONTHS[month % 12]}</strong>
            </span>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-16 text-muted-foreground">
          Loading report...
        </div>
      )}

      {isError && (
        <div className="text-center py-16 text-red-500">
          Failed to load report. Please try again.
        </div>
      )}

      {data && !isLoading && (
        <>
          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard
              label="Total Orders"
              value={fmtNum(summary?.orderCount ?? 0)}
              sub={periodLabel}
            />
            <SummaryCard
              label="Taxable Value"
              value={fmt(summary?.taxableValue ?? 0)}
              sub="Before GST"
            />
            <SummaryCard
              label="GST Collected"
              value={fmt(summary?.totalTax ?? 0)}
              sub="To be remitted"
              accent
            />
            <SummaryCard
              label="Grand Total"
              value={fmt(summary?.grandTotal ?? 0)}
              sub={`${summary?.highValueOrders ?? 0} high-value (>₹2L)`}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard
              label="Total Discounts"
              value={fmt(summary?.totalDiscount ?? 0)}
            />
            <SummaryCard
              label="Shipping Collected"
              value={fmt(summary?.totalShipping ?? 0)}
            />
            <SummaryCard
              label="Effective GST Rate"
              value={
                summary?.taxableValue
                  ? `${((summary.totalTax / summary.taxableValue) * 100).toFixed(1)}%`
                  : "—"
              }
              sub="Avg across orders"
            />
            <SummaryCard
              label="Avg Order Value"
              value={
                summary?.orderCount
                  ? fmt(summary.grandTotal / summary.orderCount)
                  : "—"
              }
            />
          </div>

          {/* ── Monthly Bar Chart (full year only) ── */}
          {isFullYear && chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp size={16} className="text-violet-500" />
                  Monthly GST vs Taxable Value — {year}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      formatter={(v: number, name: string) => [fmt(v), name]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="taxable" name="Taxable Value" fill="#a78bfa" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="gst" name="GST Collected" fill="#7c3aed" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* ── Monthly Breakdown Table (full year) ── */}
          {isFullYear && monthly.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Month-wise Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
                      <th className="text-left px-4 py-3">Month</th>
                      <th className="text-right px-4 py-3">Orders</th>
                      <th className="text-right px-4 py-3">Taxable Value</th>
                      <th className="text-right px-4 py-3">GST</th>
                      <th className="text-right px-4 py-3">Discount</th>
                      <th className="text-right px-4 py-3">Grand Total</th>
                      <th className="text-right px-4 py-3">COD / Online</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthly.map((row) => (
                      <tr key={row._id.month} className="border-b hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium">
                          {MONTHS[row._id.month - 1]} {row._id.year}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.orderCount}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmt(row.taxableValue)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-violet-700 font-medium">
                          {fmt(row.totalTax)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-emerald-600">
                          -{fmt(row.totalDiscount)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold">
                          {fmt(row.grandTotal)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {row.codOrders} / {row.onlineOrders}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* ── Order Detail Table ── */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt size={16} className="text-violet-500" />
                Order-wise Detail
                <Badge variant="outline" className="ml-1 text-xs font-normal">
                  {orders.length} orders
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                For GSTR-1 B2C/B2B annexure
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {orders.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground text-sm">
                  No completed orders in this period.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
                        <th className="text-left px-4 py-3 w-6"></th>
                        <th className="text-left px-4 py-3">Order No</th>
                        <th className="text-left px-4 py-3">Date</th>
                        <th className="text-left px-4 py-3">Customer</th>
                        <th className="text-center px-4 py-3">Mode</th>
                        <th className="text-right px-4 py-3">Taxable</th>
                        <th className="text-right px-4 py-3">GST</th>
                        <th className="text-right px-4 py-3">Total</th>
                        <th className="text-center px-4 py-3">PAN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const id = order._id ?? order.orderNumber;
                        const expanded = expandedRows.has(id);
                        return (
                          <>
                            <tr
                              key={id}
                              className="border-b hover:bg-muted/20 cursor-pointer"
                              onClick={() => toggleRow(id)}
                            >
                              <td className="px-4 py-3 text-muted-foreground">
                                {expanded ? (
                                  <ChevronDown size={14} />
                                ) : (
                                  <ChevronRight size={14} />
                                )}
                              </td>
                              <td className="px-4 py-3 font-mono text-xs font-medium">
                                {order.orderNumber ?? "—"}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                {new Date(order.createdAt).toLocaleDateString("en-IN")}
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium">
                                  {order.shippingAddress?.name ?? "—"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {order.shippingAddress?.phone ?? ""}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Badge
                                  variant="outline"
                                  className={
                                    order.payment_mode === "COD"
                                      ? "text-amber-700 border-amber-200 bg-amber-50 text-[11px]"
                                      : "text-blue-700 border-blue-200 bg-blue-50 text-[11px]"
                                  }
                                >
                                  {order.payment_mode}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums">
                                {fmt(order.subtotal ?? 0)}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-violet-700 font-medium">
                                {fmt(order.taxAmount ?? 0)}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums font-semibold">
                                {fmt(order.grandTotal ?? 0)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {order.buyerInfo?.pan?.verified ? (
                                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-normal shadow-none">
                                    Verified
                                  </Badge>
                                ) : order.grandTotal >= 200000 ? (
                                  <Badge className="bg-red-50 text-red-600 border-red-200 text-[11px] font-normal shadow-none">
                                    Missing
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </td>
                            </tr>

                            {/* Expanded: email + masked PAN */}
                            {expanded && (
                              <tr key={`${id}-detail`} className="border-b bg-muted/10">
                                <td></td>
                                <td colSpan={8} className="px-4 py-2">
                                  <div className="flex gap-6 text-xs text-muted-foreground">
                                    {order.buyerInfo?.email && (
                                      <span>Email: <span className="text-foreground">{order.buyerInfo.email}</span></span>
                                    )}
                                    {order.buyerInfo?.pan?.number && (
                                      <span>
                                        PAN:{" "}
                                        <span className="font-mono text-foreground">
                                          {order.buyerInfo.pan.number}
                                        </span>
                                      </span>
                                    )}
                                    <span>Discount: <span className="text-foreground">{fmt(order.discountAmount ?? 0)}</span></span>
                                    <span>Shipping: <span className="text-foreground">{fmt(order.shippingAmount ?? 0)}</span></span>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>

                    {/* Totals footer */}
                    <tfoot>
                      <tr className="border-t-2 bg-muted/30 font-semibold">
                        <td></td>
                        <td colSpan={4} className="px-4 py-3 text-muted-foreground text-xs uppercase tracking-wide">
                          Total ({orders.length} orders)
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {fmt(summary?.taxableValue ?? 0)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-violet-700">
                          {fmt(summary?.totalTax ?? 0)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {fmt(summary?.grandTotal ?? 0)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── TCS Note ── */}
          {(summary?.highValueOrders ?? 0) > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
              <AlertCircle size={16} className="text-blue-600 mt-0.5 shrink-0" />
              <div className="text-blue-800">
                <span className="font-medium">TCS Reminder (Sec 206C): </span>
                {summary.highValueOrders} order{summary.highValueOrders > 1 ? "s" : ""} above ₹2,00,000 in this period.
                Ensure PAN is collected and TCS (if applicable) is deposited by the <strong>7th of next month</strong>.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
