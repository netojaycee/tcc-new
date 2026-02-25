"use client";

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export interface Variant {
  id: number;
  sku?: string;
  name: string;
  size: string;
  color: string;
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
}

export function VariantSelector({
  variants,
  onVariantSelect,
}: VariantSelectorProps) {
  // Group variants by color
  const colorOptions = useMemo(() => {
    const colors = new Map<string, Variant[]>();
    variants.forEach((variant) => {
      if (!colors.has(variant.color)) {
        colors.set(variant.color, []);
      }
      colors.get(variant.color)!.push(variant);
    });
    return colors;
  }, [variants]);

  // Get unique colors
  const uniqueColors = useMemo(
    () => Array.from(colorOptions.keys()),
    [colorOptions]
  );

  // Initialize with first color and first size of that color
  const initialColor = uniqueColors[0] || null;
  const initialSizeOptions = 
    initialColor ? (colorOptions.get(initialColor)?.map((v) => v.size) || []) : [];
  const initialSize = initialSizeOptions[0] || null;

  const [selectedColor, setSelectedColor] = useState<string | null>(initialColor);
  const [selectedSize, setSelectedSize] = useState<string | null>(initialSize);

  // Get sizes for selected color
  const sizeOptions = useMemo(() => {
    if (!selectedColor) return [];
    const colorVariants = colorOptions.get(selectedColor) || [];
    const sizes = new Set<string>();
    colorVariants.forEach((v) => sizes.add(v.size));
    return Array.from(sizes);
  }, [selectedColor, colorOptions]);

  // Update size when color changes
  // When color changes, sizeOptions changes, so we need to ensure selectedSize is valid
  // for the new color. selectedSize is intentionally excluded to avoid infinite loops.
  useEffect(() => {
    if (sizeOptions.length > 0 && !sizeOptions.includes(selectedSize || "")) {
      setSelectedSize(sizeOptions[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizeOptions]);

  // Get selected variant
  const selectedVariant = useMemo(() => {
    if (!selectedColor || !selectedSize) return null;
    const colorVariants = colorOptions.get(selectedColor) || [];
    return colorVariants.find((v) => v.size === selectedSize) || null;
  }, [selectedColor, selectedSize, colorOptions]);

  // Notify parent when variant is selected
  useEffect(() => {
    if (selectedVariant) {
      onVariantSelect(selectedVariant);
    }
  }, [selectedVariant, onVariantSelect]);

  return (
    <div className="space-y-4 border-b pb-6">
      {/* Color Selection */}
      <div>
        <label className="text-sm font-semibold text-gray-900 block mb-2">
          Color
        </label>
        <div className="flex flex-wrap gap-2">
          {uniqueColors.map((color) => (
            <Button
              key={color}
              onClick={() => {
                // Only reset size if color is actually changing
                if (color !== selectedColor) {
                  setSelectedColor(color);
                //   setSelectedSize(null);
                }
              }}
              variant={selectedColor === color ? "default" : "outline"}
              className={`px-3 py-2 text-sm ${
                selectedColor === color
                  ? "bg-teal-600 hover:bg-teal-700"
                  : "border-gray-300 hover:border-teal-600"
              }`}
            >
              {color}
            </Button>
          ))}
        </div>
      </div>

      {/* Size Selection */}
      {selectedColor && (
        <div>
          <label className="text-sm font-semibold text-gray-900 block mb-2">
            Size
          </label>
          <div className="flex flex-wrap gap-2">
            {sizeOptions.map((size) => (
              <Button
                key={size}
                onClick={() => setSelectedSize(size)}
                variant={selectedSize === size ? "default" : "outline"}
                className={`px-3 py-2 text-sm ${
                  selectedSize === size
                    ? "bg-teal-600 hover:bg-teal-700"
                    : "border-gray-300 hover:border-teal-600"
                }`}
              >
                {size}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
