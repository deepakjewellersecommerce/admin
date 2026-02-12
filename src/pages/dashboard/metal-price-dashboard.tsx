/**
 * Metal Price Dashboard
 * Clear display of MCX + Premium pricing for all metal groups
 * Focused on price transparency and formula breakdown
 */

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Calculator,
  TrendingUp,
  Clock,
  RefreshCw,
  Info,
  DollarSign,
  Sparkles,
} from "lucide-react";
import { useGetAllMetalGroups } from "@/lib/react-query/category-hierarchy-query";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// Metal group configurations
const metalConfig: Record<string, { color: string; bgColor: string; icon: string }> = {
  Gold: { color: "text-yellow-600", bgColor: "bg-yellow-50 border-yellow-200", icon: "🥇" },
  Silver: { color: "text-gray-600", bgColor: "bg-gray-50 border-gray-200", icon: "🥈" },
  Platinum: { color: "text-slate-600", bgColor: "bg-slate-50 border-slate-200", icon: "💎" },
};

const MetalPriceDashboard = () => {
  const { data: metalGroupsData, isLoading, refetch, isRefetching } = useGetAllMetalGroups();
  const metalGroups = metalGroupsData?.data?.metalGroups || metalGroupsData?.metalGroups || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  if (metalGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Calculator className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No Metal Prices Available</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Metal groups need to be initialized. Please run the seed script or contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Metal Price Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            MCX India prices with retailer premiums
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
            {isRefetching ? "Refreshing..." : "Refresh"}
          </Button>
          <Button size="sm" asChild>
            <Link to="/dashboard/pricing/metals">
              Manage Prices
            </Link>
          </Button>
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900">MCX India Pricing Formula</AlertTitle>
        <AlertDescription className="text-blue-700 mt-2">
          <div className="space-y-2">
            <p className="font-medium">Final Price = MCX Price + Premium</p>
            <ul className="text-sm space-y-1 ml-4">
              <li>• <strong>MCX Price:</strong> Live market rate from MCX India (updated daily at 9 AM IST)</li>
              <li>• <strong>Premium:</strong> Your retailer markup (editable)</li>
              <li>• <strong>Base Price:</strong> Used to calculate all material variant prices</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      {/* Metal Price Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metalGroups.map((group: any) => {
          const config = metalConfig[group.name] || {
            color: "text-gray-600",
            bgColor: "bg-gray-50 border-gray-200",
            icon: "💰",
          };

          return (
            <Card key={group._id} className={`${config.bgColor} border-2 shadow-sm hover:shadow-md transition-shadow`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{config.icon}</div>
                    <div>
                      <CardTitle className={`text-2xl ${config.color}`}>
                        {group.name}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        Symbol: <span className="font-medium">{group.symbol}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={group.isAutoUpdate ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {group.isAutoUpdate ? "AUTO" : "MANUAL"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* MCX Price Section */}
                <div className="space-y-2 p-3 bg-white rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span>MCX Price</span>
                    </div>
                    {group.lastMCXUpdate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(group.lastMCXUpdate)}
                      </div>
                    )}
                  </div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(group.mcxPrice)}
                    <span className="text-sm font-normal text-muted-foreground">/gram</span>
                  </p>
                  {group.apiKey && (
                    <p className="text-xs text-muted-foreground">
                      API Key: {group.apiKey}
                    </p>
                  )}
                </div>

                {/* Premium Section */}
                <div className="space-y-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-medium">Your Premium</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    +{formatCurrency(group.premium)}
                    <span className="text-sm font-normal text-green-600">/gram</span>
                  </p>
                  <p className="text-xs text-green-600">
                    Markup added to MCX price
                  </p>
                </div>

                {/* Formula Display */}
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Calculation</span>
                  </div>
                  <div className="font-mono text-sm text-blue-900 space-y-1">
                    <div className="flex justify-between">
                      <span>MCX Price:</span>
                      <span>{formatCurrency(group.mcxPrice)}</span>
                    </div>
                    <div className="flex justify-between text-green-700">
                      <span>+ Premium:</span>
                      <span>{formatCurrency(group.premium)}</span>
                    </div>
                    <div className="border-t border-blue-300 my-1"></div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Base Price:</span>
                      <span>{formatCurrency(group.basePrice)}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="text-center p-2 bg-white rounded border">
                    <div className="text-xs text-muted-foreground">Purity Base</div>
                    <div className="text-sm font-semibold">100%</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded border">
                    <div className="text-xs text-muted-foreground">Unit</div>
                    <div className="text-sm font-semibold">Per Gram</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer Info */}
      <Alert>
        <DollarSign className="h-4 w-4" />
        <AlertTitle>How Pricing Works</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>
            <strong>Material Variants</strong> (like 22K Gold, Sterling Silver) are calculated from the Base Price using purity formulas:
          </p>
          <div className="pl-4 text-sm space-y-1">
            <p>• Example: Gold 22K = Base Price × (91.6667 / 99.995) = {formatCurrency((metalGroups.find((g: any) => g.name === 'Gold')?.basePrice || 0) * (91.6667 / 99.995))}/g</p>
            <p>• Example: Silver 925 = Base Price × (92.5 / 99.9) = {formatCurrency((metalGroups.find((g: any) => g.name === 'Silver')?.basePrice || 0) * (92.5 / 99.9))}/g</p>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            When you update the Premium, all material prices are automatically recalculated.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default MetalPriceDashboard;
