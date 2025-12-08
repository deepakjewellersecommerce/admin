import { useState, useEffect } from "react";
import { useGetLoyaltyProgram, useUpdateLoyaltyProgram } from "@/lib/react-query/loyalty-query";
import LoadingScreen from "../common/loading-screen";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { toast } from "sonner";
import { Save, Settings, Gift, Award } from "lucide-react";

interface LoyaltyProgram {
  _id?: string;
  name: string;
  pointsPerRupee: number;
  isActive: boolean;
  tiers: {
    name: string;
    minPoints: number;
    benefits: {
      discountPercentage: number;
      freeShipping: boolean;
      earlyAccess: boolean;
      birthdayBonus: number;
    };
  }[];
  redemptionRules: {
    minPointsToRedeem: number;
    pointsToRupeeRatio: number;
    maxRedemptionPercentage: number;
  };
}

const defaultProgram: LoyaltyProgram = {
  name: "Silver Rewards",
  pointsPerRupee: 1,
  isActive: true,
  tiers: [
    {
      name: "Bronze",
      minPoints: 0,
      benefits: {
        discountPercentage: 0,
        freeShipping: false,
        earlyAccess: false,
        birthdayBonus: 0,
      },
    },
    {
      name: "Silver",
      minPoints: 500,
      benefits: {
        discountPercentage: 5,
        freeShipping: true,
        earlyAccess: false,
        birthdayBonus: 100,
      },
    },
    {
      name: "Gold",
      minPoints: 2000,
      benefits: {
        discountPercentage: 10,
        freeShipping: true,
        earlyAccess: true,
        birthdayBonus: 250,
      },
    },
    {
      name: "Platinum",
      minPoints: 5000,
      benefits: {
        discountPercentage: 15,
        freeShipping: true,
        earlyAccess: true,
        birthdayBonus: 500,
      },
    },
  ],
  redemptionRules: {
    minPointsToRedeem: 100,
    pointsToRupeeRatio: 10,
    maxRedemptionPercentage: 50,
  },
};

const LoyaltyProgramSettings = () => {
  const { data, isLoading, isSuccess } = useGetLoyaltyProgram();
  const updateMutation = useUpdateLoyaltyProgram();

  const [program, setProgram] = useState<LoyaltyProgram>(defaultProgram);

  useEffect(() => {
    if (isSuccess && data?.data?.data?.program) {
      setProgram(data.data.data.program);
    }
  }, [isSuccess, data]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(program);
      toast.success("Loyalty program settings updated successfully!");
    } catch (error) {
      toast.error("Failed to update loyalty program settings");
      console.error(error);
    }
  };

  const updateTier = (index: number, field: string, value: unknown) => {
    setProgram((prev) => {
      const newTiers = [...prev.tiers];
      if (field.includes(".")) {
        const [parent, child] = field.split(".");
        (newTiers[index] as any)[parent][child] = value;
      } else {
        (newTiers[index] as any)[field] = value;
      }
      return { ...prev, tiers: newTiers };
    });
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <section className="">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl tracking-wide">Loyalty Program Settings</h2>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>
              Configure the basic loyalty program settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Program Name</Label>
                <Input
                  id="name"
                  value={program.name}
                  onChange={(e) =>
                    setProgram((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Silver Rewards"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pointsPerRupee">Points Per ₹1 Spent</Label>
                <Input
                  id="pointsPerRupee"
                  type="number"
                  value={program.pointsPerRupee}
                  onChange={(e) =>
                    setProgram((prev) => ({
                      ...prev,
                      pointsPerRupee: Number(e.target.value),
                    }))
                  }
                  placeholder="1"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={program.isActive}
                onCheckedChange={(checked) =>
                  setProgram((prev) => ({ ...prev, isActive: checked }))
                }
              />
              <Label htmlFor="isActive">Program Active</Label>
            </div>
          </CardContent>
        </Card>

        {/* Redemption Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Redemption Rules
            </CardTitle>
            <CardDescription>
              Configure how customers can redeem their points
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minPointsToRedeem">Minimum Points to Redeem</Label>
                <Input
                  id="minPointsToRedeem"
                  type="number"
                  value={program.redemptionRules.minPointsToRedeem}
                  onChange={(e) =>
                    setProgram((prev) => ({
                      ...prev,
                      redemptionRules: {
                        ...prev.redemptionRules,
                        minPointsToRedeem: Number(e.target.value),
                      },
                    }))
                  }
                  placeholder="100"
                />
                <p className="text-xs text-gray-500">
                  Minimum points required to start redemption
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pointsToRupeeRatio">Points to ₹1 Ratio</Label>
                <Input
                  id="pointsToRupeeRatio"
                  type="number"
                  value={program.redemptionRules.pointsToRupeeRatio}
                  onChange={(e) =>
                    setProgram((prev) => ({
                      ...prev,
                      redemptionRules: {
                        ...prev.redemptionRules,
                        pointsToRupeeRatio: Number(e.target.value),
                      },
                    }))
                  }
                  placeholder="10"
                />
                <p className="text-xs text-gray-500">
                  How many points equal ₹1 discount
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxRedemptionPercentage">
                  Max Redemption % of Order
                </Label>
                <Input
                  id="maxRedemptionPercentage"
                  type="number"
                  value={program.redemptionRules.maxRedemptionPercentage}
                  onChange={(e) =>
                    setProgram((prev) => ({
                      ...prev,
                      redemptionRules: {
                        ...prev.redemptionRules,
                        maxRedemptionPercentage: Number(e.target.value),
                      },
                    }))
                  }
                  placeholder="50"
                />
                <p className="text-xs text-gray-500">
                  Max % of order that can be paid with points
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tiers Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Membership Tiers
            </CardTitle>
            <CardDescription>
              Configure tier levels and their benefits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {program.tiers.map((tier, index) => (
                <Card key={tier.name} className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          tier.name === "Bronze"
                            ? "bg-orange-400"
                            : tier.name === "Silver"
                            ? "bg-gray-400"
                            : tier.name === "Gold"
                            ? "bg-yellow-400"
                            : "bg-purple-400"
                        }`}
                      />
                      {tier.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Minimum Points Required</Label>
                      <Input
                        type="number"
                        value={tier.minPoints}
                        onChange={(e) =>
                          updateTier(index, "minPoints", Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Discount Percentage (%)</Label>
                      <Input
                        type="number"
                        value={tier.benefits.discountPercentage}
                        onChange={(e) =>
                          updateTier(
                            index,
                            "benefits.discountPercentage",
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Birthday Bonus Points</Label>
                      <Input
                        type="number"
                        value={tier.benefits.birthdayBonus}
                        onChange={(e) =>
                          updateTier(
                            index,
                            "benefits.birthdayBonus",
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={tier.benefits.freeShipping}
                        onCheckedChange={(checked) =>
                          updateTier(index, "benefits.freeShipping", checked)
                        }
                      />
                      <Label>Free Shipping</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={tier.benefits.earlyAccess}
                        onCheckedChange={(checked) =>
                          updateTier(index, "benefits.earlyAccess", checked)
                        }
                      />
                      <Label>Early Access to Sales</Label>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default LoyaltyProgramSettings;
