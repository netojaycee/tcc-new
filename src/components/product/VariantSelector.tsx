"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { COLOR_HEX_MAP } from "@/lib/utils/color";
import {
  SizeGuideModal,
  type SizeGuideData,
  type SizeTable,
  type SizeTableMeasurement,
} from "./SizeGuideModal";

// Re-export types for convenience
export type { SizeGuideData, SizeTable, SizeTableMeasurement };


// Helper function to get hex color - prioritizes color_code over name-based lookup
function getColorHex(color: string, colorCode?: string): string {
  // Use color_code directly if available
  if (colorCode && colorCode.trim() !== "") {
    return colorCode;
  }

  // Fall back to looking up color name in COLOR_HEX_MAP
  return (
    COLOR_HEX_MAP.find(
      (c: { name: string; hex: string }) =>
        c.name.toLowerCase() === color?.toLowerCase()
    )?.hex || "#CCCCCC"
  );
}

// Helper function to get background style for color box with split color support
function getColorBoxStyle(
  color: string,
  colorCode?: string,
  colorCode2?: string,
): React.CSSProperties {
  const color1 = getColorHex(color, colorCode);

  // If color_code2 exists, create a split (top/bottom) gradient
  if (colorCode2 && colorCode2.trim() !== "") {
    const color2 = colorCode2;
    return {
      background: `linear-gradient(to bottom, ${color1} 50%, ${color2} 50%)`,
    };
  }

  // Otherwise, solid color
  return {
    backgroundColor: color1,
  };
}

// Optimization 1: Image preloader utility
function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new (globalThis.Image as any)();
    img.onload = () => resolve();
    img.onerror = () => resolve(); // Resolve even on error to avoid blocking
    img.src = src;
  });
}

// Optimization 3: Simple debounce helper
function useDebounce<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delayMs]);

  return debouncedValue;
}

export interface Variant {
  id: number;
  sku?: string;
  name: string;
  size: string | null;
  color: string | null;
  color_code?: string | null; // Hex color code from Printful (e.g., "#14191e")
  color_code2?: string | null; // Second color code for split color display
  variant_id?: number;
  image?: string;
  files?: Array<{
    type?: string;
    preview_url?: string;
    url?: string;
  }>;
  product?: {
    image: string;
  };
}

interface VariantSelectorProps {
  variants: Variant[];
  onVariantSelect: (variant: Variant) => void;
  productType?: "store" | "catalog"; // Added to control size guide visibility
  sizeGuideData?: SizeGuideData | null; // Added to pass dynamic size guide data
}

