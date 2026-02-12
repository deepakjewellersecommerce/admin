import { useState } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt, Percent, Tag, Gift, CreditCard, Wallet, Download, RefreshCw } from "lucide-react";

const AnalyticsFinancial = () => {
  const initialEnd = dayjs().endOf("day");
  const initialStart = dayjs().subtract(29, "day").startOf("day");
  const [dateRange, setDateRange] = useState({
    startDate: initialStart.format("YYYY-MM-DD"),
    endDate: initialEnd.format("YYYY-MM-DD"),
  });

  const { data: financialData, isLoading: isLoadingFinancial } = useFinancialSummary(dateRange);
  const { data: taxData, isLoading: isLoadingTax } = useTaxSummary(dateRange);
  const { data: couponData, isLoading: isLoadingCoupon } = useCouponAnalytics(dateRange);
  const { data: loyaltyData, isLoading: isLoadingLoyalty } = useLoyaltyLiability(dateRange);
  const { data: paymentData, isLoading: isLoadingPayment } = usePaymentReconciliation(dateRange);
  const exportMutation = useExportFinancialData();

  const handleExport = async () => {
    try {
      const blob = await exportMutation.mutateAsync(dateRange);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateSuffix = dateRange.startDate && dateRange.endDate ? `-${dateRange.startDate}-to-${dateRange.endDate}` : "";
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
          <Button onClick={handleExport} disabled={exportMutation.isPending} size="sm">
            <Download className="h-4 w-4 mr-2" />
            {exportMutation.isPending ? "Exporting..." : "Export"}
          </Button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Financial Summary
        </h2>
        {isLoadingFinancial ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <MetricSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardDescription>Gross Revenue<InfoTip text="Total revenue before deductions" /></CardDescription></CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatCurrency(financialData?.grossRevenue || 0)}</div>
                <ChangeIndicator value={financialData?.previousPeriod?.grossRevenue} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Discounts Given<InfoTip text="Total discounted via coupons and promotions" /></CardDescription></CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-red-600">{formatCurrency(financialData?.discountsGiven || 0)}</div>
                <ChangeIndicator value={financialData?.previousPeriod?.discountsGiven} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Tax Collected<InfoTip text="Total GST/tax collected" /></CardDescription></CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-blue-600">{formatCurrency(financialData?.taxCollected || 0)}</div>
                <ChangeIndicator value={financialData?.previousPeriod?.taxCollected} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Shipping Revenue<InfoTip text="Total shipping charges" /></CardDescription></CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatCurrency(financialData?.shippingRevenue || 0)}</div>
                <ChangeIndicator value={financialData?.previousPeriod?.shippingRevenue} />
              </CardContent>
            </Card>
            <Card className="bg-green-50">
              <CardHeader className="pb-2"><CardDescription>Net Revenue<InfoTip text="Actual earnings after discounts, taxes, shipping" /></CardDescription></CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-green-700">{formatCurrency(financialData?.netRevenue || 0)}</div>
                <ChangeIndicator value={financialData?.previousPeriod?.netRevenue} />
              </CardContent>
            </Card>
            <Card className="bg-orange-50">
              <CardHeader className="pb-2"><CardDescription>Loyalty Liability<InfoTip text="Value of outstanding loyalty points" /></CardDescription></CardHeader>
              <CardContent><div className="text-xl font-bold text-orange-700">{formatCurrency(financialData?.loyaltyLiability || 0)}</div></CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* Tax Breakdown */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Percent className="h-5 w-5" />
          Tax Breakdown
        </h2>
        {isLoadingTax ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <MetricSkeleton key={i} />)}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardDescription>Total Tax Collected</CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(taxData?.totalTaxCollected || 0)}</div>
                <ChangeIndicator value={taxData?.previousPeriod?.totalTaxCollected} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Taxable Amount</CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(taxData?.taxableAmount || 0)}</div>
                <ChangeIndicator value={taxData?.previousPeriod?.taxableAmount} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Effective Tax Rate</CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{taxData?.effectiveTaxRate || 0}%</div>
                <ChangeIndicator value={taxData?.previousPeriod?.effectiveTaxRate} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Net After Tax</CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(taxData?.netRevenueAfterTax || 0)}</div>
                <ChangeIndicator value={taxData?.previousPeriod?.netRevenueAfterTax} />
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* Coupon Performance */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Coupon Performance
        </h2>
        {isLoadingCoupon ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">{Array.from({ length: 4 }).map((_, i) => <MetricSkeleton key={i} />)}</div>
        ) : couponData?.summary?.totalCouponsUsed === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No promo codes used in this period</CardContent></Card>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <Card>
                <CardHeader className="pb-2"><CardDescription>Coupons Used</CardDescription></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{couponData?.summary?.totalCouponsUsed || 0}</div>
                  <ChangeIndicator value={couponData?.summary?.previousPeriod?.totalCouponsUsed} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardDescription>Discount Given</CardDescription></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(couponData?.summary?.totalDiscountGiven || 0)}</div>
                  <ChangeIndicator value={couponData?.summary?.previousPeriod?.totalDiscountGiven} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardDescription>Most Used Coupon</CardDescription></CardHeader>
                <CardContent><div className="text-xl font-bold">{couponData?.summary?.mostUsedCoupon || "N/A"}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardDescription>Coupon ROI</CardDescription></CardHeader>
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
                      {couponData.breakdown.map((c: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{c.couponCode}</TableCell>
                          <TableCell>{c.couponType === "PERCENTAGE" ? `${c.couponAmount}%` : `₹${c.couponAmount}`}{c.maxDiscountAmount ? ` (max ₹${c.maxDiscountAmount})` : ""}</TableCell>
                          <TableCell className="text-right">{c.timesUsed}</TableCell>
                          <TableCell className="text-right">
                            {c.couponQuantity > 0 ? (
                              <span className={c.usedQuantity >= c.couponQuantity ? "text-red-600" : ""}>{c.usedQuantity}/{c.couponQuantity}</span>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(c.totalDiscount)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(c.revenueGenerated)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(c.avgOrderValue)}</TableCell>
                          <TableCell>
                            <Badge variant={c.isActive ? "default" : "secondary"}>
                              {c.isActive ? "Active" : "Expired"}
                            </Badge>
                          </TableCell>
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

      {/* Loyalty Liability */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Loyalty Liability
        </h2>
        {isLoadingLoyalty ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <MetricSkeleton key={i} />)}</div>
        ) : loyaltyData?.totalOutstandingPoints === 0 && loyaltyData?.period?.pointsEarned === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No loyalty activity in this period</CardContent></Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardDescription>Outstanding Points</CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(loyaltyData?.totalOutstandingPoints || 0).toLocaleString("en-IN")}</div>
                <p className="text-xs text-muted-foreground mt-1">across {loyaltyData?.totalUsersWithPoints || 0} users</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-50">
              <CardHeader className="pb-2"><CardDescription>Cash Liability</CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-700">{formatCurrency(loyaltyData?.cashLiability || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">@ {loyaltyData?.pointsToRupeeRatio || 10} pts = ₹1</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Points Earned (Period)</CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{(loyaltyData?.period?.pointsEarned || 0).toLocaleString("en-IN")}</div>
                <ChangeIndicator value={loyaltyData?.previousPeriod?.pointsEarned} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Points Redeemed (Period)</CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{(loyaltyData?.period?.pointsRedeemed || 0).toLocaleString("en-IN")}</div>
                <ChangeIndicator value={loyaltyData?.previousPeriod?.pointsRedeemed} />
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* Payment Reconciliation */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Reconciliation
        </h2>
        {isLoadingPayment ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <MetricSkeleton key={i} />)}</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <Card className="bg-green-50">
                <CardHeader className="pb-2"><CardDescription>Received</CardDescription></CardHeader>
                <CardContent><div className="text-2xl font-bold text-green-700">{formatCurrency(paymentData?.summary?.totalReceived || 0)}</div></CardContent>
              </Card>
              <Card className="bg-yellow-50">
                <CardHeader className="pb-2"><CardDescription>Pending</CardDescription></CardHeader>
                <CardContent><div className="text-2xl font-bold text-yellow-700">{formatCurrency(paymentData?.summary?.totalPending || 0)}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardDescription>Failed</CardDescription></CardHeader>
                <CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(paymentData?.summary?.totalFailed || 0)}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardDescription>Refunded</CardDescription></CardHeader>
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
