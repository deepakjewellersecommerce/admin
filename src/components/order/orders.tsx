interface ProductInOrder {
  product: string|any;
  quantity: number;
  price: number;
  variant: string | any;
}

interface ShippingAddress {
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

export interface User {
  _id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
}

export interface Order {
  _id: string;
  createdAt: string;
  buyer: string | User;
  products: ProductInOrder[];
  coupon_applied: string | null;
  shippingAddress: ShippingAddress;
  payment_mode: "COD" | "ONLINE";
  payment_status: "PENDING" | "COMPLETE" | "FAILED";
  order_status: "PLACED" | "SHIPPED" | "DELIVERED" | "CANCELLED BY ADMIN";
  cc_orderId?: string;
  cc_bankRefNo?: string;
}
