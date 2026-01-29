import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  chips: string[];
  formula: string;
}

interface QuickStartTemplatesProps {
  onSelectTemplate: (chips: string[], formula: string) => void;
}

const templates: Template[] = [
  {
    id: "percentage-metal-cost",
    name: "5% of Metal Cost",
    description: "Common making charge calculation",
    chips: ["metalCost", "×", "0.05"],
    formula: "metalCost × 0.05",
  },
  {
    id: "fixed-per-gram",
    name: "Fixed Per Gram",
    description: "Fixed rate multiplied by weight",
    chips: ["grossWeight", "×", "50"],
    formula: "grossWeight × 50",
  },
  {
    id: "percentage-subtotal",
    name: "10% of Subtotal",
    description: "Percentage of previous components",
    chips: ["subtotal", "×", "0.10"],
    formula: "subtotal × 0.10",
  },
  {
    id: "weight-difference",
    name: "Weight Difference",
    description: "Charge based on weight difference",
    chips: ["(", "grossWeight", "-", "netWeight", ")", "×", "metalRate"],
    formula: "(grossWeight - netWeight) × metalRate",
  },
];

export function QuickStartTemplates({ onSelectTemplate }: QuickStartTemplatesProps) {
  return (
    <Card className="border-dashed border-2 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <CardTitle className="text-base">Quick Start Templates</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Click a template to get started, then modify numbers as needed
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {templates.map((template) => (
          <Button
            key={template.id}
            variant="outline"
            className="h-auto flex flex-col items-start p-3 hover:bg-white hover:shadow-sm transition-all"
            onClick={() => onSelectTemplate(template.chips, template.formula)}
          >
            <span className="font-semibold text-sm text-left">{template.name}</span>
            <span className="text-xs text-muted-foreground font-mono mt-1">
              {template.formula}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {template.description}
            </span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
