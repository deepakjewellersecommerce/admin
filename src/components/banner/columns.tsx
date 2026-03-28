import { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { useDeleteBanner } from "@/lib/react-query/banner-query";
import { Trash2, Pencil } from "lucide-react";
import { Banner } from "./banner"; // Import the Banner interface
import {
  Dialog,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import React from "react";
import { Badge } from "../ui/badge";

export const BannerColumns: ColumnDef<Banner>[] = [
  {
    header: "Title",
    accessorKey: "title",
  },
  {
    header: "Slug",
    accessorKey: "slug",
  },
  {
    header: "Banner Images",
    accessorKey: "bannerImages",
    cell: ({ row }) => {
      // Backend returns bannerImages as an array of string URLs
      const first = Array.isArray(row.original.bannerImages) && row.original.bannerImages.length > 0
        ? row.original.bannerImages[0]
        : null;
      const bannerImageUrl = typeof first === 'string' ? first : null;
      return (
        <img
          src={bannerImageUrl || '/images/placeholder.jpg'}
          alt={row.original.title || 'Banner'}
          style={{ maxWidth: '100px' }}
        />
      );
    },
  },
  {
    header: "Status",
    accessorKey: "isActive",
    cell: ({ row }) => {
      const isActive = row.original.isActive ?? true;
      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Inactive"}
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
      // Use hook inside cell renderer component
      const [isDialogOpen, setIsDialogOpen] = React.useState(false);
      const DeleteButton = () => {
        const deleteMutation = useDeleteBanner();
        const handleDelete = async () => {
          setIsDialogOpen(true);
        };
        return (
          <div className="flex items-center gap-2">
            <Link to={`/dashboard/banners/update/${row.original._id}`}>
              <Button size={"icon"} variant={"outline"}>
                <Pencil size={18} />
              </Button>
            </Link>
            <Button size={"icon"} variant={"outline"} onClick={handleDelete}>
              <Trash2 size={18} />
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogDescription className="text-center">
                  Are you sure you want to delete this banner?
                </DialogDescription>
                <div className="mt-4 flex justify-center gap-4">
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      await deleteMutation.mutateAsync(row.original._id);
                      setIsDialogOpen(false);
                    }}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          
        );
      };

      return <DeleteButton />;
    },
  },
];
