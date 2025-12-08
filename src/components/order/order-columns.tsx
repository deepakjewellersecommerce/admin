import { ColumnDef } from "@tanstack/react-table";
import { Order } from "./orders"; // Assuming there's an Order model similar to Product
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { Eye } from "lucide-react";
import { Badge } from "../ui/badge";

export const OrderColumns: ColumnDef<Order>[] = [
  {
    accessorKey: "serialNumber",
    header: "Sr. No.",
    cell: ({ row, table }) => {
      // Compute serial number across pages: pageIndex * pageSize + row.index + 1
      const pagination = table.getState().pagination || { pageIndex: 0, pageSize: 10 };
      const pageIndex = pagination.pageIndex ?? 0;
      const pageSize = pagination.pageSize ?? 10;
      const serial = pageIndex * pageSize + (row.index ?? 0) + 1;
      return <span className="text-sm font-semibold">{serial}</span>;
    },
  },
  {
    accessorKey: "orderId",
    header: "Order id",
    cell: ({ row }) => (
      <span className="text-sm font-semibold">{
        (() => {
          const id = row.original._id || "";
          return id.length > 4 ? `${id.slice(0, 4)}...` : id;
        })()
      }</span>
    ),
  },
  {
    accessorKey: "userName",
    header: "User",
    cell: ({ row }) => {
      const sa = row.original.shippingAddress || {};
      const buyer = row.original.buyer as any;
      // preference: shippingAddress name -> buyer.name -> buyer.firstName/lastName -> buyer string -> N/A
      let name = "";
      if (sa.firstName || sa.lastName) {
        name = [sa.firstName, sa.lastName].filter(Boolean).join(" ");
      } else if (typeof buyer === "string") {
        name = buyer;
      } else if (buyer && typeof buyer === "object") {
        name = buyer.name || [buyer.firstName, buyer.lastName].filter(Boolean).join(" ") || "";
      }
      name = name || "N/A";
      return <span className="text-sm">{name}</span>;
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => {
      const sa = row.original.shippingAddress || {};
      const buyer = row.original.buyer as any;
      const phone = sa.phoneNumber || (buyer && typeof buyer === "object" && buyer.phoneNumber) || "N/A";
      return <span className="text-sm">{phone}</span>;
    },
  },
  {
    accessorKey: "orderDate",
    header: "Order Date",
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return (
        <span className="text-sm font-semibold">{`${date.getDate()}/${
          date.getMonth() + 1
        }/${date.getFullYear()}`}</span>
      );
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const products = row.original.products || [];
      let totalPrice = 0;

      products.forEach((product) => {
        const pPrice = Number(product?.price || 0);
        totalPrice += isNaN(pPrice) ? 0 : pPrice;
      });
      return (
        <span className="text-sm font-semibold">₹ {totalPrice.toFixed(2).replace(/\.00$/, "")}</span>
      );
    },
  },
  {
    accessorKey: "orderStatus",
    header: "Order Status",
    cell: ({ row }) => {
      const status = (row.original.order_status || "").toString();
      const map: Record<string, string> = {
        PLACED: "yellow",
        SHIPPED: "orange",
        DELIVERED: "green",
        CANCELLED_BY_ADMIN: "red",
        CANCELLED: "red",
      };
      const variant = (map[status] || "default") as any;
      const label = (status.replace(/_/g, " ") || "N/A");
      return <Badge variant={variant}>{label}</Badge>;
    },
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Link to={`/dashboard/orders/${row.original._id}`}>
          <Button variant="outline" size={"icon"}>
            <Eye size={20} />
          </Button>
        </Link>
      </div>
    ),
  },
];
