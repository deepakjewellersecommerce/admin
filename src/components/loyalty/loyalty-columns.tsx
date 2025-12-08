import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

export interface LoyaltyUser {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phoneNumber?: string;
  };
  totalPoints: number;
  availablePoints: number;
  usedPoints: number;
  currentTier: {
    name: string;
    level: number;
  };
  lifetimeSpent: number;
  statistics: {
    orderCount: number;
    totalEarned: number;
    totalRedeemed: number;
    averageOrderValue: number;
  };
  createdAt: string;
  updatedAt: string;
}

const getTierBadgeColor = (tier: string) => {
  switch (tier?.toUpperCase()) {
    case "PLATINUM":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "GOLD":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "SILVER":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "BRONZE":
    default:
      return "bg-orange-100 text-orange-800 border-orange-200";
  }
};

export const LoyaltyUserColumns: ColumnDef<LoyaltyUser>[] = [
  {
    accessorKey: "user.name",
    header: "Customer Name",
    cell: ({ row }) => {
      const user = row.original.user;
      return (
        <div>
          <p className="font-medium">{user?.name || "N/A"}</p>
          <p className="text-sm text-gray-500">{user?.email || ""}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "user.phoneNumber",
    header: "Phone",
    cell: ({ row }) => {
      return <span>{row.original.user?.phoneNumber || "N/A"}</span>;
    },
  },
  {
    accessorKey: "currentTier.name",
    header: "Tier",
    cell: ({ row }) => {
      const tierName = row.original.currentTier?.name || "BRONZE";
      return (
        <Badge className={getTierBadgeColor(tierName)} variant="outline">
          {tierName}
        </Badge>
      );
    },
  },
  {
    accessorKey: "totalPoints",
    header: "Total Points",
    cell: ({ row }) => {
      return (
        <span className="font-medium">
          {row.original.totalPoints?.toLocaleString() || 0}
        </span>
      );
    },
  },
  {
    accessorKey: "availablePoints",
    header: "Available",
    cell: ({ row }) => {
      return (
        <span className="text-green-600 font-medium">
          {row.original.availablePoints?.toLocaleString() || 0}
        </span>
      );
    },
  },
  {
    accessorKey: "usedPoints",
    header: "Redeemed",
    cell: ({ row }) => {
      return (
        <span className="text-orange-600">
          {row.original.usedPoints?.toLocaleString() || 0}
        </span>
      );
    },
  },
  {
    accessorKey: "lifetimeSpent",
    header: "Lifetime Spent",
    cell: ({ row }) => {
      return (
        <span className="font-medium">
          ₹{row.original.lifetimeSpent?.toLocaleString() || 0}
        </span>
      );
    },
  },
  {
    accessorKey: "statistics.orderCount",
    header: "Orders",
    cell: ({ row }) => {
      return <span>{row.original.statistics?.orderCount || 0}</span>;
    },
  },
];
