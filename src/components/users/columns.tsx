import { ColumnDef } from "@tanstack/react-table";
import IUser from "./user"; // Import IUser interface for User schema
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";


export const UserColumns: ColumnDef<IUser>[] = [
  {
    header: "Display Image",
    accessorKey: "displayImage",
    cell: ({ row }) => {
      // Support multiple shapes: profileImageUrl could be a string or an object { url }
      const profile = row.original;
      let imageUrl: string | undefined;

      if (typeof (profile as any)?.profileImageUrl === "string") {
        imageUrl = (profile as any).profileImageUrl;
      } else if ((profile as any)?.profileImageUrl?.url) {
        imageUrl = (profile as any).profileImageUrl.url;
      } else if (profile?.displayImage?.url) {
        imageUrl = profile.displayImage.url;
      }

      if (imageUrl) {
        return (
          <img
            src={imageUrl}
            alt={profile?.name || "User"}
            width={30}
            height={30}
            className="rounded-full object-cover"
          />
        );
      }

      const name = profile?.name || (profile as any)?.firstName || "U";
      const initials = (
        name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || "U"
      );

      return (
        <div
          className="w-[30px] h-[30px] bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-700"
          title={profile?.name || "User"}
        >
          {initials}
        </div>
      );
    },
  },
  {
    header: "Name",
    accessorKey: "name",
    cell: ({ row }) => (
      <Link
        to={`/dashboard/users/${row.original._id}`}
        className="whitespace-nowrap font-medium text-violet-700 hover:underline"
      >
        {row.original?.name || "N/A"}
      </Link>
    ),
  },
  {
    header: "Email",
    accessorKey: "email",
  },
  {
    header: "Phone Number",
    accessorKey: "phoneNumber",
  },
  {
    header: "Blocked",
    accessorKey: "isBlocked",
    cell: ({ row }) => {
      return row.original.isBlocked ? "Yes" : "No";
    },
  },
  {
    header: "Created At",
    accessorKey: "createdAt",
    cell: ({ row }) => {
      const ts = row.original?.createdAt;
      try {
        return ts ? new Date(ts).toLocaleDateString() : "N/A";
      } catch (e) {
        return "N/A";
      }
    },
  },
  {
    header: "Actions",
    accessorKey: "actions",
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <Link to={`/dashboard/users/cart/${row.original._id}`}>
            <Button variant={"outline"} size={"icon"}>
              <ShoppingCart size={18} />
            </Button>
          </Link>
        </div>
      );
    },
  },
];
