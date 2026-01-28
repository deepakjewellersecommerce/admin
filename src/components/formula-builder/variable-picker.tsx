import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import { Variable } from "lucide-react";

interface VariableInfo {
  key: string;
  label: string;
  description: string;
  unit?: string;
}

interface VariablePickerProps {
  onSelectVariable: (variable: string) => void;
  disabled?: boolean;
}

const variables: VariableInfo[] = [
  {
    key: "grossWeight",
    label: "Gross Weight",
    description: "Total weight of the jewelry piece including stones",
    unit: "grams",
  },
  {
    key: "netWeight",
    label: "Net Weight",
    description: "Weight of gold/metal only (excluding stones)",
    unit: "grams",
  },
  {
    key: "metalRate",
    label: "Metal Rate",
    description: "Current price per gram of the metal",
    unit: "₹/gram",
  },
  {
    key: "metalCost",
    label: "Metal Cost",
    description: "Auto-calculated: netWeight × metalRate",
    unit: "₹",
  },
  {
    key: "subtotal",
    label: "Subtotal",
    description: "Sum of all previous price components",
    unit: "₹",
  },
];

export function VariablePicker({ onSelectVariable, disabled = false }: VariablePickerProps) {
  return (
    <Select
      onValueChange={(value) => {
        onSelectVariable(value);
      }}
      disabled={disabled}
    >
      <Tooltip content={<p className="text-xs">Select a variable to add to formula</p>}>
        <SelectTrigger className="w-[180px]">
          <Variable className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Add Variable" />
        </SelectTrigger>
      </Tooltip>

      <SelectContent>
          {variables.map((variable) => (
            <SelectItem key={variable.key} value={variable.key}>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{variable.label}</span>
                  {variable.unit && (
                    <span className="text-xs text-muted-foreground">({variable.unit})</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{variable.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
    </Select>
  );
}
