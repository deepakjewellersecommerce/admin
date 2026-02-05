import { ColumnDef } from "@tanstack/react-table";
import Product from "./product";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { Pencil, Trash2, DollarSign } from "lucide-react";
import AlertConfirm from "../ui/alert-confirm";
import { useDeleteProduct } from "@/lib/react-query/product-query";
import { Badge } from "../ui/badge";
import { useNavigate } from "react-router-dom";

export const ProductColumns: ColumnDef<Product>[] = [
  {
    accessorKey: "productImageUrl",
    header: "Image URL",
    cell: ({ row }) => (
      <div className="items-center flex justify-center">
        <img
          src={
            Array.isArray(row.original.productImageUrl)
              ? row.original.productImageUrl[0]
              : row.original.productImageUrl || "/images/placeholder.jpg"
          }
          alt={row.original.productTitle}
          className="w-16 h-16 bg-gray-50"
        />
      </div>
    ),
  },
  {
    accessorKey: "productTitle",
    header: "Product Title",
    cell: ({ row }) => (
      <div className="whitespace-nowrap font-semibold ">
        {row.original.productTitle}
      </div>
    ),
  },
  {
    accessorKey: "productSlug",
    header: "Product Slug",
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-sm font-medium text-gray-500 ">
        {row.original.productSlug}
      </div>
    ),
  },
  {
    accessorKey: "skuNo",
    header: "SKU Number",
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-sm font-medium text-gray-500 text-center">
        #{row.original.skuNo}
      </div>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Is Active",
    cell: ({ row }) => {
      const isActive: any = row.original.isActive;
      // console.log(isActive);
      return (
        <Badge variant={!isActive ? "destructive" : "default"}>
          {isActive ? "Active" : "Deleted"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "isFeatured",
    header: "Featured",
    cell: ({ row }) => {
      const isFeatured: any = row.original.isFeatured;
      return (
        <Badge variant={isFeatured ? "default" : "secondary"}>
          {isFeatured ? "Yes" : "No"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const category: any = row.original.category;
      return (
        <div className="whitespace-nowrap text-sm font-medium text-gray-500 ">
          {category?.name ?? "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "regularPrice",
    header: "Regular Price",
    cell: ({ row }) => (
      <div className="text-center">
        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(row.original.regularPrice)}
      </div>
    ),
  },
  {
    accessorKey: "salePrice",
    header: "Sale Price",
    cell: ({ row }) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(row.original.salePrice),
  },
  {
    accessorKey: "productDescription",
    header: "Description",
    cell: ({ row }) => (
      <div
        dangerouslySetInnerHTML={{ __html: row.original.productDescription }}
        className="truncate w-48 "
      />
    ),
  },
  {
    accessorKey: "gst",
    header: "GST",
    cell: ({ row }) => `${row.original.gst}%`,
  },
  // {
  //   accessorKey: "ingredients",
  //   header: "Ingredients",
  //   cell: ({ row }) => {
  //     const stripHtml = (html: string) => {
  //       const tmp = document.createElement("DIV");
  //       tmp.innerHTML = html;
  //       return tmp.textContent || tmp.innerText || "";
  //     };
  //     const plainText = row.original.ingredients ? stripHtml(row.original.ingredients) : "";
  //     return (
  //       <div className="truncate w-48 text-sm">
  //         {plainText || "-"}
  //       </div>
  //     );
  //   },
  // },
  // {
  //   accessorKey: "benefits",
  //   header: "Benefits",
  //   cell: ({ row }) => {
  //     const stripHtml = (html: string) => {
  //       const tmp = document.createElement("DIV");
  //       tmp.innerHTML = html;
  //       return tmp.textContent || tmp.innerText || "";
  //     };
  //     const plainText = row.original.benefits ? stripHtml(row.original.benefits) : "";
  //     return (
  //       <div className="truncate w-48 text-sm">
  //         {plainText || "-"}
  //       </div>
  //     );
  //   },
  // },
  // {
  //   accessorKey: "shlok",
  //   header: "Shlok",
  //   cell: ({ row }) => {
  //     const shlok = row.original.shlok;
  //     if (shlok?.shlokText || shlok?.shlokMeaning) {
  //       return (
  //         <div className="text-sm">
  //           <div className="truncate w-32">{shlok.shlokText ? "Text: ✓" : ""}</div>
  //           <div className="truncate w-32">{shlok.shlokMeaning ? "Meaning: ✓" : ""}</div>
  //         </div>
  //       );
  //     }
  //     return <div className="text-sm text-gray-400">-</div>;
  //   },
  // },
  {
    accessorKey: "actions",
    cell: ({ row }) => (
      <ActionButtons id={row.original._id} />
    ),
  },
];

function ActionButtons({ id }: { id?: string }) {
  const deleteMut = useDeleteProduct();
  const navigate = useNavigate();

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size={"icon"}
        onClick={() => navigate(`/dashboard/products/${id}/pricing`)}
        title="Customize Pricing"
      >
        <DollarSign size={18} />
      </Button>
      <Link to={`/dashboard/products/edit/${id}`}>
        <Button variant="outline" size={"icon"}>
          <Pencil size={18} />
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
        <Button variant="outline" size={"icon"}>
          <Trash2 size={18} />
        </Button>
      </AlertConfirm>
    </div>
  );
}
