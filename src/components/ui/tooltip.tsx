"use client"

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  /** "sm" = default dark pill, "lg" = wide light card for rich content */
  size?: "sm" | "lg";
  side?: "top" | "bottom" | "left" | "right";
}

const Tooltip = ({ children, content, size = "sm", side = "top" }: TooltipProps) => {
  return (
    <TooltipPrimitive.Provider delayDuration={150}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align="center"
            sideOffset={8}
            className={cn(
              "z-50 shadow-xl animate-in fade-in-0 zoom-in-95",
              size === "sm"
                ? "rounded-md bg-gray-900 text-white px-2 py-1 text-xs"
                : "rounded-lg border bg-white text-foreground p-0 w-72"
            )}
          >
            {content}
            {size === "sm" && (
              <TooltipPrimitive.Arrow className="fill-gray-900" />
            )}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};

export { Tooltip };
