import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { InfoTip } from "@/lib/analytics-utils";

type Props = {
  title: string;
  Icon: LucideIcon;
  value: string;
  tooltip?: string;
};

const DashboardCard = ({ title, value, Icon, tooltip }: Props) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}{tooltip && <InfoTip text={tooltip} />}</CardTitle>
        <Icon/>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
