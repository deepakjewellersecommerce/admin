import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function getLinkFromJson(data: any): string {
  // Extract characters from keys "0" to "168" dynamically
  const linkChars = Object.keys(data)
    .filter((key) => !isNaN(Number(key)))
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => data[key])

  // Concatenate the characters to form the link
  const link = linkChars.join("")

  return link
}
// Size options grouped by jewelry category
export const sizeOptionsByCategory: Record<string, { value: string; label: string }[]> = {
  ring: [
    { value: "5", label: "Ring 5" },
    { value: "6", label: "Ring 6" },
    { value: "7", label: "Ring 7" },
    { value: "8", label: "Ring 8" },
    { value: "9", label: "Ring 9" },
    { value: "10", label: "Ring 10" },
    { value: "11", label: "Ring 11" },
    { value: "12", label: "Ring 12" },
    { value: "13", label: "Ring 13" },
  ],
  bangle: [
    { value: "2-2", label: "Bangle 2.2" },
    { value: "2-4", label: "Bangle 2.4" },
    { value: "2-6", label: "Bangle 2.6" },
    { value: "2-8", label: "Bangle 2.8" },
  ],
  chain: [
    { value: "16in", label: "16 inch" },
    { value: "18in", label: "18 inch" },
    { value: "20in", label: "20 inch" },
    { value: "22in", label: "22 inch" },
    { value: "24in", label: "24 inch" },
  ],
  generic: [
    { value: "Free", label: "Free Size" },
    { value: "Adjustable", label: "Adjustable" },
  ],
};

// Keywords in item/category names that map to size categories
const ITEM_TO_SIZE_MAP: Record<string, string[]> = {
  ring: ["ring", "toe ring"],
  bangle: ["bangle", "bracelet", "kada"],
  chain: ["chain", "necklace", "mangalsutra", "pendant", "haar", "mala"],
};

/**
 * Returns filtered size options based on item type name.
 * Falls back to all sizes if no match is found.
 */
export function getSizeOptionsForItem(itemName?: string): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];

  if (itemName) {
    const lower = itemName.toLowerCase();
    for (const [sizeCategory, keywords] of Object.entries(ITEM_TO_SIZE_MAP)) {
      if (keywords.some((kw) => lower.includes(kw))) {
        options.push(...(sizeOptionsByCategory[sizeCategory] || []));
      }
    }
  }

  // If no match or no itemName, show all sizes
  if (options.length === 0) {
    options.push(
      ...sizeOptionsByCategory.ring,
      ...sizeOptionsByCategory.bangle,
      ...sizeOptionsByCategory.chain,
    );
  }

  // Always include generic + custom
  options.push(...sizeOptionsByCategory.generic);
  options.push({ value: "Custom", label: "Custom" });

  return options;
}

// Flat list of all sizes (for backward compatibility)
export const sizeOptions = [
  ...sizeOptionsByCategory.ring,
  ...sizeOptionsByCategory.bangle,
  ...sizeOptionsByCategory.chain,
  ...sizeOptionsByCategory.generic,
  { value: "Custom", label: "Custom" },
];



