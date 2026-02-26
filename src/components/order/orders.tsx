// ── Price Breakdown Snapshot (mirrors backend) ──
export interface PriceBreakdownSnapshot {
  basePrice: number;
  makingCharges: number;
  gstAmount: number;
  totalPrice: number;
  goldRate?: number;
  goldWeight?: number;
}

// ── Order Item (new schema) ──
export interface OrderItem {
  product: string;
  productTitle: string;
  productImageUrl?: string;
  skuNo?: string;
  metalType?: string;
  grossWeight?: number;
  netWeight?: number;
  quantity: number;
  priceAtOrder: number;
  lineTotal: number;
  priceBreakdownSnapshot?: PriceBreakdownSnapshot;
  variant?: string | any;
}

// ── Legacy product shape (old orders) ──
export interface ProductInOrder {
  product: string | any;
  quantity: number;
  price: number;
  variant: string | any;
}

// ── Status History Entry ──
export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

// ── Enums ──
export type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED_BY_CUSTOMER"
  | "CANCELLED_BY_ADMIN"
  | "RETURNED"
  | "REFUNDED";

export type PaymentStatus = "PENDING" | "COMPLETE" | "FAILED" | "REFUNDED";

// ── Shipping Address (supports both old and new fields) ──
export interface ShippingAddress {
  // New schema fields
  name?: string;
  phone?: string;
  address?: string;
  pincode?: string;
  // Legacy fields
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

// ── User / Buyer ──
export interface User {
  _id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
}

// ── Order ──
export interface Order {
  _id: string;
  orderNumber?: string;
  createdAt: string;
  updatedAt?: string;
  buyer: string | User;

  // New schema items
  items?: OrderItem[];
  // Legacy products
  products?: ProductInOrder[];

  // Totals
  subtotal?: number;
  discountAmount?: number;
  shippingAmount?: number;
  taxAmount?: number;
  grandTotal?: number;

  // Coupon
  couponCode?: string;
  couponDiscount?: number;
  coupon_applied?: string | null;

  // Shipping & tracking
  shippingAddress: ShippingAddress;
  trackingNumber?: string;
  trackingUrl?: string;

  // Payment
  payment_mode: "COD" | "ONLINE";
  payment_status: PaymentStatus;

  // Status
  order_status: OrderStatus;
  statusHistory?: StatusHistoryEntry[];

  // Notes
  customerNote?: string;
  adminNote?: string;

  // Event timestamps
  placedAt?: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;

  // Payment gateway refs
  cc_orderId?: string;
  cc_bankRefNo?: string;
}
