import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle, Hash, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { FormulaChip } from "./formula-chip";
import { QuickStartTemplates } from "./quick-start-templates";
import { VariablePicker } from "./variable-picker";
import { OperatorPanel } from "./operator-panel";
import { NumberInputInline } from "./number-input-inline";
import { FormulaBreakdownAccordion } from "./formula-breakdown-accordion";

interface FormulaBuilderProps {
  value?: string | null;
  formulaChips?: string[];
  onChange: (formula: string, chips: string[]) => void;
  validationResult?: {
    valid: boolean;
    errors: string[];
    warnings: string[];
    testResult?: number;
  } | null;
  isValidating?: boolean;
  showBreakdown?: boolean;
  breakdownSteps?: any[];
  testValues?: {
    grossWeight?: number;
    netWeight?: number;
    metalRate?: number;
    metalCost?: number;
    subtotal?: number;
  };
  disabled?: boolean;
}

export function FormulaBuilder({
  formulaChips = [],
  onChange,
  validationResult,
  isValidating = false,
  showBreakdown = false,
  breakdownSteps = [],
  testValues,
  disabled = false,
}: FormulaBuilderProps) {
  const [chips, setChips] = useState<string[]>(formulaChips || []);
  const [showNumberInput, setShowNumberInput] = useState(false);

  useEffect(() => {
    setChips(formulaChips || []);
  }, [formulaChips]);

  const getChipType = (chip: string): "variable" | "operator" | "number" | "parenthesis" | "error" => {
    if (["grossWeight", "netWeight", "metalRate", "metalCost", "subtotal"].includes(chip)) {
      return "variable";
    }
    if (["+", "-", "×", "÷"].includes(chip)) {
      return "operator";
    }
    if (chip === "(" || chip === ")") {
      return "parenthesis";
    }
    if (!isNaN(parseFloat(chip))) {
      return "number";
    }
    return "error";
  };

  const chipsToFormula = (chipArray: string[]): string => {
    return chipArray.join(" ");
  };

  const updateFormula = (newChips: string[]) => {
    setChips(newChips);
    const formula = chipsToFormula(newChips);
    onChange(formula, newChips);
  };

  const handleAddChip = (chip: string) => {
    const newChips = [...chips];

    // Auto-close parentheses
    if (chip === "(") {
      newChips.push(chip);
      newChips.push(")");
    } else {
      newChips.push(chip);
    }

    updateFormula(newChips);
  };

  const handleDeleteChip = (index: number) => {
    const newChips = chips.filter((_, i) => i !== index);
    updateFormula(newChips);
  };

  const handleAddNumber = (number: string) => {
    handleAddChip(number);
    setShowNumberInput(false);
  };

  const handleSelectTemplate = (templateChips: string[]) => {
    updateFormula(templateChips);
  };

  const handleClearAll = () => {
    updateFormula([]);
  };

  return (
    <div className="space-y-4">
      {/* Quick Start Templates */}
      {chips.length === 0 && !disabled && (
        <QuickStartTemplates onSelectTemplate={handleSelectTemplate} />
      )}

      {/* Formula Chip Display */}
      <Card className={chips.length === 0 ? "border-dashed border-2" : ""}>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2 min-h-[60px]">
            {chips.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground w-full justify-center">
                <Plus className="h-4 w-4" />
                <span className="text-sm">
                  {disabled ? "No formula configured" : "Add variables and operators to build your formula"}
                </span>
              </div>
            ) : (
              <>
                {chips.map((chip, index) => (
                  <FormulaChip
                    key={`${chip}-${index}`}
                    value={chip}
                    index={index}
                    type={getChipType(chip)}
                    onDelete={handleDeleteChip}
                    isEditable={!disabled}
                  />
                ))}
              </>
            )}

            {/* Inline Number Input */}
            {showNumberInput && (
              <NumberInputInline
                onAdd={handleAddNumber}
                onCancel={() => setShowNumberInput(false)}
              />
            )}
          </div>

          {chips.length > 0 && !disabled && (
            <div className="flex justify-between items-center mt-3 pt-3 border-t">
              <div className="text-xs text-muted-foreground font-mono">
                {chipsToFormula(chips)}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Input Controls */}
      {!disabled && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <VariablePicker onSelectVariable={handleAddChip} />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNumberInput(!showNumberInput)}
              className="flex items-center gap-2"
            >
              <Hash className="h-4 w-4" />
              Add Number
            </Button>
          </div>

          <OperatorPanel onAddOperator={handleAddChip} />
        </div>
      )}

      {/* Validation Feedback */}
      {isValidating && (
        <Skeleton className="h-12 w-full" />
      )}

      {validationResult && !isValidating && (
        <>
          {validationResult.valid ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="flex items-center justify-between">
                  <span>Formula is valid</span>
                  {validationResult.testResult !== undefined && (
                    <span className="font-semibold">
                      Test Result: ₹ {validationResult.testResult.toFixed(2)}
                    </span>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="space-y-1">
                  {validationResult.errors.map((error, index) => (
                    <div key={index} className="text-sm">
                      • {error}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {validationResult.warnings && validationResult.warnings.length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <div className="space-y-1">
                  {validationResult.warnings.map((warning, index) => (
                    <div key={index} className="text-sm">
                      • {warning}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Step-by-Step Breakdown */}
      {showBreakdown && breakdownSteps && breakdownSteps.length > 0 && (
        <FormulaBreakdownAccordion
          steps={breakdownSteps}
          finalResult={validationResult?.testResult || 0}
          testValues={testValues}
        />
      )}
    </div>
  );
}
