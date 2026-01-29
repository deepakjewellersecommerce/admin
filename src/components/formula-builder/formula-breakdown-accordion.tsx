import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, ArrowRight } from "lucide-react";

interface CalculationStep {
  step: number;
  description: string;
  expression: string;
  result: number;
  substitution?: string;
}

interface FormulaBreakdownAccordionProps {
  steps: CalculationStep[];
  finalResult: number;
  testValues?: {
    grossWeight?: number;
    netWeight?: number;
    metalRate?: number;
    metalCost?: number;
    subtotal?: number;
  };
}

export function FormulaBreakdownAccordion({
  steps,
  finalResult,
  testValues,
}: FormulaBreakdownAccordionProps) {
  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="h-4 w-4 text-blue-600" />
          <h4 className="text-sm font-semibold text-blue-900">
            Step-by-Step Calculation
          </h4>
        </div>

        {testValues && (
          <div className="mb-3 p-2 bg-white rounded border border-blue-200">
            <p className="text-xs text-muted-foreground mb-1">Test Values:</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs font-mono">
              {Object.entries(testValues).map(([key, value]) => (
                <div key={key}>
                  <span className="text-muted-foreground">{key}:</span>{" "}
                  <span className="font-semibold">
                    {typeof value === "number" ? value.toFixed(2) : value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Accordion type="single" collapsible defaultValue="item-0">
          {steps.map((step, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="py-2 hover:no-underline">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="h-5 px-2 text-xs">
                    Step {step.step}
                  </Badge>
                  <span className="font-medium">{step.description}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pl-4 space-y-2 text-sm">
                  {step.substitution && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Substitute:</span>
                      <code className="bg-white px-2 py-1 rounded text-xs border">
                        {step.substitution}
                      </code>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Expression:</span>
                    <code className="bg-white px-2 py-1 rounded text-xs border font-mono">
                      {step.expression}
                    </code>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <Badge className="bg-green-600 text-white">
                      {step.result.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-green-900">Final Result:</span>
            <Badge className="bg-green-600 text-white text-base px-4 py-1">
              ₹ {finalResult.toFixed(2)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
