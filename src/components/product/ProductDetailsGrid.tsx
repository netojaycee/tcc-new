"use client";

import { useState, useCallback, useMemo } from "react";
import { VariantSelector, type Variant } from "./VariantSelector";
import { ProductGallery } from "./ProductGallery";
import { AddToCartButton } from "./AddToCartButton";
import { getVariantImage } from "@/lib/utils/variant";
import { Button } from "@/components/ui/button";
import { ArrowRight, Info } from "lucide-react";
import { Input } from "../ui/input";

interface ProductDetailsGridProps {
  productId: string;
  defaultGalleryImages: string[];
  variants: Variant[] | null;
  detailsContent: React.ReactNode; // The product details section (price, rating, etc.)
  productType?: string; // "store" or "catalog"
}

export function ProductDetailsGrid({
  productId,
  defaultGalleryImages,
  variants,
  detailsContent,
  productType = "store",
}: ProductDetailsGridProps) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");

  const handleVariantSelect = useCallback((variant: Variant) => {
    setSelectedVariant(variant);
  }, []);

  // Extract preview image from selected variant, fallback to default gallery
  const galleryImages = useMemo(() => {
    if (!selectedVariant || !variants) return defaultGalleryImages;

    const variantImage = getVariantImage(selectedVariant);

    // Show ONLY the variant image, not combined with default gallery
    return variantImage ? [variantImage] : defaultGalleryImages;
  }, [selectedVariant, variants, defaultGalleryImages]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Product Images - Column 1 */}
      <div>
        <ProductGallery images={galleryImages} />
      </div>

      {/* Product Details - Column 2 */}
      <div className="flex flex-col gap-3">
        {/* Existing product details */}
        {detailsContent}

        {/* Variant Selection & Add to Cart (Store) or Customize (Catalog) */}
        {productType === "catalog" ? (
          // Catalog - Customize Product UI
          <div className="space-y-4 pt-2">
            {variants && variants.length > 0 && (
              <VariantSelector
                variants={variants}
                onVariantSelect={handleVariantSelect}
              />
            )}

            {/* AI Design Input */}
            <div className="space-y-2 pt-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Use AI to generate a design on the product"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <Button
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-primary w-6 h-6"
                >
                  <ArrowRight size={20} />
                </Button>
              </div>

              {/* Customize Button */}
              <Button className="w-full bg-primary text-white py-6 text-base font-semibold rounded-lg">
                Customize this Product
              </Button>

              {/* Info Note */}
              <div className="flex items-center gap-2 text-sm text-gray-700 bg-blue-50 p-3 rounded">
                <Info size={16} className="shrink-0" />
                <span>What you design is what gets printed</span>
              </div>
            </div>
          </div>
        ) : (
          // Store - Add to Cart
          <div>
            {variants && variants.length > 0 ? (
              <div className="space-y-4 pt-2">
                <VariantSelector
                  variants={variants}
                  onVariantSelect={handleVariantSelect}
                />
                <AddToCartButton
                  productId={productId}
                  variant={selectedVariant}
                />
              </div>
            ) : (
              <AddToCartButton
                productId={productId}
                variant={{
                  id: 0,
                  variant_id: 0,
                  size: "Default",
                  color: "Default",
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
