import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Order } from "./orders";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { Eye, Copy, Check } from "lucide-react";
import { Badge } from "../ui/badge";

// ── CopyableOrderId ───────────────────────────────────────────────────────────
// Must be a proper component (not inline in cell) so useState is allowed.

const CopyableOrderId = ({ orderNumber, id }: { orderNumber?: string; id: string }) => {
  const [copied, setCopied] = useState(false);
  const display = orderNumber || `#${id.slice(-8).toUpperCase()}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(display).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <button
      onClick={handleCopy}
      title={`Copy: ${display}`}
      className="flex items-center gap-1.5 font-mono text-xs font-medium hover:text-violet-600 transition-colors cursor-pointer group"
    >
      <span>{display}</span>
      {copied ? (
        <Check size={11} className="text-green-500 shrink-0" />
      ) : (
        <Copy size={11} className="text-muted-foreground group-hover:text-violet-500 shrink-0" />
      )}
    </button>
  );
};

// ── Columns ───────────────────────────────────────────────────────────────────

export const OrderColumns: ColumnDef<Order>[] = [
  {
    accessorKey: "serialNumber",
    header: "Sr. No.",
    cell: ({ row, table }) => {
      const pagination = table.getState().pagination || { pageIndex: 0, pageSize: 10 };
      const serial = (pagination.pageIndex ?? 0) * (pagination.pageSize ?? 10) + (row.index ?? 0) + 1;
      return <span className="text-sm font-semibold">{serial}</span>;
    },
  },
  {
    accessorKey: "orderId",
    header: "Order ID",
    cell: ({ row }) => <CopyableOrderId orderNumber={row.original.orderNumber} id={row.original._id || ""} />,
  },
  {
    accessorKey: "userName",
    header: "User",
    cell: ({ row }) => {
      const sa = row.original.shippingAddress || {};
      const buyer = row.original.buyer as any;
      let name = sa.name || "";
      if (!name && (sa.firstName || sa.lastName)) {
        name = [sa.firstName, sa.lastName].filter(Boolean).join(" ");
      }
      if (!name && buyer && typeof buyer === "object") {
        name = buyer.name || [buyer.firstName, buyer.lastName].filter(Boolean).join(" ") || "";
      }
      if (!name && typeof buyer === "string") name = buyer;
      return <span className="text-sm">{name || "N/A"}</span>;
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => {
      const sa = row.original.shippingAddress || {};
      const buyer = row.original.buyer as any;
      const phone =
        sa.phone || sa.phoneNumber ||
        (buyer && typeof buyer === "object" ? buyer.phoneNumber : "") ||
        "N/A";
      return <span className="text-sm">{phone}</span>;
    },
  },
  {
    accessorKey: "orderDate",
    header: "Order Date",
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return (
        <span className="text-sm font-semibold whitespace-nowrap">
          {`${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`}
        </span>
      );
    },
  },
  {
    accessorKey: "price",
    header: "Amount",
    cell: ({ row }) => {
      const total = row.original.grandTotal
        ?? (row.original.products || []).reduce((s: number, p: any) => s + Number(p?.price || 0), 0);
      return <span className="text-sm font-semibold">₹{Number(total).toLocaleString("en-IN")}</span>;
    },
  },
  {
    accessorKey: "orderStatus",
    header: "Order Status",
    cell: ({ row }) => {
      const status = (row.original.order_status || "").toString();
      const map: Record<string, string> = {
        PLACED: "yellow",
        CONFIRMED: "yellow",
        PROCESSING: "orange",
        SHIPPED: "orange",
        OUT_FOR_DELIVERY: "orange",
        DELIVERED: "green",
        CANCELLED_BY_CUSTOMER: "red",
        CANCELLED_BY_ADMIN: "red",
        CANCELLED: "red",
        RETURNED: "destructive",
        REFUNDED: "secondary",
      };
      const label = status.replace(/_/g, " ") || "N/A";
      return <Badge variant={(map[status] || "default") as any}>{label}</Badge>;
    },
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment",
    cell: ({ row }) => {
      const status = (row.original.payment_status || "").toString();
      const map: Record<string, string> = {
        PENDING: "yellow",
        COMPLETE: "green",
        FAILED: "red",
        REFUNDED: "secondary",
      };
      return (
        <Badge variant={(map[status] || "default") as any} className="text-xs">
          {status || "N/A"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => (
      <Link to={`/dashboard/orders/${row.original._id}`}>
        <Button variant="outline" size="icon">
          <Eye size={18} />
        </Button>
      </Link>
    ),
  },
];
