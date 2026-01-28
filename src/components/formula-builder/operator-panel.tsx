import { Button } from "@/components/ui/button";
import { Plus, Minus, X, Divide } from "lucide-react";

interface OperatorPanelProps {
  onAddOperator: (operator: string) => void;
}

export function OperatorPanel({ onAddOperator }: OperatorPanelProps) {
  const operators = [
    { symbol: "+", label: "Add", icon: Plus },
    { symbol: "-", label: "Subtract", icon: Minus },
    { symbol: "×", label: "Multiply", icon: X },
    { symbol: "÷", label: "Divide", icon: Divide },
    { symbol: "(", label: "Open Parenthesis", icon: null },
    { symbol: ")", label: "Close Parenthesis", icon: null },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {operators.map((op) => (
        <Button
          key={op.symbol}
          variant="outline"
          size="sm"
          onClick={() => onAddOperator(op.symbol)}
          className="flex items-center gap-1 min-w-[80px]"
          title={op.label}
        >
          {op.icon && <op.icon className="h-3 w-3" />}
          <span className="font-mono font-semibold">{op.symbol}</span>
        </Button>
      ))}
    </div>
  );
}
