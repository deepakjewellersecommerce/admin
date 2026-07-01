import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBulkUpdatePricing } from "@/lib/react-query/product-query";
import { useGetMetalPrice, useUpdateMetalPrice, useFetchMetalPrice } from "@/lib/react-query/metal-price-query";
import { AlertCircle, RefreshCcw, TrendingUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import LoadingScreen from "@/components/common/loading-screen";
import { toast } from "sonner";

const DynamicPricingPage = () => {
  const [silverRateInput, setSilverRateInput] = useState("");
  const { mutate: updateAllPrices, isPending: isUpdatingPrices } = useBulkUpdatePricing();
  const { data: silverRateData, isLoading: isLoadingSilverRate } = useGetMetalPrice("SILVER_925");
  const { mutate: fetchSilverPrice, isPending: isFetchingSilverPrice } = useFetchMetalPrice();
  const { mutate: updateSilverRate, isPending: isUpdatingSilverRate } = useUpdateMetalPrice();
  
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Extract current silver rate from API response
  const currentSilverRate = silverRateData?.data?.price?.pricePerGram || silverRateData?.price?.pricePerGram || "";
  
  // Update the input when the API data is loaded
  useEffect(() => {
    if (currentSilverRate) {
      setSilverRateInput(String(currentSilverRate));
    }
  }, [currentSilverRate]);

  const handleUpdatePrices = () => {
    updateAllPrices(undefined, {
      onSuccess: () => {
        setLastUpdated(new Date().toLocaleString());
      }
    });
  };
  
  const handleFetchCurrentRate = () => {
    fetchSilverPrice("SILVER_925", {
      onSuccess: (response: any) => {
        const fetchedPrice = response?.data?.price?.pricePerGram || response?.price?.pricePerGram;
        if (fetchedPrice) {
          setSilverRateInput(String(fetchedPrice));
          toast.success("Fetched current silver rate successfully!");
        } else {
          toast.error("Could not retrieve rate from response");
        }
      }
    });
  };
  
  const handleApplyRate = () => {
    if (silverRateInput) {
      updateSilverRate(
        { metalType: "SILVER_925", pricePerGram: Number(silverRateInput) },
        {
          onSuccess: () => {
            // After updating the silver rate, update product prices
            updateAllPrices();
            setLastUpdated(new Date().toLocaleString());
          }
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      {isLoadingSilverRate ? (
        <LoadingScreen />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Dynamic Pricing Management</h1>
            <Button 
              onClick={handleUpdatePrices} 
              disabled={isUpdatingPrices}
              className="flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              {isUpdatingPrices ? "Updating..." : "Update All Prices"}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Current Silver Rate
                </CardTitle>
                <CardDescription>
                  Enter the current market rate for silver
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="silverRate">Silver Rate per Gram (₹)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="silverRate"
                      placeholder="Enter current silver rate"
                      type="number"
                      value={silverRateInput}
                      onChange={(e) => setSilverRateInput(e.target.value)}
                    />
                    <Button variant="outline" onClick={handleFetchCurrentRate} disabled={isFetchingSilverPrice}>
                      {isFetchingSilverPrice ? "Fetching..." : "Fetch"}
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={handleApplyRate} 
                  disabled={!silverRateInput || isUpdatingSilverRate}
                >
                  {isUpdatingSilverRate ? "Applying..." : "Apply Rate"}
                </Button>
              </CardFooter>
            </Card>
        
            <Card>
              <CardHeader>
                <CardTitle>Pricing Formula</CardTitle>
                <CardDescription>
                  How product prices are calculated
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gray-50 rounded-md text-sm font-mono">
                  <p className="mb-2">Final Price = (Silver Weight × Silver Rate) + Labor + GST</p>
                  <hr className="my-2" />
                  <p>Where:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Labor = Labor % × Silver Cost</li>
                    <li>GST = GST % × (Silver Cost + Labor)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Price Update History</CardTitle>
                <CardDescription>
                  Recent price update events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lastUpdated ? (
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Last updated:</span>
                      <span className="font-medium">{lastUpdated}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Silver rate used:</span>
                      <span className="font-medium">₹{currentSilverRate}/gram</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Products updated:</span>
                      <span className="font-medium">All</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No recent updates</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Alert className="bg-blue-50 border-blue-100">
            <AlertCircle className="h-4 w-4 text-blue-700" />
            <AlertTitle className="text-blue-700">How dynamic pricing works</AlertTitle>
            <AlertDescription className="text-blue-600">
              <p className="mb-2">
                Each product with dynamic pricing enabled will have its price automatically recalculated 
                based on the current silver rate, the product's silver weight, and your labor percentage settings.
              </p>
              <p>
                This ensures your jewelry prices stay current with market fluctuations in precious metal prices.
              </p>
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
};

export default DynamicPricingPage;
