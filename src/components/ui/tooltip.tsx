"use client"

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

const Tooltip = ({ children, content }: { children: React.ReactNode; content: React.ReactNode }) => {
  return (
    <TooltipPrimitive.Provider delayDuration={150}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="top"
            align="center"
            className={cn(
              "z-50 rounded-md bg-gray-900 text-white px-2 py-1 text-xs shadow-lg",
            )}
            sideOffset={6}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-current text-gray-900" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};

export { Tooltip };
