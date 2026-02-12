/**
 * Metal Group Pricing Dashboard
 * Manages MCX-based pricing for metal groups (Gold, Silver, Platinum) and their material variants
 */

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  RefreshCcw,
  TrendingUp,
  TrendingDown,
  Edit,
  Check,
  X,
  DollarSign,
  Sparkles,
} from "lucide-react";
import {
  useGetAllMetalGroups,
  useUpdateMetalGroupPremium,
  useGetAllMaterials,
} from "@/lib/react-query/category-hierarchy-query";

// Metal group color mapping
const metalGroupColors: Record<string, string> = {
  Gold: "bg-yellow-500",
  Silver: "bg-gray-400",
  Platinum: "bg-slate-500",
};

const MetalGroupPricingDashboard = () => {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [editingPremiumId, setEditingPremiumId] = useState<string | null>(null);
  const [editPremium, setEditPremium] = useState("");

  // Queries
  const { data: metalGroupsData, isLoading: isLoadingGroups } = useGetAllMetalGroups();
  const { data: materialsData, isLoading: isLoadingMaterials } = useGetAllMaterials({
    includeInactive: true,
  });

  // Mutations
  const { mutate: updatePremium, isPending: isUpdatingPremium } = useUpdateMetalGroupPremium();

  const metalGroups = metalGroupsData?.data?.metalGroups || metalGroupsData?.metalGroups || [];
  const materials = materialsData?.data?.materials || materialsData?.materials || [];

  // Filter materials for selected metal group
  const selectedGroupMaterials = selectedGroupId
    ? materials.filter((m: any) => {
        const groupId = typeof m.metalGroup === "object" ? m.metalGroup._id : m.metalGroup;
        return groupId === selectedGroupId;
      })
    : [];

  const handleEditPremium = (groupId: string, currentPremium: number) => {
    setEditingPremiumId(groupId);
    setEditPremium(String(currentPremium));
  };

  const handleSavePremium = (groupId: string) => {
    const premiumNum = parseFloat(editPremium);
    if (isNaN(premiumNum) || premiumNum < 0) return;

    updatePremium(
      { id: groupId, premium: premiumNum },
      {
        onSuccess: () => {
          setEditingPremiumId(null);
          setEditPremium("");
        },
      }
    );
  };

  const handleCancelEdit = () => {
    setEditingPremiumId(null);
    setEditPremium("");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (isLoadingGroups) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (metalGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-16 w-16 text-yellow-500" />
        <h2 className="text-xl font-semibold">No Metal Groups Found</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Run the seed script to initialize metal groups (Gold, Silver, Platinum) with MCX pricing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Metal Group Pricing</h1>
          <p className="text-muted-foreground">
            Manage MCX prices and premiums for base metals
          </p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="bg-blue-50 border-blue-100">
        <Sparkles className="h-4 w-4 text-blue-700" />
        <AlertTitle className="text-blue-700">MCX India Pricing System</AlertTitle>
        <AlertDescription className="text-blue-600">
          <p className="mb-2">
            This system uses MCX India prices as the base. The formula is:
            <strong> MCX Price + Premium = Base Price</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>MCX Price:</strong> Fetched automatically from MCX India API daily at 9 AM IST
            </li>
            <li>
              <strong>Premium:</strong> Your retailer markup (editable here)
            </li>
            <li>
              <strong>Base Price:</strong> Final price used for material calculations
            </li>
            <li>
              <strong>Material Prices:</strong> Calculated using purity formulas (e.g., 22K = 24K × 91.6667/99.995)
            </li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Metal Group Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metalGroups.map((group: any) => {
          const isEditing = editingPremiumId === group._id;
          const isSelected = selectedGroupId === group._id;
          const color = metalGroupColors[group.name] || "bg-gray-500";

          return (
            <Card
              key={group._id}
              className={`cursor-pointer transition-all ${
                isSelected ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => !isEditing && setSelectedGroupId(group._id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${color}`} />
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {group.symbol}
                    </Badge>
                  </div>
                  <Badge variant={group.isAutoUpdate ? "default" : "secondary"} className="text-xs">
                    {group.isAutoUpdate ? "AUTO" : "MANUAL"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* MCX Price */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">MCX Price</Label>
                    {group.lastMCXUpdate && (
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(group.lastMCXUpdate)}
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-semibold">{formatCurrency(group.mcxPrice)}/g</p>
                </div>

                {/* Premium (Editable) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Your Premium</Label>
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPremium(group._id, group.premium);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Input
                        type="number"
                        value={editPremium}
                        onChange={(e) => setEditPremium(e.target.value)}
                        className="h-8 text-sm"
                        placeholder="0.00"
                      />
                      <Button
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleSavePremium(group._id)}
                        disabled={isUpdatingPremium}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-lg font-semibold text-green-600">
                      +{formatCurrency(group.premium)}/g
                    </p>
                  )}
                </div>

                {/* Base Price */}
                <div className="space-y-1 pt-2 border-t">
                  <Label className="text-xs text-muted-foreground">Final Base Price</Label>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(group.basePrice)}/g
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Materials Table */}
      {selectedGroupId && (
        <Card>
          <CardHeader>
            <CardTitle>
              {metalGroups.find((g: any) => g._id === selectedGroupId)?.name} Materials
            </CardTitle>
            <CardDescription>
              Material variants with purity-based pricing calculations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMaterials ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : selectedGroupMaterials.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No materials found for this metal group
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Purity</TableHead>
                    <TableHead>Formula</TableHead>
                    <TableHead>Calculated Price</TableHead>
                    <TableHead>Override</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedGroupMaterials.map((material: any) => (
                    <TableRow key={material._id}>
                      <TableCell className="font-medium">
                        {material.displayName || material.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {material.purityPercentage?.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {material.purityFormula || "N/A"}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(material.pricePerGram || 0)}/g
                      </TableCell>
                      <TableCell>
                        {material.priceOverride?.isActive ? (
                          <Badge variant="secondary" className="text-xs">
                            MANUAL: {formatCurrency(material.priceOverride.price)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Auto-calculated</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={material.isActive ? "default" : "secondary"}>
                          {material.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MetalGroupPricingDashboard;
