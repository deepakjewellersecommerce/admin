import { ArrowUpRight, ArrowDownRight, Minus, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const ChangeIndicator = ({ value }: { value?: number }) => {
  if (value === undefined || value === null) return null;
  const isPositive = value > 0;
  const isZero = value === 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isZero ? "text-gray-400" : isPositive ? "text-green-600" : "text-red-600"}`}>
      {isZero ? <Minus className="h-3 w-3" /> : isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(value)}%
    </span>
  );
};

export const MetricSkeleton = () => (
  <Card>
    <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
    <CardContent><Skeleton className="h-7 w-32" /></CardContent>
  </Card>
);

export const InfoTip = ({ text }: { text: string }) => (
  <Tooltip content={<span className="max-w-[220px] block">{text}</span>}>
    <span><HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help inline-block ml-1" /></span>
  </Tooltip>
);
