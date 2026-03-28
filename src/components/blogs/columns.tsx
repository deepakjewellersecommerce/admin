import { ColumnDef } from "@tanstack/react-table";
import { Blog } from "./blogs";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { Pencil } from "lucide-react";
import { Badge } from "../ui/badge";

export const BlogColumns: ColumnDef<Blog>[] = [
  {
    header: "Title",
    accessorKey: "title",
  },
  {
    header: "Display Image",
    accessorKey: "displayImage",
    cell: ({ row }) => {
      const imageUrl = row.original.displayImage?.[0]?.url;
      // Force a rectangular thumbnail with rounded corners and a border.
      // Use object-cover to crop/scale images of any original dimensions.
      if (!imageUrl) {
        return (
          <div className="w-28 h-20 rounded-lg border bg-gray-100 flex items-center justify-center text-sm text-gray-500">
            No Image
          </div>
        );
      }

      return (
        <img
          src={imageUrl}
          alt="Blog Display"
          className="w-28 h-20 rounded-lg border object-cover"
          loading="lazy"
        />
      );
    },
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => {
      const status = row.original.status ?? "DRAFT";
      return (
        <Badge variant={status === "PUBLISHED" ? "default" : "secondary"}>
          {status === "PUBLISHED" ? "Published" : "Draft"}
        </Badge>
      );
    },
  },
  {
    header: "Created At",
    accessorKey: "createdAt",
    cell: ({ row }) => {
      return new Date(row.original.createdAt).toLocaleString();
    },
  },
  {
    header: "Updated At",
    accessorKey: "updatedAt",
    cell: ({ row }) => {
      return new Date(row.original.updatedAt).toLocaleString();
    },
  },
  {
    header: "Actions",
    accessorKey: "actions",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <Link to={`/dashboard/blogs/${row.original._id}`}>
            <Button size={"icon"} variant={"outline"}>
              <Pencil size={18} />
            </Button>
          </Link>
        </div>
      );
    },
  },
];
