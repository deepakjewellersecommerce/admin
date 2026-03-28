import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useGetUserProfile } from "@/lib/react-query/user-query";
import LoadingScreen from "../common/loading-screen";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import dayjs from "dayjs";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  TrendingUp,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  IndianRupee,
  ShoppingCart,
  Heart,
  Star,
  Tag,
  CreditCard,
  RotateCcw,
  BarChart2,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { userAPI } from "@/lib/axios/user-API";

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(amount: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function getInitials(name: string) {
  return (name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function orderStatusBadge(status: string) {
  const map: Record<string, string> = {
    PLACED: "yellow",
    CONFIRMED: "yellow",
    PROCESSING: "orange",
    SHIPPED: "orange",
    OUT_FOR_DELIVERY: "orange",
    DELIVERED: "green",
    CANCELLED_BY_CUSTOMER: "red",
    CANCELLED_BY_ADMIN: "red",
    RETURNED: "destructive",
    REFUNDED: "secondary",
  };
  return (map[status] || "default") as any;
}

function prettyStatus(s: string) {
  return (s || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const PIE_COLORS = ["#7c3aed", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e"];

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconColor = "text-violet-500",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  iconColor?: string;
}) {
  const str = String(value);
  const isLong = str.length > 7;
  return (
    <Card className="min-w-0">
      <CardContent className="pt-4 pb-3 px-3">
        <div className={`${iconColor} mb-2`}>
          <Icon size={18} />
        </div>
        <p className="text-xs text-muted-foreground leading-tight mb-1">{label}</p>
        <p
          className={`font-bold leading-tight tabular-nums break-all ${
            isLong ? "text-base" : "text-xl"
          }`}
        >
          {value}
        </p>
        {sub && <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── component ─────────────────────────────────────────────────────────────────

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [panResetLoading, setPanResetLoading] = useState(false);
  const [panResetMsg, setPanResetMsg] = useState("");
  const limit = 10;

  const { isLoading, isError, data, refetch } = useGetUserProfile(id, page, limit);

  const handlePanReset = async () => {
    if (!id) return;
    setPanResetLoading(true);
    setPanResetMsg("");
    try {
      await userAPI.resetUserPan(id);
      setPanResetMsg("PAN cleared. User must re-verify.");
      refetch();
    } catch {
      setPanResetMsg("Failed to reset PAN. Try again.");
    } finally {
      setPanResetLoading(false);
    }
  };

  if (isLoading) return <LoadingScreen />;
  if (isError)
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-sm">Failed to load user profile. Please try again.</p>
        <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
      </div>
    );

  const res = data?.data?.data ?? data?.data ?? {};
  const user = res.user ?? {};
  const stats = res.orderStats ?? {};
  const orders: any[] = res.orders ?? [];
  const orderCount: number = res.orderCount ?? 0;
  const totalPages = Math.ceil(orderCount / limit);
  const loyalty = res.loyalty ?? null;
  const pan = user.pan ?? {};
  const wishlist: any[] = res.wishlist ?? [];
  const paymentBreakdown: any[] = res.paymentBreakdown ?? [];
  const categoryAffinity: any[] = res.categoryAffinity ?? [];
  const returnRefundHistory: any[] = res.returnRefundHistory ?? [];
  const couponUsage: any[] = res.couponUsage ?? [];

  const name = user.name || "Unknown User";
  const memberSince = user.createdAt ? dayjs(user.createdAt).format("DD MMM YYYY") : "N/A";
  const lastOrder = stats.lastOrderDate ? dayjs(stats.lastOrderDate).format("DD MMM YYYY") : "Never";

  // Tier color
  const tierColor: Record<string, string> = {
    Bronze: "text-amber-600",
    Silver: "text-slate-400",
    Gold: "text-yellow-500",
    Platinum: "text-cyan-400",
  };

  return (
    <div className="space-y-6">
      {/* ── page header ── */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="w-fit">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">User Profile</h1>
      </div>

      {/* ── profile hero ── */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Avatar className="h-16 w-16">
              {user.profileImageUrl ? (
                <img src={user.profileImageUrl} alt={name} className="rounded-full object-cover" />
              ) : null}
              <AvatarFallback className="bg-violet-100 text-violet-700 text-xl font-bold">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold">{name}</h2>
                {user.isBlocked && <Badge variant="destructive">Blocked</Badge>}
                {user.accountType && user.accountType !== "user" && (
                  <Badge variant="secondary">{user.accountType}</Badge>
                )}
                {loyalty?.currentTier?.name && (
                  <Badge variant="outline" className={tierColor[loyalty.currentTier.name] ?? ""}>
                    <Star size={11} className="mr-1" />
                    {loyalty.currentTier.name}
                  </Badge>
                )}
                {pan.verified ? (
                  <Badge variant="secondary" className="text-green-700 bg-green-50 border-green-200">
                    <ShieldCheck size={11} className="mr-1 text-green-600" />
                    PAN Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    <ShieldAlert size={11} className="mr-1" />
                    PAN Unverified
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                {user.email && (
                  <span className="flex items-center gap-1"><Mail size={13} /> {user.email}</span>
                )}
                {user.phoneNumber && (
                  <span className="flex items-center gap-1"><Phone size={13} /> {user.phoneNumber}</span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar size={13} /> Member since {memberSince}
                </span>
              </div>
            </div>

            <Link to={`/dashboard/users/cart/${id}`}>
              <Button variant="outline" size="sm">
                <ShoppingCart size={15} className="mr-1" />
                View Cart
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* ── stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={ShoppingBag} label="Total Orders" value={stats.totalOrders ?? 0} iconColor="text-violet-500" />
        <StatCard icon={IndianRupee} label="Total Spent" value={fmt(stats.totalSpent)} iconColor="text-emerald-500" />
        <StatCard icon={TrendingUp} label="Avg Order Value" value={fmt(stats.avgOrderValue)} iconColor="text-blue-500" />
        <StatCard icon={CheckCircle} label="Delivered" value={stats.deliveredOrders ?? 0} iconColor="text-green-500" />
        <StatCard icon={AlertCircle} label="Active Orders" value={stats.activeOrders ?? 0} iconColor="text-orange-500" />
        <StatCard
          icon={XCircle}
          label="Cancelled"
          value={stats.cancelledOrders ?? 0}
          sub={`Last order: ${lastOrder}`}
          iconColor="text-red-400"
        />
      </div>

      {/* ── main content grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── left / center (2/3) ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Wishlist */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Heart size={18} className="text-rose-500" />
                Wishlist
                <Badge variant="secondary" className="ml-1">{wishlist.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {wishlist.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No wishlist items.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Added</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wishlist.map((w: any) => {
                      const prod = w.product ?? {};
                      const price = prod.calculatedPrice || prod.salePrice || prod.staticPrice || 0;
                      return (
                        <TableRow key={w._id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {prod.productImageUrl?.[0] && (
                                <img
                                  src={prod.productImageUrl[0]}
                                  alt={prod.productTitle}
                                  className="h-10 w-10 rounded object-cover flex-shrink-0"
                                />
                              )}
                              <span className="text-sm font-medium line-clamp-1">{prod.productTitle || "—"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm">{fmt(price)}</TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                            {dayjs(w.createdAt).format("DD MMM YYYY")}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Order History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package size={18} />
                Order History
                <Badge variant="secondary" className="ml-1">{orderCount}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 px-4">
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No orders yet.</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((o: any) => {
                        const displayId = o.orderNumber || `#${String(o._id).slice(-8).toUpperCase()}`;
                        return (
                          <TableRow key={o._id}>
                            <TableCell className="font-mono text-sm font-medium">
                              <Link to={`/dashboard/orders/${o._id}`} className="hover:underline text-violet-700 cursor-pointer">
                                {displayId}
                              </Link>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {dayjs(o.createdAt).format("DD MMM YYYY")}
                            </TableCell>
                            <TableCell>
                              <Badge variant={orderStatusBadge(o.order_status)}>
                                {prettyStatus(o.order_status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{o.payment_status || "N/A"}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold">{fmt(o.grandTotal)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-end gap-2 px-4 py-3 border-t text-sm">
                      <span className="text-muted-foreground">Page {page} of {totalPages}</span>
                      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                        Previous
                      </Button>
                      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Category Affinity */}
          {categoryAffinity.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart2 size={18} className="text-blue-500" />
                  Category Affinity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={categoryAffinity} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11 }} />
                    <YAxis
                      dataKey="category"
                      type="category"
                      width={110}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip formatter={(v: any, name: string) => [fmt(Number(v)), name === "totalSpent" ? "Spent" : name]} />
                    <Bar dataKey="totalSpent" fill="#7c3aed" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-1">
                  {categoryAffinity.map((c: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{c.category || "Unknown"}</span>
                      <span className="font-medium">{c.orderCount} orders · {fmt(c.totalSpent)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Return / Refund History */}
          {returnRefundHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <RotateCcw size={18} className="text-orange-500" />
                  Return & Refund History
                  <div className="ml-auto flex gap-3 text-xs text-muted-foreground font-normal">
                    <span>Returned: <strong className="text-foreground">{stats.returnedOrders ?? 0}</strong></span>
                    <span>Refunded: <strong className="text-foreground">{stats.refundedOrders ?? 0}</strong></span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 px-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returnRefundHistory.map((o: any) => {
                      const displayId = o.orderNumber || `#${String(o._id).slice(-8).toUpperCase()}`;
                      return (
                        <TableRow key={o._id}>
                          <TableCell className="font-mono text-sm">{displayId}</TableCell>
                          <TableCell>
                            <Badge variant={orderStatusBadge(o.order_status)}>
                              {prettyStatus(o.order_status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{fmt(o.grandTotal)}</TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                            {dayjs(o.cancelledAt || o.createdAt).format("DD MMM YYYY")}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── right column (1/3) ── */}
        <div className="space-y-6">

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User size={18} />
                Account Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={user.isBlocked ? "destructive" : "secondary"}>
                  {user.isBlocked ? "Blocked" : "Active"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Type</span>
                <span className="capitalize">{user.accountType || "user"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Joined</span>
                <span>{memberSince}</span>
              </div>
              {stats.firstOrderDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">First Order</span>
                  <span>{dayjs(stats.firstOrderDate).format("DD MMM YYYY")}</span>
                </div>
              )}
              {stats.lastOrderDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Order</span>
                  <span>{lastOrder}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* PAN Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {pan.verified
                  ? <ShieldCheck size={18} className="text-green-500" />
                  : <ShieldAlert size={18} className="text-amber-500" />}
                PAN Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                {pan.verified ? (
                  <Badge variant="secondary" className="text-green-700 bg-green-50">Verified</Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">Not Verified</Badge>
                )}
              </div>
              {pan.number && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PAN</span>
                  <span className="font-mono tracking-wider">{pan.number}</span>
                </div>
              )}
              {pan.nameAsOnPan && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name on PAN</span>
                  <span className="text-right max-w-[140px] truncate">{pan.nameAsOnPan}</span>
                </div>
              )}
              {pan.verifiedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Verified On</span>
                  <span>{dayjs(pan.verifiedAt).format("DD MMM YYYY")}</span>
                </div>
              )}
              <Separator />
              <p className="text-xs text-muted-foreground">Required for orders above ₹2,00,000</p>
              {pan.verified && (
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    disabled={panResetLoading}
                    onClick={handlePanReset}
                  >
                    {panResetLoading ? "Clearing…" : "Reset PAN"}
                  </Button>
                  {panResetMsg && (
                    <p className="text-xs mt-1 text-center text-muted-foreground">{panResetMsg}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loyalty */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Star size={18} className="text-yellow-500" />
                Loyalty Program
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {loyalty ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tier</span>
                    <span className={`font-semibold ${tierColor[loyalty.currentTier?.name] ?? ""}`}>
                      {loyalty.currentTier?.name || "Bronze"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available Points</span>
                    <span className="font-bold text-violet-600">{loyalty.availablePoints?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Earned</span>
                    <span>{loyalty.statistics?.totalEarned?.toLocaleString() ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Redeemed</span>
                    <span>{loyalty.statistics?.totalRedeemed?.toLocaleString() ?? 0}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lifetime Spend</span>
                    <span className="font-semibold">{fmt(loyalty.lifetimeSpent ?? 0)}</span>
                  </div>
                  {loyalty.currentTier?.benefits?.discountPercentage > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tier Discount</span>
                      <Badge variant="secondary">{loyalty.currentTier.benefits.discountPercentage}%</Badge>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-2">No loyalty data.</p>
              )}
            </CardContent>
          </Card>

          {/* Payment Breakdown */}
          {paymentBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard size={18} className="text-blue-500" />
                  Payment Preference
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={paymentBreakdown}
                      dataKey="count"
                      nameKey="_id"
                      cx="50%"
                      cy="50%"
                      outerRadius={55}
                      label={({ _id, percent }: any) =>
                        `${_id} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {paymentBreakdown.map((_: any, i: number) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any, _: any, p: any) => [`${v} orders · ${fmt(p.payload.total)}`, p.payload._id]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1">
                  {paymentBreakdown.map((p: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {p._id}
                      </span>
                      <span className="text-muted-foreground">{p.count} orders · {fmt(p.total)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Coupons Used */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Tag size={18} className="text-emerald-500" />
                Coupons Used
                <Badge variant="secondary" className="ml-1">{couponUsage.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {couponUsage.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">No coupons used.</p>
              ) : (
                <div className="space-y-2">
                  {couponUsage.map((c: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className="font-mono text-xs shrink-0">
                          {c.couponCode}
                        </Badge>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          ×{c.timesUsed}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-emerald-600">-{fmt(c.totalDiscount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {dayjs(c.lastUsed).format("DD MMM YY")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Saved Addresses */}
          {Array.isArray(user.shippingAddress) && user.shippingAddress.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin size={18} />
                  Saved Addresses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.shippingAddress.map((addr: any, i: number) => (
                  <div key={addr._id || i}>
                    {i > 0 && <Separator className="mb-4" />}
                    <p className="text-sm whitespace-pre-line">
                      {[
                        [addr.firstName, addr.lastName].filter(Boolean).join(" "),
                        addr.street,
                        [addr.city, addr.state, addr.zip].filter(Boolean).join(", "),
                        addr.phoneNumber,
                      ]
                        .filter(Boolean)
                        .join("\n")}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
};

export default UserProfile;
