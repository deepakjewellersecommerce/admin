import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useSwipeable } from "react-swipeable";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface FormulaChipProps {
  value: string;
  index: number;
  type: "variable" | "operator" | "number" | "parenthesis" | "error";
  onDelete: (index: number) => void;
  isEditable?: boolean;
}

export function FormulaChip({
  value,
  index,
  type,
  onDelete,
  isEditable = true,
}: FormulaChipProps) {
  const [showDelete, setShowDelete] = useState(false);
  const [isSwipedLeft, setIsSwipedLeft] = useState(false);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (isEditable) {
        setIsSwipedLeft(true);
        setTimeout(() => {
          onDelete(index);
        }, 200);
      }
    },
    trackMouse: false,
    trackTouch: true,
  });

  const getChipColor = () => {
    switch (type) {
      case "variable":
        return "bg-blue-500/10 text-blue-700 border-blue-300 hover:bg-blue-500/20";
      case "operator":
        return "bg-gray-400/10 text-gray-700 border-gray-300 hover:bg-gray-400/20";
      case "number":
        return "bg-green-500/10 text-green-700 border-green-300 hover:bg-green-500/20";
      case "parenthesis":
        return "bg-purple-500/10 text-purple-700 border-purple-300 hover:bg-purple-500/20";
      case "error":
        return "bg-red-500/10 text-red-700 border-red-400 hover:bg-red-500/20";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const handleDelete = () => {
    if (isEditable) {
      onDelete(index);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, x: -20 }}
        animate={{
          opacity: isSwipedLeft ? 0 : 1,
          scale: isSwipedLeft ? 0.8 : 1,
          x: isSwipedLeft ? -100 : 0,
        }}
        exit={{ opacity: 0, scale: 0.8, x: -100 }}
        transition={{ duration: 0.2 }}
        {...handlers}
        onMouseEnter={() => setShowDelete(true)}
        onMouseLeave={() => setShowDelete(false)}
        className="relative inline-flex items-center"
      >
        <Badge
          variant="outline"
          className={`
            ${getChipColor()}
            px-3 py-1.5 text-sm font-medium border
            transition-all duration-200 select-none
            ${isEditable ? "cursor-pointer" : "cursor-default"}
          `}
        >
          <span className="font-mono">{value}</span>
          
          {/* Desktop: X button on hover */}
          {isEditable && (
            <Button
              size="icon"
              variant="ghost"
              className={`
                ml-1.5 h-4 w-4 p-0 rounded-full
                transition-opacity duration-200
                ${showDelete ? "opacity-100" : "opacity-0"}
                hover:bg-red-500/20
              `}
              onClick={handleDelete}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </Badge>

        {/* Mobile: Swipe indicator */}
        {isEditable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isSwipedLeft ? 1 : 0 }}
            className="absolute inset-0 bg-red-500/20 rounded flex items-center justify-end px-2"
          >
            <X className="h-4 w-4 text-red-700" />
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
