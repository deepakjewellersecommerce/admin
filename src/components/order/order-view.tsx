import { useGetOrderById } from "@/lib/react-query/order-query";
import { useParams, useNavigate } from "react-router";
import LoadingScreen from "../common/loading-screen";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  ShippingAddress,
  User,
} from "./orders";
import dayjs from "dayjs";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import OrderStatusForm from "./order-status-form";
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  Clock,
  Truck,
  ExternalLink,
  MessageSquare,
  Hash,
  User as UserIcon,
} from "lucide-react";

// ── Helpers ──

function getStatusBadgeVariant(
  status: OrderStatus
): "yellow" | "orange" | "green" | "red" | "secondary" | "destructive" | "outline" | "default" {
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

function getPaymentBadgeVariant(
  status: PaymentStatus
): "yellow" | "green" | "red" | "secondary" | "default" {
  const map: Record<string, string> = {
    PENDING: "yellow",
    COMPLETE: "green",
    FAILED: "red",
    REFUNDED: "secondary",
  };
  return (map[status] || "default") as any;
}

function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\bBY\b/g, "by")
    .replace(/\bFOR\b/g, "for")
    .split(" ")
    .map((w) =>
      ["by", "for"].includes(w) ? w : w.charAt(0) + w.slice(1).toLowerCase()
    )
    .join(" ");
}

function formatCurrency(amount: number): string {
  return `\u20B9${amount.toLocaleString("en-IN")}`;
}

