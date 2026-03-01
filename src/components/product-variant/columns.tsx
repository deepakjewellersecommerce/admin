import { ColumnDef } from "@tanstack/react-table";
import ProductVariant from "./product-variant";
import { Badge } from "../ui/badge";
import { Link } from "react-router-dom";
import { Pencil, ImageIcon } from "lucide-react";
import { Button } from "../ui/button";
import { getLinkFromJson } from "@/lib/utils";

export const ProductVariantColumns: ColumnDef<ProductVariant>[] = [
  {
    header: "Image",
    accessorKey: "imageUrls",
    cell: ({ row }) => {
      const imageUrls = row.original.imageUrls;
      if (!imageUrls || imageUrls.length === 0) {
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded border bg-gray-50">
            <ImageIcon size={16} className="text-gray-400" />
          </div>
        );
      }
      const raw = imageUrls[0];
      const src = typeof raw === "object" ? getLinkFromJson(raw) : raw;
      return (
        <img
          src={src}
          alt="variant"
          className="h-10 w-10 rounded border object-cover"
        />
      );
    },
  },
  {
    header: "Color",
    accessorKey: "color",
    cell: ({ row }) => {
      const color = row.original.color;
      if (!color || typeof color === "string") return "—";
      return (
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full border"
            style={{ backgroundColor: color.hexcode }}
          />
          <span>{color.color_name}</span>
        </div>
      );
    },
  },
  {
    header: "Size",
    accessorKey: "size",
  },
  {
    header: "Weight",
    accessorKey: "weight",
    cell: ({ row }) => {
      const weight = row.original.weight;
      return weight != null ? `${weight}g` : "—";
    },
  },
  {
    header: "Price",
    accessorKey: "price",
    // Add other properties or functions related to this column if needed.
  },
  {
    header: "Sale Price",
    accessorKey: "salePrice",
    // Add other properties or functions related to this column if needed.
  },
  {
    accessorKey: "isActive",
    header: "Is Active",
    cell: ({ row }) => {
      const isActive: any = row.original.isActive;
      return (
        <Badge variant={!isActive ? "destructive" : "default"}>
          {isActive ? "Active" : "Deleted"}
        </Badge>
      );
    },
  },
  {
    header: "Stock",
    accessorKey: "stock",
    // Add other properties or functions related to this column if needed.
  },
  {
    header: "Actions",
    accessorKey: "actions",
    cell: ({ row }) => {
      return (
        <div className="flex items-center justify-start space-x-2">
          <Link to={`/dashboard/product-variant/${row.original._id}/edit`}>
            <Button size={"icon"} variant={"outline"}>
              <Pencil size={20} />
            </Button>
          </Link>
        </div>
      );
    },
  },
];
