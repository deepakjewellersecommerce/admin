import { ColumnDef } from "@tanstack/react-table";
import Product from "./product";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { Pencil, Trash2, DollarSign } from "lucide-react";
import AlertConfirm from "../ui/alert-confirm";
import { useDeleteProduct } from "@/lib/react-query/product-query";
import { Badge } from "../ui/badge";
import { useNavigate } from "react-router-dom";

const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const ProductColumns: ColumnDef<Product>[] = [
  {
    accessorKey: "productImageUrl",
    header: "",
    size: 64,
    cell: ({ row }) => {
      const src = Array.isArray(row.original.productImageUrl)
        ? row.original.productImageUrl[0]
        : row.original.productImageUrl || "/images/placeholder.jpg";
      return (
        <img
          src={src}
          alt={row.original.productTitle}
          className="w-12 h-12 rounded-md object-cover bg-gray-100"
        />
      );
    },
  },
  {
    accessorKey: "productTitle",
    header: "Product",
    cell: ({ row }) => (
      <div className="min-w-[180px]">
        <div className="font-medium text-sm leading-tight">
          {row.original.productTitle}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5 font-mono">
          SKU #{row.original.skuNo}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "categoryId",
    header: "Category",
    cell: ({ row }) => {
      const categoryId: any = row.original.categoryId;
      const categoryName = typeof categoryId === 'object' ? categoryId?.name : '—';
      return (
        <span className="text-sm text-muted-foreground">
          {categoryName ?? "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "regularPrice",
    header: "Price",
    cell: ({ row }) => {
      const regular = row.original.regularPrice;
      const sale = row.original.salePrice;
      const hasDiscount = sale && sale < regular;
      return (
        <div className="text-right tabular-nums">
          <div className="text-sm font-medium">
            {formatINR(hasDiscount ? sale : regular)}
          </div>
          {hasDiscount && (
            <div className="text-xs text-muted-foreground line-through">
              {formatINR(regular)}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "gst",
    header: "GST",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground tabular-nums">
        {row.original.gst}%
      </span>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.original.isActive;
      return (
        <Badge
          className={
            isActive
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 shadow-none"
              : "bg-red-50 text-red-700 border-red-200 hover:bg-red-50 shadow-none"
          }
          variant="outline"
        >
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "isFeatured",
    header: "Featured",
    cell: ({ row }) => {
      const isFeatured = row.original.isFeatured;
      return isFeatured ? (
        <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 shadow-none" variant="outline">
          Featured
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      );
    },
  },
  {
    id: "actions",
    header: "",
    size: 120,
    cell: ({ row }) => <ActionButtons id={row.original._id} />,
  },
];

function ActionButtons({ id }: { id?: string }) {
  const deleteMut = useDeleteProduct();
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={() => navigate(`/dashboard/products/${id}/pricing`)}
        title="Pricing"
      >
        <DollarSign size={15} />
      </Button>
      <Link to={`/dashboard/products/edit/${id}`}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Edit"
        >
          <Pencil size={15} />
        </Button>
      </Link>
      <AlertConfirm
        actionMessage="Delete"
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        onConfirm={() => {
          if (id) deleteMut.mutate(id);
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-red-600"
          title="Delete"
        >
          <Trash2 size={15} />
        </Button>
      </AlertConfirm>
    </div>
  );
}
