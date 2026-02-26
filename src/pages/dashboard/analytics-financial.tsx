import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";
import dayjs from "dayjs";
import {
  useFinancialSummary,
  useTaxSummary,
  useCouponAnalytics,
  useLoyaltyLiability,
  usePaymentReconciliation,
  useExportFinancialData,
} from "@/lib/react-query/dashboard-analytics-query";
import { formatCurrency, ChangeIndicator, MetricSkeleton, InfoTip } from "@/lib/analytics-utils";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt, Percent, Tag, Gift, CreditCard, Wallet, Download, BarChart2 } from "lucide-react";

// ── Waterfall chart helpers ────────────────────────────────────────────────

const formatShort = (v: number) => {
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(1)}Cr`;
  if (v >= 1_00_000)    return `₹${(v / 1_00_000).toFixed(1)}L`;
  if (v >= 1_000)       return `₹${(v / 1_000).toFixed(1)}k`;
  return `₹${v}`;
};

const buildWaterfallData = (financial: any) => {
  const gross          = financial?.grossRevenue         || 0;
  const metalCost      = financial?.totalMetalCost       || 0;
  const gemstoneCost   = financial?.totalGemstoneCost    || 0;
  const grossProfit    = financial?.grossProfit           || 0;
  const discounts      = financial?.discountsGiven       || 0;
  const shippingRev    = financial?.shippingRevenue      || 0;
  const shippingCost   = financial?.shippingCostToPartner || 0;
  const gatewayFees    = financial?.gatewayFees           || 0;
  const pbt            = financial?.profitBeforeTax       || 0;
  const incomeTax      = financial?.incomeTax             || 0;
  const pat            = financial?.profitAfterTax        || 0;

  // Running totals for waterfall positioning
  const afterMetal    = gross - metalCost;
  const afterGems     = afterMetal - gemstoneCost;
  // afterGems ≈ grossProfit
  const afterDiscount = afterGems - discounts;
  const afterShipRev  = afterDiscount + shippingRev;
  const afterShipCost = afterShipRev - shippingCost;
  const afterGateway  = afterShipCost - gatewayFees;
  // afterGateway ≈ pbt
  const afterTax      = afterGateway - incomeTax;
  // afterTax ≈ pat

  return [
    { name: "Gross Revenue",    invisible: 0,                value: gross,        type: "total"    as const, runningTotal: gross        },
    { name: "Metal Cost",       invisible: afterMetal,        value: metalCost,    type: "negative" as const, runningTotal: afterMetal    },
    { name: "Gemstone Cost",    invisible: afterGems,         value: gemstoneCost, type: "negative" as const, runningTotal: afterGems     },
    { name: "Gross Profit",     invisible: 0,                value: grossProfit,  type: "total"    as const, runningTotal: grossProfit   },
    { name: "Discounts",        invisible: afterDiscount,     value: discounts,    type: "negative" as const, runningTotal: afterDiscount },
    { name: "Shipping Rev.",    invisible: afterDiscount,     value: shippingRev,  type: "positive" as const, runningTotal: afterShipRev  },
    { name: "Shipping Cost",    invisible: afterShipCost,     value: shippingCost, type: "negative" as const, runningTotal: afterShipCost },
    { name: "Gateway Fees",     invisible: afterGateway,      value: gatewayFees,  type: "negative" as const, runningTotal: afterGateway  },
    { name: "PBT",              invisible: 0,                value: pbt,          type: "total"    as const, runningTotal: pbt           },
    { name: "Income Tax",       invisible: afterTax,          value: incomeTax,    type: "negative" as const, runningTotal: afterTax      },
    { name: "PAT",              invisible: 0,                value: pat,          type: "total"    as const, runningTotal: pat           },
  ];
};

const WATERFALL_COLORS: Record<"total" | "positive" | "negative", string> = {
  total:    "#16a34a",
  positive: "#0891b2",
  negative: "#dc2626",
};

// Ensures tiny bars (e.g. small discounts vs large gross) are always visible
const MIN_BAR_PX = 12;
const CustomWaterfallBar = ({ x, y, width, height, fill }: any) => {
  if (height == null || height <= 0) return null;
  const h = Math.max(height, MIN_BAR_PX);
  return <rect x={x} y={y} width={width} height={h} fill={fill} rx={3} ry={3} />;
};

// Dashed horizontal connector lines drawn at the running-total level between each bar
const ConnectorLines = ({ waterfallData: data, xAxisMap, yAxisMap }: any) => {
  if (!xAxisMap || !yAxisMap || !data?.length) return null;
  const xAxis = xAxisMap[0] ?? Object.values(xAxisMap as Record<string, any>)[0];
  const yAxis = yAxisMap[0] ?? Object.values(yAxisMap as Record<string, any>)[0];
  if (!xAxis?.scale || !yAxis?.scale) return null;
  const xScale = xAxis.scale;
  const yScale = yAxis.scale;
  const bw: number = xScale.bandwidth?.() ?? 0;
  return (
    <g>
      {(data as ReturnType<typeof buildWaterfallData>).slice(0, -1).map((entry, i) => {
        const next = data[i + 1];
        const connY = yScale(entry.runningTotal);
        const x1    = xScale(entry.name) + bw;
        const x2    = xScale(next.name);
        if (x1 == null || x2 == null || connY == null) return null;
        return (
          <line key={i} x1={x1} y1={connY} x2={x2} y2={connY}
            stroke="#9ca3af" strokeDasharray="5 3" strokeWidth={1} />
        );
      })}
    </g>
  );
};

const WaterfallTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  const isDeduction = item.type === "negative";
  const isTotal     = item.type === "total";
  return (
    <div className="bg-white border rounded-lg shadow-lg p-3 text-sm min-w-[160px]">
      <p className="font-semibold text-gray-800 mb-1">{item.name}</p>
      <p className={isDeduction ? "text-red-600 font-medium" : "text-green-700 font-medium"}>
        {isDeduction ? "−" : isTotal ? "" : "+"}{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(item.value)}
      </p>
      {!isTotal && (
        <p className="text-xs text-muted-foreground mt-1 border-t pt-1">
          Running total: {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(item.runningTotal)}
        </p>
      )}
    </div>
  );
};

const ErrorCard = ({ message = "Failed to load data. Please refresh." }: { message?: string }) => (
  <Card>
    <CardContent className="py-6 text-center text-destructive text-sm">{message}</CardContent>
  </Card>
);

const AnalyticsFinancial = () => {
  const initialEnd = dayjs().endOf("day");
  const initialStart = dayjs().subtract(29, "day").startOf("day");

  // Store full ISO timestamps so the backend receives timezone-aware boundaries
  const [dateRange, setDateRange] = useState({
    startDate: initialStart.toISOString(),
    endDate:   initialEnd.toISOString(),
  });

  // Fix 10: destructure isError from every hook
  const { data: financialRaw, isLoading: isLoadingFinancial, isError: isFinancialError } = useFinancialSummary(dateRange);
  const { data: taxRaw,       isLoading: isLoadingTax,       isError: isTaxError       } = useTaxSummary(dateRange);
  const { data: couponRaw,    isLoading: isLoadingCoupon,    isError: isCouponError    } = useCouponAnalytics(dateRange);
  const { data: loyaltyRaw,   isLoading: isLoadingLoyalty,   isError: isLoyaltyError   } = useLoyaltyLiability(dateRange);
  const { data: paymentRaw,   isLoading: isLoadingPayment,   isError: isPaymentError   } = usePaymentReconciliation(dateRange);

  // Hooks return { data: actualValue } — unwrap one extra level
  const financialData = financialRaw?.data ?? financialRaw;
  const taxData       = taxRaw?.data       ?? taxRaw;
  const couponData    = couponRaw?.data    ?? couponRaw;
  const loyaltyData   = loyaltyRaw?.data   ?? loyaltyRaw;
  const paymentData   = paymentRaw?.data   ?? paymentRaw;

  const waterfallData = useMemo(
    () => (financialData ? buildWaterfallData(financialData) : []),
    [financialData]
  );

  // Zoom the Y-axis to the range of running totals so small adjustments are visible
  const yDomain = useMemo((): [number, number] => {
    if (!waterfallData.length) return [0, 1];
    const totals = waterfallData.map((d) => d.runningTotal);
    const minVal = Math.min(...totals);
    const maxVal = Math.max(...totals);
    const range  = maxVal - minVal || maxVal * 0.05;
    const pad    = range * 0.5;
    return [
      Math.max(0, Math.floor((minVal - pad) / 1000) * 1000),
      Math.ceil((maxVal + pad) / 1000) * 1000,
    ];
  }, [waterfallData]);

  const exportMutation = useExportFinancialData();

  const handleExport = async () => {
    try {
      const blob = await exportMutation.mutateAsync(dateRange);
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      // Fix 1: format ISO timestamps back to readable date strings for the filename
      const dateSuffix = dateRange.startDate && dateRange.endDate
        ? `-${dayjs(dateRange.startDate).format("YYYY-MM-DD")}-to-${dayjs(dateRange.endDate).format("YYYY-MM-DD")}`
        : "";
      a.download = `financial-data${dateSuffix}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Receipt className="h-7 w-7" />
          Financial Analytics
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border rounded-md px-3 py-1 text-sm shadow-sm">
            <span className="text-muted-foreground font-medium">Period:</span>
            {/* Fix 1: display YYYY-MM-DD but store/send full ISO on change */}
            <input
              type="date"
              value={dayjs(dateRange.startDate).format("YYYY-MM-DD")}
              max={dayjs(dateRange.endDate).format("YYYY-MM-DD")}
              onChange={(e) =>
                setDateRange((r) => ({ ...r, startDate: dayjs(e.target.value).startOf("day").toISOString() }))
              }
              className="border-none focus:ring-0 p-0 text-sm"
            />
            <span className="text-muted-foreground mx-1">to</span>
            <input
              type="date"
              value={dayjs(dateRange.endDate).format("YYYY-MM-DD")}
              min={dayjs(dateRange.startDate).format("YYYY-MM-DD")}
              max={dayjs().format("YYYY-MM-DD")}
              onChange={(e) =>
                setDateRange((r) => ({ ...r, endDate: dayjs(e.target.value).endOf("day").toISOString() }))
              }
              className="border-none focus:ring-0 p-0 text-sm"
            />
          </div>
          <Button onClick={handleExport} disabled={exportMutation.isPending} size="sm">
            <Download className="h-4 w-4 mr-2" />
            {exportMutation.isPending ? "Exporting..." : "Export"}
          </Button>
        </div>
      </div>

      {/* ── Financial Summary ──────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Profit & Loss Summary
        </h2>
        {isLoadingFinancial ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Array.from({ length: 7 }).map((_, i) => <MetricSkeleton key={i} />)}
          </div>
        ) : isFinancialError ? (
          <ErrorCard />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardDescription>Gross Revenue<InfoTip text="Total product selling prices (subtotals)" /></CardDescription></CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{formatCurrency(financialData?.grossRevenue || 0)}</div>
                <ChangeIndicator value={financialData?.previousPeriod?.grossRevenue} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>COGS<InfoTip text="Cost of Goods Sold: Metal + Gemstone costs from price snapshots" /></CardDescription></CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-red-600">{formatCurrency(financialData?.totalCOGS || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Metal: {formatCurrency(financialData?.totalMetalCost || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Gems: {formatCurrency(financialData?.totalGemstoneCost || 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-green-50">
              <CardHeader className="pb-2"><CardDescription>Gross Profit<InfoTip text="Revenue minus COGS — markup from making, wastage, hallmarking" /></CardDescription></CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-green-700">{formatCurrency(financialData?.grossProfit || 0)}</div>
                <ChangeIndicator value={financialData?.previousPeriod?.grossProfit} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Discounts<InfoTip text="Total coupons and promotions given" /></CardDescription></CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-red-600">{formatCurrency(financialData?.discountsGiven || 0)}</div>
                <ChangeIndicator value={financialData?.previousPeriod?.discountsGiven} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Shipping Margin<InfoTip text="Shipping charged to customer minus cost paid to delivery partner" /></CardDescription></CardHeader>
              <CardContent>
                <div className={`text-lg font-bold ${(financialData?.shippingMargin || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(financialData?.shippingMargin || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Rev: {formatCurrency(financialData?.shippingRevenue || 0)} | Cost: {formatCurrency(financialData?.shippingCostToPartner || 0)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50">
              <CardHeader className="pb-2"><CardDescription>PBT<InfoTip text="Profit Before Tax — after all operating costs, before income tax" /></CardDescription></CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-blue-700">{formatCurrency(financialData?.profitBeforeTax || 0)}</div>
                <ChangeIndicator value={financialData?.previousPeriod?.profitBeforeTax} />
              </CardContent>
            </Card>
            <Card className="bg-green-50">
              <CardHeader className="pb-2"><CardDescription>PAT<InfoTip text={`Profit After Tax — net profit after estimated ${financialData?.incomeTaxRate || 25}% income tax`} /></CardDescription></CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-green-700">{formatCurrency(financialData?.profitAfterTax || 0)}</div>
                <ChangeIndicator value={financialData?.previousPeriod?.profitAfterTax} />
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* ── Revenue Waterfall ──────────────────────────────────────── */}
      {!isLoadingFinancial && !isFinancialError && waterfallData.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Profit Waterfall (P&L)
            <InfoTip text="How Gross Revenue flows through COGS, discounts, shipping, fees and taxes to arrive at Profit After Tax" />
          </h2>
          <Card>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={380}>
                <BarChart
                  data={waterfallData}
                  margin={{ top: 24, right: 20, left: 10, bottom: 40 }}
                  barCategoryGap="15%"
                  customized={<ConnectorLines waterfallData={waterfallData} />}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} interval={0} />
                  <YAxis
                    domain={yDomain}
                    tickFormatter={formatShort}
                    tick={{ fontSize: 12 }}
                    width={72}
                  />
                  <RechartsTooltip content={<WaterfallTooltip />} />
                  {/* Invisible offset bar — creates the "floating" waterfall effect */}
                  <Bar dataKey="invisible" stackId="a" fill="transparent" legendType="none" />
                  {/* Visible value bar — minimum height enforced, colored by type */}
                  <Bar dataKey="value" stackId="a" shape={<CustomWaterfallBar />}>
                    {waterfallData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={WATERFALL_COLORS[entry.type]} />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="top"
                      formatter={(v: any) => formatShort(Number(v))}
                      style={{ fontSize: 11, fill: "#374151", fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-6 justify-center mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#16a34a" }} />
                  Total
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#0891b2" }} />
                  Addition
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#dc2626" }} />
                  Deduction
                </span>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ── Tax Breakdown ──────────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Percent className="h-5 w-5" />
          Tax Breakdown
        </h2>
        {isLoadingTax ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <MetricSkeleton key={i} />)}</div>
        ) : isTaxError ? (
          <ErrorCard />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardDescription>Total Tax Collected<InfoTip text="Sum of all GST/tax amounts from completed orders" /></CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(taxData?.totalTaxCollected || 0)}</div>
                <ChangeIndicator value={taxData?.previousPeriod?.totalTaxCollected} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Taxable Amount<InfoTip text="Order subtotals on which tax was applied" /></CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(taxData?.taxableAmount || 0)}</div>
                <ChangeIndicator value={taxData?.previousPeriod?.taxableAmount} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Effective Tax Rate<InfoTip text="Average tax rate: (tax collected / taxable amount) × 100" /></CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{taxData?.effectiveTaxRate || 0}%</div>
                <ChangeIndicator value={taxData?.previousPeriod?.effectiveTaxRate} />
              </CardContent>
            </Card>
            <Card>
              {/* Fix 2: tooltip updated to match corrected formula (grandTotal − tax) */}
              <CardHeader className="pb-2"><CardDescription>Net After Tax<InfoTip text="Revenue after subtracting tax: grand total minus tax collected" /></CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(taxData?.netRevenueAfterTax || 0)}</div>
                <ChangeIndicator value={taxData?.previousPeriod?.netRevenueAfterTax} />
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* ── Coupon Performance ─────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Coupon Performance
        </h2>
        {isLoadingCoupon ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">{Array.from({ length: 4 }).map((_, i) => <MetricSkeleton key={i} />)}</div>
        ) : isCouponError ? (
          <ErrorCard />
        ) : (couponData?.summary?.uniqueCouponsUsed || 0) === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No promo codes used in this period</CardContent></Card>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <Card>
                <CardHeader className="pb-2"><CardDescription>Coupons Used<InfoTip text="Number of distinct promo codes applied to orders in this period" /></CardDescription></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{couponData?.summary?.uniqueCouponsUsed || 0}</div>
                  <ChangeIndicator value={couponData?.summary?.previousPeriod?.uniqueCouponsUsed} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardDescription>Discount Given<InfoTip text="Total discount amount from coupon usage" /></CardDescription></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(couponData?.summary?.totalDiscountGiven || 0)}</div>
                  <ChangeIndicator value={couponData?.summary?.previousPeriod?.totalDiscountGiven} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardDescription>Most Used Coupon<InfoTip text="The coupon code applied most frequently in this period" /></CardDescription></CardHeader>
                <CardContent><div className="text-xl font-bold">{couponData?.summary?.mostUsedCoupon || "N/A"}</div></CardContent>
              </Card>
              <Card>
                {/* Fix 5: corrected ROI tooltip to match actual formula */}
                <CardHeader className="pb-2"><CardDescription>Coupon ROI<InfoTip text="Return on investment: ((revenue from coupon orders − discount given) / discount given) × 100" /></CardDescription></CardHeader>
                <CardContent><div className="text-2xl font-bold text-green-600">{couponData?.summary?.couponROI || 0}%</div></CardContent>
              </Card>
            </div>
            {couponData?.breakdown?.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Times Used</TableHead>
                        <TableHead className="text-right">Budget</TableHead>
                        <TableHead className="text-right">Total Discount</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Avg Order</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {couponData.breakdown.map((c: any, i: number) => {
                        // Fix 6: derive status from expiryDate, not just isActive
                        const isExpired    = c.expiryDate ? new Date(c.expiryDate) < new Date() : false;
                        const statusLabel  = c.isActive ? "Active" : isExpired ? "Expired" : "Disabled";
                        const badgeVariant = c.isActive ? "default" : isExpired ? "destructive" : "secondary";
                        return (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{c.couponCode}</TableCell>
                            <TableCell>
                              {c.couponType === "PERCENTAGE" ? `${c.couponAmount}%` : `₹${c.couponAmount}`}
                              {c.maxDiscountAmount ? ` (max ₹${c.maxDiscountAmount})` : ""}
                            </TableCell>
                            <TableCell className="text-right">{c.timesUsed}</TableCell>
                            <TableCell className="text-right">
                              {c.couponQuantity > 0 ? (
                                <span className={c.usedQuantity >= c.couponQuantity ? "text-red-600" : ""}>
                                  {c.usedQuantity}/{c.couponQuantity}
                                </span>
                              ) : "—"}
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(c.totalDiscount)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(c.revenueGenerated)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(c.avgOrderValue)}</TableCell>
                            <TableCell>
                              <Badge variant={badgeVariant as any}>{statusLabel}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </section>

      {/* ── Loyalty Liability ──────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Loyalty Liability
        </h2>
        {isLoadingLoyalty ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <MetricSkeleton key={i} />)}</div>
        ) : isLoyaltyError || !loyaltyData ? (
          // Fix 7: separate error state from empty state
          <ErrorCard />
        ) : (
          loyaltyData.totalOutstandingPoints === 0 &&
          (loyaltyData.period?.pointsEarned   || 0) === 0 &&
          // Fix 7: also check pointsRedeemed so redemption-only periods aren't hidden
          (loyaltyData.period?.pointsRedeemed || 0) === 0
        ) ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No loyalty activity in this period</CardContent></Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              {/* Fix 8: clarify these two cards are all-time, not period-filtered */}
              <CardHeader className="pb-2"><CardDescription>Outstanding Points<InfoTip text="All-time unredeemed loyalty points across all users — not filtered by date range" /></CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(loyaltyData?.totalOutstandingPoints || 0).toLocaleString("en-IN")}</div>
                <p className="text-xs text-muted-foreground mt-1">across {loyaltyData?.totalUsersWithPoints || 0} users</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-50">
              {/* Fix 8: clarify all-time scope */}
              <CardHeader className="pb-2"><CardDescription>Cash Liability<InfoTip text="All-time cash value of outstanding points — not filtered by date range" /></CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-700">{formatCurrency(loyaltyData?.cashLiability || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">@ {loyaltyData?.pointsToRupeeRatio || 10} pts = ₹1</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Points Earned (Period)<InfoTip text="Loyalty points earned by customers in the selected period" /></CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{(loyaltyData?.period?.pointsEarned || 0).toLocaleString("en-IN")}</div>
                <ChangeIndicator value={loyaltyData?.previousPeriod?.pointsEarned} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Points Redeemed (Period)<InfoTip text="Loyalty points redeemed by customers in the selected period" /></CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{(loyaltyData?.period?.pointsRedeemed || 0).toLocaleString("en-IN")}</div>
                <ChangeIndicator value={loyaltyData?.previousPeriod?.pointsRedeemed} />
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* ── Payment Reconciliation ─────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Reconciliation
        </h2>
        {/* Fix 3: UI notice explaining the different population */}
        <p className="text-xs text-muted-foreground -mt-2 mb-4">
          Includes all orders regardless of order status — totals may differ from other sections above which count only completed, non-cancelled orders.
        </p>
        {isLoadingPayment ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <MetricSkeleton key={i} />)}</div>
        ) : isPaymentError ? (
          <ErrorCard />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <Card className="bg-green-50">
                <CardHeader className="pb-2"><CardDescription>Received<InfoTip text="Total payments successfully collected" /></CardDescription></CardHeader>
                <CardContent><div className="text-2xl font-bold text-green-700">{formatCurrency(paymentData?.summary?.totalReceived || 0)}</div></CardContent>
              </Card>
              <Card className="bg-yellow-50">
                <CardHeader className="pb-2"><CardDescription>Pending<InfoTip text="Payments awaiting confirmation or COD collection" /></CardDescription></CardHeader>
                <CardContent><div className="text-2xl font-bold text-yellow-700">{formatCurrency(paymentData?.summary?.totalPending || 0)}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardDescription>Failed<InfoTip text="Payments that failed or were declined" /></CardDescription></CardHeader>
                <CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(paymentData?.summary?.totalFailed || 0)}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardDescription>Refunded<InfoTip text="Total amount refunded to customers" /></CardDescription></CardHeader>
                <CardContent><div className="text-2xl font-bold text-purple-600">{formatCurrency(paymentData?.summary?.totalRefunded || 0)}</div></CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2"><Wallet className="h-4 w-4" /> COD</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div><span className="text-sm text-muted-foreground">Total:</span> <span className="font-bold">{formatCurrency(paymentData?.cod?.total || 0)}</span></div>
                    <div><span className="text-sm text-muted-foreground">Pending:</span> <span className="font-bold text-yellow-700">{formatCurrency(paymentData?.cod?.pending || 0)}</span></div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Online</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div><span className="text-sm text-muted-foreground">Total:</span> <span className="font-bold">{formatCurrency(paymentData?.online?.total || 0)}</span></div>
                    <div><span className="text-sm text-muted-foreground">Pending:</span> <span className="font-bold text-yellow-700">{formatCurrency(paymentData?.online?.pending || 0)}</span></div>
                  </div>
                </CardContent>
              </Card>
            </div>
            {paymentData?.breakdown?.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment Mode</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentData.breakdown.map((b: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{b.mode}</TableCell>
                          <TableCell>
                            <Badge variant={b.status === "COMPLETE" ? "default" : b.status === "PENDING" ? "secondary" : "destructive"}>
                              {b.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{b.count}</TableCell>
                          <TableCell className="text-right">{formatCurrency(b.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default AnalyticsFinancial;