function getBuyerInfo(buyer: string | User): {
  name: string;
  email: string;
  phone: string;
} {
  if (typeof buyer === "string") {
    return { name: "Customer", email: "", phone: "" };
  }
  const name =
    buyer.name ||
    [buyer.firstName, buyer.lastName].filter(Boolean).join(" ") ||
    "Customer";
  return {
    name,
    email: buyer.email || "",
    phone: buyer.phoneNumber || "",
  };
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatAddress(addr: ShippingAddress): string {
  // Prefer new-schema fields
  if (addr.name || addr.address) {
    const lines = [
      addr.name,
      addr.address,
      addr.pincode ? `PIN: ${addr.pincode}` : "",
      addr.phone,
    ];
    return lines.filter(Boolean).join("\n");
  }
  // Legacy fields
  const lines = [
    [addr.firstName, addr.lastName].filter(Boolean).join(" "),
    addr.street,
    [addr.city, addr.state, addr.zip].filter(Boolean).join(", "),
    addr.country,
    addr.phoneNumber,
    addr.email,
  ];
  return lines.filter(Boolean).join("\n");
}

// ── Map legacy products to OrderItem shape ──
function mapLegacyProducts(products: any[]): OrderItem[] {
  return products.map((p) => ({
    product: p.product?._id || p.product || "",
    productTitle: p.product?.productTitle || "Unknown Product",
    productImageUrl: p.product?.productImageUrl || p.product?.images?.[0] || "",
    skuNo: p.product?.skuNo || "",
    metalType: p.product?.metalType || "",
    grossWeight: p.product?.grossWeight,
    netWeight: p.product?.netWeight,
    quantity: p.quantity || 1,
    priceAtOrder: p.price || 0,
    lineTotal: (p.price || 0) * (p.quantity || 1),
    variant: p.variant,
  }));
}

// ── Component ──

const OrderView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoading, data } = useGetOrderById(String(id));

  if (isLoading) return <LoadingScreen />;

  const order: Order = data ?? ({} as Order);

  // Resolve items: prefer new `items[]`, fall back to legacy `products[]`
  const items: OrderItem[] =
    order.items && order.items.length > 0
      ? order.items
      : Array.isArray(order.products)
        ? mapLegacyProducts(order.products)
        : [];

  // Totals with legacy fallback
  const calculatedTotal = items.reduce((acc, item) => acc + (item.lineTotal || 0), 0);
  const subtotal = order.subtotal ?? calculatedTotal;
  const discountAmount = order.discountAmount ?? 0;
  const shippingAmount = order.shippingAmount ?? 0;
  const taxAmount = order.taxAmount ?? 0;
  const grandTotal = order.grandTotal ?? subtotal - discountAmount + shippingAmount + taxAmount;

  const buyerInfo = getBuyerInfo(order.buyer);
  const orderDate = order.createdAt
    ? dayjs(order.createdAt).format("DD MMM YYYY, hh:mm A")
    : "N/A";
  const orderDisplayId = order.orderNumber || `#${order._id?.slice(-8).toUpperCase() || id}`;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="w-fit"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">Order {orderDisplayId}</h1>
          <Badge variant={getStatusBadgeVariant(order.order_status)}>
            {formatStatus(order.order_status || "PLACED")}
          </Badge>
          <Badge variant={getPaymentBadgeVariant(order.payment_status)}>
            {order.payment_status || "PENDING"}
          </Badge>
        </div>
        <span className="text-sm text-muted-foreground sm:ml-auto">
          {orderDate}
        </span>
      </div>

      {/* ── Two-column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column (2/3) ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {items.map((item, i) => (
                  <div key={i}>
                    {i > 0 && <Separator className="my-4" />}
                    <div className="flex gap-4">
                      {/* Thumbnail */}
                      <div className="flex-shrink-0 h-16 w-16 rounded-md bg-muted overflow-hidden">
                        {item.productImageUrl ? (
                          <img
                            src={item.productImageUrl}
                            alt={item.productTitle}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {item.productTitle}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {item.skuNo && (
                            <Badge variant="outline" className="text-xs">
                              <Hash className="h-3 w-3 mr-1" />
                              {item.skuNo}
                            </Badge>
                          )}
                          {item.metalType && (
                            <Badge variant="secondary" className="text-xs">
                              {item.metalType}
                            </Badge>
                          )}
                          {(item.grossWeight || item.netWeight) && (
                            <span className="text-xs text-muted-foreground">
                              {item.grossWeight && `Gross: ${item.grossWeight}g`}
                              {item.grossWeight && item.netWeight && " / "}
                              {item.netWeight && `Net: ${item.netWeight}g`}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Qty & Price */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold">
                          {formatCurrency(item.lineTotal || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity > 1
                            ? `${item.quantity} x ${formatCurrency(item.priceAtOrder || 0)}`
                            : `Qty: ${item.quantity}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No items found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Discount
                      {order.couponCode && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {order.couponCode}
                        </Badge>
                      )}
                    </span>
                    <span className="text-green-600">
                      -{formatCurrency(discountAmount)}
                    </span>
                  </div>
                )}
                {shippingAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{formatCurrency(shippingAmount)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold text-base">
                  <span>Grand Total</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer & Shipping Address Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Customer & Shipping
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Customer Details */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Customer</p>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {getInitials(buyerInfo.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{buyerInfo.name}</p>
                      {buyerInfo.email && (
                        <p className="text-xs text-muted-foreground truncate">
                          {buyerInfo.email}
                        </p>
                      )}
                      {buyerInfo.phone && (
                        <p className="text-xs text-muted-foreground">
                          {buyerInfo.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Shipping Address
                  </p>
                  {order.shippingAddress && (
                    <p className="text-sm whitespace-pre-line">
                      {formatAddress(order.shippingAddress)}
                    </p>
                  )}
                  {(order.trackingNumber || order.trackingUrl) && (
                    <div className="space-y-1 pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        Tracking
                      </p>
                      {order.trackingNumber && (
                        <p className="text-sm font-mono">
                          {order.trackingNumber}
                        </p>
                      )}
                      {order.trackingUrl && (
                        <a
                          href={order.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Track Shipment
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column (1/3) ── */}
        <div className="space-y-6">
          {/* Order Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-mono text-xs truncate max-w-[140px]">
                  {order._id}
                </span>
              </div>
              {order.orderNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Number</span>
                  <span className="font-semibold">{order.orderNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Mode</span>
                <Badge variant="outline">{order.payment_mode}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Status</span>
                <Badge variant={getPaymentBadgeVariant(order.payment_status)}>
                  {order.payment_status}
                </Badge>
              </div>
              {order.cc_orderId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gateway Ref</span>
                  <span className="font-mono text-xs truncate max-w-[140px]">
                    {order.cc_orderId}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Management Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Status Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Timeline */}
              {order.statusHistory && order.statusHistory.length > 0 && (
                <div className="space-y-0">
                  {order.statusHistory.map((entry, i) => (
                    <div key={i} className="flex gap-3">
                      {/* Timeline line */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`h-3 w-3 rounded-full flex-shrink-0 mt-1 ${
                            i === order.statusHistory!.length - 1
                              ? "bg-primary"
                              : "bg-muted-foreground/30"
                          }`}
                        />
                        {i < order.statusHistory!.length - 1 && (
                          <div className="w-px h-full bg-border min-h-[24px]" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="pb-4 min-w-0">
                        <p className="text-sm font-medium">
                          {formatStatus(entry.status)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {dayjs(entry.timestamp).format("DD MMM YYYY, hh:mm A")}
                        </p>
                        {entry.note && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            {entry.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  <Separator className="my-2" />
                </div>
              )}

              {/* Status Update Form */}
              <OrderStatusForm
                defaultValues={{
                  order_status: order.order_status || "PLACED",
                  trackingNumber: order.trackingNumber || "",
                  trackingUrl: order.trackingUrl || "",
                  adminNote: "",
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Notes Section (full-width) ── */}
      {order.customerNote && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Customer Note
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm bg-muted/50 rounded-md p-3">
              {order.customerNote}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderView;