export function VariantSelector({
  variants,
  onVariantSelect,
  productType = "store",
  sizeGuideData,
}: VariantSelectorProps) {
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const isCatalogProduct = productType === "catalog";
  // console.log("Received variants:", variants);
  // console.log("Variants with color:", variants.filter((v) => v.color));
  // console.log(
  //   "Variants without color:",
  //   variants.filter((v) => !v.color),
  // );
  // Optimization 1: Preload all variant images on mount
  useEffect(() => {
    variants.forEach((variant) => {
      if (variant.image) {
        preloadImage(variant.image).catch(() => {
          // Silently handle preload failures
        });
      }
    });
  }, [variants]);

  // Separate variants with colors from those without
  const variantsWithColor = useMemo(
    () => variants.filter((v) => v.color),
    [variants],
  );

  const variantsWithoutColor = useMemo(
    () => variants.filter((v) => !v.color),
    [variants],
  );

  const hasColors = variantsWithColor.length > 0;
  const hasOnlySize = variantsWithoutColor.length > 0 && !hasColors;

  // Group variants by color (only for variants with colors)
  const colorOptions = useMemo(() => {
    const colors = new Map<string, Variant[]>();
    variantsWithColor.forEach((variant) => {
      if (variant.color) {
        if (!colors.has(variant.color)) {
          colors.set(variant.color, []);
        }
        colors.get(variant.color)!.push(variant);
      }
    });
    return colors;
  }, [variantsWithColor]);

  // Get unique colors
  const uniqueColors = useMemo(
    () => Array.from(colorOptions.keys()).filter((color) => color !== null),
    [colorOptions],
  );

  // Initialize with first color and first size of that color
  const initialColor = uniqueColors[0] || null;
  const initialSizeOptions = initialColor
    ? colorOptions.get(initialColor)?.map((v) => v.size).filter((s) => s) || []
    : [];
  const initialSize = initialSizeOptions[0] || null;

  const [selectedColor, setSelectedColor] = useState<string | null>(
    initialColor,
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(initialSize);

  // Optimization 2: Memoize size calculation with useCallback
  const getSizesForColor = useCallback(
    (colorName: string | null) => {
      // If no color selected and we have variants without color, get sizes from those
      if (!colorName && variantsWithoutColor.length > 0) {
        const sizes = new Set<string>();
        variantsWithoutColor.forEach((v) => {
          if (v.size) sizes.add(v.size);
        });
        return Array.from(sizes);
      }

      // If color is selected, get sizes for that color
      if (colorName) {
        const colorVariants = colorOptions.get(colorName) || [];
        const sizes = new Set<string>();
        colorVariants.forEach((v) => {
          if (v.size) sizes.add(v.size);
        });
        return Array.from(sizes);
      }

      return [];
    },
    [colorOptions, variantsWithoutColor],
  );

  // Get sizes for selected color
  const sizeOptions = useMemo(
    () => getSizesForColor(selectedColor),
    [selectedColor, getSizesForColor],
  );

  // Get selected variant
  const selectedVariant = useMemo(() => {
    if (!selectedSize) return null;

    // If no color selected, find in variantsWithoutColor
    if (!selectedColor && variantsWithoutColor.length > 0) {
      return (
        variantsWithoutColor.find((v) => v.size === selectedSize) || null
      );
    }

    // If color selected, find in colorOptions
    if (selectedColor) {
      const colorVariants = colorOptions.get(selectedColor) || [];
      return colorVariants.find((v) => v.size === selectedSize) || null;
    }

    return null;
  }, [selectedColor, selectedSize, colorOptions, variantsWithoutColor]);

  // Optimization 4: Lazy load images for selected color variants only
  // Debounce to avoid excessive preloading during rapid color changes
  const debouncedSelectedColor = useDebounce(selectedColor, 10);

  useEffect(() => {
    if (debouncedSelectedColor) {
      // Preload images only for variants of the selected color
      const colorVariants = colorOptions.get(debouncedSelectedColor) || [];
      colorVariants.forEach((variant) => {
        if (variant.image) {
          preloadImage(variant.image).catch(() => {
            // Silently handle preload failures
          });
        }
      });
    } else if (hasOnlySize && variantsWithoutColor.length > 0) {
      // If only sizes (no color), preload images for those variants
      variantsWithoutColor.forEach((variant) => {
        if (variant.image) {
          preloadImage(variant.image).catch(() => {
            // Silently handle preload failures
          });
        }
      });
    }
  }, [debouncedSelectedColor, colorOptions, variantsWithoutColor, hasOnlySize]);

  // Optimization 3: Debounce variant selection to smooth image transitions
  const debouncedSelectedVariant = useDebounce(selectedVariant, 100);

  // Update size when color changes
  // When color changes, sizeOptions changes, so we need to ensure selectedSize is valid
  // for the new color. selectedSize is intentionally excluded to avoid infinite loops.
  useEffect(() => {
    if (sizeOptions.length > 0 && !sizeOptions.includes(selectedSize || "")) {
      setSelectedSize(sizeOptions[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizeOptions]);

  // Initialize size selection for size-only variants
  useEffect(() => {
    if (hasOnlySize && selectedSize === null && sizeOptions.length > 0) {
      setSelectedSize(sizeOptions[0]);
    }
  }, [hasOnlySize, selectedSize, sizeOptions]);

  // Notify parent when variant is selected (with debounced variant to smooth transitions)
  useEffect(() => {
    if (debouncedSelectedVariant) {
      onVariantSelect(debouncedSelectedVariant);
    }
  }, [debouncedSelectedVariant, onVariantSelect]);

  return (
    <div className="space-y-4 border-b pb-4">
      {/* Color Selection - Only show if variants have colors */}
      {hasColors && (
        <div>
          <label className="text-sm font-semibold text-gray-900 block mb-3">
            Color |{" "}
            {selectedColor && (
              <span className="font-semibold text-gray-500">
                {selectedColor.toLocaleLowerCase()}
              </span>
            )}
          </label>
          <div className="flex flex-wrap gap-3">
            {uniqueColors.map((color) => {
              // Get hex color code from variant's color_code if available, otherwise map from color name
              const firstVariantWithColor = colorOptions.get(color)?.[0];
              const hexColor = getColorHex(color, firstVariantWithColor?.color_code ?? undefined);
              const isSelected = selectedColor === color;
              const colorBoxStyle = getColorBoxStyle(
                color,
                firstVariantWithColor?.color_code ?? undefined,
                firstVariantWithColor?.color_code2 ?? undefined,
              );

              return (
                <button
                  key={color}
                  onClick={() => {
                    if (color !== selectedColor) {
                      setSelectedColor(color);
                    }
                  }}
                  className={`relative group transition-transform ${
                    isSelected ? "scale-110" : "hover:scale-105"
                  }`}
                  // title={color}
                >
                  {/* Color box */}
                  <div
                    className={`w-10 h-10 rounded border transition-all ${
                      isSelected
                        ? "border-black shadow-lg"
                        : "border-gray-300 hover:border-gray-400"
                    } ${hexColor === "#FFFFFF" ? "border-gray-400" : ""}`}
                    style={colorBoxStyle}
                  />

                  {/* Tooltip */}
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {color}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Selection - Show if sizes are available (with or without colors) */}
      {sizeOptions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-900">Size</label>
            {isCatalogProduct && sizeGuideData && (
              <Button
                variant="link"
                className="text-xs text-red-500 underline underline-offset-2 cursor-pointer p-0 h-auto"
                onClick={() => setSizeGuideOpen(true)}
              >
                Size Guide
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {sizeOptions.map((size) => (
              <Button
                key={size}
                onClick={() => setSelectedSize(size)}
                variant={selectedSize === size ? "default" : "outline"}
                className={`rounded p-2 w-10 h-10 text-[10px] font-medium transition-all ${
                  selectedSize === size
                    ? "bg-primary text-white border-primary"
                    : "border-gray-300 text-gray-700 hover:border-primary hover:text-primary"
                }`}
              >
                {size}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Size Guide Modal */}
      <SizeGuideModal
        open={sizeGuideOpen}
        onOpenChange={setSizeGuideOpen}
        sizeGuideData={sizeGuideData}
      />
    </div>
  );
}
