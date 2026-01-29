import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface NumberInputInlineProps {
  onAdd: (value: string) => void;
  onCancel: () => void;
  autoFocus?: boolean;
}

export function NumberInputInline({
  onAdd,
  onCancel,
  autoFocus = true,
}: NumberInputInlineProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const validateNumber = (input: string): boolean => {
    if (!input.trim()) {
      setError("Enter a number");
      return false;
    }

    const num = parseFloat(input);
    if (isNaN(num)) {
      setError("Invalid number");
      return false;
    }

    if (!isFinite(num)) {
      setError("Number too large");
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = () => {
    if (validateNumber(value)) {
      onAdd(value);
      setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    // Clear error on change
    if (error) {
      setError("");
    }
  };

  return (
    <div className="inline-flex items-center gap-1 bg-white border rounded-md p-1 shadow-sm">
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Don't auto-cancel on blur to allow clicking buttons
          setTimeout(() => {
            if (value && !error) {
              handleSubmit();
            }
          }, 150);
        }}
        placeholder="0.00"
        className={`
          w-24 h-8 text-sm font-mono border-0 focus-visible:ring-0 focus-visible:ring-offset-0
          ${error ? "text-red-500" : ""}
        `}
      />
      
      <div className="flex gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 hover:bg-green-100 hover:text-green-700"
          onClick={handleSubmit}
          disabled={!!error}
        >
          <Check className="h-4 w-4" />
        </Button>
        
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 hover:bg-red-100 hover:text-red-700"
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {error && (
        <div className="absolute top-full left-0 mt-1 text-xs text-red-500 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}
