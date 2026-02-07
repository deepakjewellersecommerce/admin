/**
 * Metal Pricing Dashboard
 * Comprehensive multi-metal price management for jewelry e-commerce
 */

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  DialogTrigger,
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
  History,
  Package,
  Edit,
  Check,
  X,
} from "lucide-react";
import {
  useGetAllMetalPrices,
  useUpdateMetalPrice,
  useBulkFetchMetalPrices,
  useGetMetalPriceHistory,
  useGetAffectedProducts,
  useConfirmBulkRecalculation,
  useInitializeMetalPrices,
} from "@/lib/react-query/metal-price-query";
import { useBulkRecalculatePrices } from "@/lib/react-query/product-pricing-query";
import { MetalPrice, PriceHistory } from "@/lib/axios/metal-price-API";

// Metal type display names and colors
const metalDisplayConfig: Record<string, { name: string; color: string }> = {
  GOLD_24K: { name: "Gold 24K", color: "bg-yellow-500" },
  GOLD_22K: { name: "Gold 22K", color: "bg-yellow-400" },
  SILVER_999: { name: "Silver 999", color: "bg-gray-400" },
  SILVER_925: { name: "Silver 925", color: "bg-gray-300" },
  PLATINUM: { name: "Platinum", color: "bg-slate-500" },
};

