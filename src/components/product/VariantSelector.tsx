"use client";

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { COLOR_HEX_MAP } from "@/lib/utils/color";

// Color to hex mapping

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
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

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
    [colorOptions],
  );

  // Initialize with first color and first size of that color
  const initialColor = uniqueColors[0] || null;
  const initialSizeOptions = initialColor
    ? colorOptions.get(initialColor)?.map((v) => v.size) || []
    : [];
  const initialSize = initialSizeOptions[0] || null;

  const [selectedColor, setSelectedColor] = useState<string | null>(
    initialColor,
  );
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
    <div className="space-y-4 border-b pb-4">
      {/* Color Selection */}
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
            const hexColor = COLOR_HEX_MAP[color.toLowerCase()] || "#CCCCCC";
            const isSelected = selectedColor === color;

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
                title={color}
              >
                {/* Color box */}
                <div
                  className={`w-10 h-10 rounded border transition-all ${
                    isSelected
                      ? "border-black shadow-lg"
                      : "border-gray-300 hover:border-gray-400"
                  } ${hexColor === "#FFFFFF" ? "border-gray-400" : ""}`}
                  style={{ backgroundColor: hexColor }}
                />

                {/* Tooltip */}
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {color}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Size Selection */}
      {selectedColor && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-900">Size</label>
            <Button
              variant="link"
              className="text-xs text-red-500 underline underline-offset-2 cursor-pointer p-0 h-auto"
              onClick={() => setSizeGuideOpen(true)}
            >
              Size Guide
            </Button>
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
      <Dialog open={sizeGuideOpen} onOpenChange={setSizeGuideOpen}>
        <DialogContent className="max-w-2xl h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Size Guide</DialogTitle>
            <DialogDescription>
              Find your perfect fit using our size guide
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 space-y-6">
            {/* Size Chart Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Size
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      UK Size
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Chest (cm)
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Length (cm)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { size: "XS", uk: "6-8", chest: "76-81", length: "61" },
                    { size: "S", uk: "8-10", chest: "81-86", length: "63" },
                    { size: "M", uk: "10-12", chest: "86-91", length: "65" },
                    { size: "L", uk: "12-14", chest: "91-97", length: "68" },
                    { size: "XL", uk: "14-16", chest: "97-102", length: "71" },
                    {
                      size: "2XL",
                      uk: "16-18",
                      chest: "102-107",
                      length: "73",
                    },
                    {
                      size: "3XL",
                      uk: "18-20",
                      chest: "107-112",
                      length: "75",
                    },
                    { size: "4XL", uk: "20+", chest: "112+", length: "77" },
                  ].map((row) => (
                    <tr
                      key={row.size}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {row.size}
                      </td>
                      <td className="py-3 px-4 text-gray-700">{row.uk}</td>
                      <td className="py-3 px-4 text-gray-700">{row.chest}</td>
                      <td className="py-3 px-4 text-gray-700">{row.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Fit Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                How to Measure
              </h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>
                  <strong>Chest:</strong> Measure around the fullest part of
                  your chest with arms relaxed
                </li>
                <li>
                  <strong>Length:</strong> Measure from the top of your shoulder
                  to the desired hem point
                </li>
              </ul>
            </div>

            {/* Fit Guide */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Fit Types</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>Regular Fit:</strong> True to size, comfortable
                  everyday wear
                </p>
                <p>
                  <strong>Slim Fit:</strong> Fitted silhouette, recommended to
                  size up if between sizes
                </p>
                <p>
                  <strong>Loose Fit:</strong> Relaxed fit, runs slightly larger
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