const MetalPricingDashboard = () => {
  const [selectedMetal, setSelectedMetal] = useState<string | null>(null);
  const [editingMetal, setEditingMetal] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [showRecalculateDialog, setShowRecalculateDialog] = useState(false);
  const [selectedMetalsForRecalc, setSelectedMetalsForRecalc] = useState<string[]>([]);

  // Queries
  const { data: metalPricesData, isLoading: isLoadingPrices } = useGetAllMetalPrices();
  const { data: historyData, isLoading: isLoadingHistory } = useGetMetalPriceHistory(
    selectedMetal || "",
    { limit: 20 }
  );
  const { data: affectedData, isLoading: isLoadingAffected } = useGetAffectedProducts(
    selectedMetal || "",
    { limit: 10 }
  );

  // Mutations
  const { mutate: updatePrice, isPending: isUpdating } = useUpdateMetalPrice();
  const { mutate: bulkFetch, isPending: isFetching } = useBulkFetchMetalPrices();
  const { mutate: confirmRecalc, isPending: isRecalculating } = useConfirmBulkRecalculation();
  const { mutate: initializePrices, isPending: isInitializing } = useInitializeMetalPrices();
  const { mutate: bulkRecalculate, isPending: isBulkRecalculating } = useBulkRecalculatePrices();

  // Sort prices in a logical order: Gold 24K, Gold 22K, Platinum, Silver 999, Silver 925
  const prices: MetalPrice[] = [...(metalPricesData?.data?.prices || metalPricesData?.prices || [])].sort((a, b) => {
    const order = ["GOLD_24K", "GOLD_22K", "PLATINUM", "SILVER_999", "SILVER_925"];
    const indexA = order.indexOf(a.metalType);
    const indexB = order.indexOf(b.metalType);
    
    // If metal type not in order list, put it at the end
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    
    return indexA - indexB;
  });

  const history: PriceHistory[] = historyData?.data?.history || historyData?.history || [];
  const affectedProducts = affectedData?.data?.products || affectedData?.products || [];

  // Auto-select first metal if none selected
  useEffect(() => {
    if (prices.length > 0 && !selectedMetal) {
      setSelectedMetal(prices[0].metalType);
    }
  }, [prices, selectedMetal]);

  const handleEditPrice = (metalType: string, currentPrice: number) => {
    setEditingMetal(metalType);
    setEditPrice(String(currentPrice));
  };

  const handleSavePrice = (metalType: string) => {
    const priceNum = parseFloat(editPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    updatePrice(
      { metalType, pricePerGram: priceNum },
      {
        onSuccess: () => {
          setEditingMetal(null);
          setEditPrice("");
        },
      }
    );
  };

  const handleCancelEdit = () => {
    setEditingMetal(null);
    setEditPrice("");
  };

  const handleBulkRecalculate = () => {
    if (selectedMetalsForRecalc.length === 0) return;
    confirmRecalc(selectedMetalsForRecalc, {
      onSuccess: () => {
        setShowRecalculateDialog(false);
        setSelectedMetalsForRecalc([]);
      },
    });
  };

  const toggleMetalSelection = (metalType: string) => {
    setSelectedMetalsForRecalc((prev) =>
      prev.includes(metalType)
        ? prev.filter((m) => m !== metalType)
        : [...prev, metalType]
    );
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

  if (isLoadingPrices) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  // Show initialization option if no prices exist
  if (prices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-16 w-16 text-yellow-500" />
        <h2 className="text-xl font-semibold">No Metal Prices Found</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Initialize the metal price system to start managing prices for Gold, Silver, and
          Platinum.
        </p>
        <Button onClick={() => initializePrices()} disabled={isInitializing}>
          {isInitializing ? "Initializing..." : "Initialize Metal Prices"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Metal Pricing Dashboard</h1>
          <p className="text-muted-foreground">
            Manage prices for Gold, Silver, and Platinum
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => bulkFetch(undefined as any)}
            disabled={isFetching}
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Fetching..." : "Fetch All Prices"}
          </Button>
          <Dialog open={showRecalculateDialog} onOpenChange={setShowRecalculateDialog}>
            <DialogTrigger asChild>
              <Button>Bulk Recalculate Products</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Recalculate Product Prices</DialogTitle>
                <DialogDescription>
                  Select metal types to recalculate prices for all affected products.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {prices.map((price) => (
                  <div
                    key={price.metalType}
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted"
                    onClick={() => toggleMetalSelection(price.metalType)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full ${
                          metalDisplayConfig[price.metalType]?.color || "bg-gray-500"
                        }`}
                      />
                      <span>{metalDisplayConfig[price.metalType]?.name || price.metalType}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(price.pricePerGram)}/g
                      </span>
                      {selectedMetalsForRecalc.includes(price.metalType) ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <div className="h-5 w-5 border rounded" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowRecalculateDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkRecalculate}
                  disabled={selectedMetalsForRecalc.length === 0 || isRecalculating}
                >
                  {isRecalculating
                    ? "Recalculating..."
                    : `Recalculate (${selectedMetalsForRecalc.length} selected)`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Price Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {prices.map((price) => {
          const config = metalDisplayConfig[price.metalType] || {
            name: price.metalType,
            color: "bg-gray-500",
          };
          const isEditing = editingMetal === price.metalType;
          const isSelected = selectedMetal === price.metalType;

          return (
            <Card
              key={price.metalType}
              className={`cursor-pointer transition-all ${
                isSelected ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => !isEditing && setSelectedMetal(price.metalType)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${config.color}`} />
                    <CardTitle className="text-sm font-medium">{config.name}</CardTitle>
                  </div>
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPrice(price.metalType, price.pricePerGram);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    <Input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="text-lg font-bold"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSavePrice(price.metalType)}
                        disabled={isUpdating}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold">
                      {formatCurrency(price.pricePerGram)}
                    </p>
                    <p className="text-xs text-muted-foreground">per gram</p>
                  </>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <p className="text-xs text-muted-foreground">
                  Updated: {formatDate(price.lastUpdated)}
                </p>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Tabs for History and Affected Products */}
      {selectedMetal && (
        <Tabs defaultValue="history" className="space-y-4">
          <TabsList>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Price History
            </TabsTrigger>
            <TabsTrigger value="affected" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Affected Products
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>
                  {metalDisplayConfig[selectedMetal]?.name || selectedMetal} Price History
                </CardTitle>
                <CardDescription>Recent price changes and updates</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No price history available
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Change</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Updated By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((entry) => (
                        <TableRow key={entry._id}>
                          <TableCell>{formatDate(entry.createdAt)}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(entry.pricePerGram)}
                          </TableCell>
                          <TableCell>
                            {entry.changePercent !== undefined && (
                              <div
                                className={`flex items-center gap-1 ${
                                  entry.changePercent >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {entry.changePercent >= 0 ? (
                                  <TrendingUp className="h-4 w-4" />
                                ) : (
                                  <TrendingDown className="h-4 w-4" />
                                )}
                                {Math.abs(entry.changePercent).toFixed(2)}%
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{entry.source}</Badge>
                          </TableCell>
                          <TableCell>{entry.updatedBy}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="affected">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Affected Products</CardTitle>
                    <CardDescription>
                      Products that will be affected by price changes to{" "}
                      {metalDisplayConfig[selectedMetal]?.name || selectedMetal}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => bulkRecalculate(selectedMetal)}
                    disabled={isBulkRecalculating}
                  >
                    {isBulkRecalculating ? "Recalculating..." : "Recalculate All"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingAffected ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : affectedProducts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No products affected
                  </p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Product Name</TableHead>
                          <TableHead>Pricing Mode</TableHead>
                          <TableHead>Current Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {affectedProducts.map((product: any) => (
                          <TableRow key={product._id}>
                            <TableCell className="font-mono">{product.skuNo}</TableCell>
                            <TableCell>{product.productTitle}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  product.pricingMode === "STATIC_PRICE"
                                    ? "secondary"
                                    : "default"
                                }
                              >
                                {product.pricingMode}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(product.calculatedPrice || 0)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {(affectedData?.data?.total || affectedData?.total) > 10 && (
                      <p className="text-sm text-muted-foreground text-center mt-4">
                        Showing 10 of {(affectedData?.data?.total || affectedData?.total)} affected products
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Info Alert */}
      <Alert className="bg-blue-50 border-blue-100">
        <AlertCircle className="h-4 w-4 text-blue-700" />
        <AlertTitle className="text-blue-700">Multi-Metal Pricing System</AlertTitle>
        <AlertDescription className="text-blue-600">
          <p className="mb-2">
            This dashboard manages prices for all supported metals. Each product is linked to
            a specific metal type through its material hierarchy.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Gold 24K/22K:</strong> Used for gold jewelry products
            </li>
            <li>
              <strong>Silver 999/925:</strong> Used for silver jewelry (999 = pure, 925 =
              sterling)
            </li>
            <li>
              <strong>Platinum:</strong> Used for platinum jewelry products
            </li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default MetalPricingDashboard;
