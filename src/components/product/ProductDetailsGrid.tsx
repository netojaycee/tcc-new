"use client";

import { useState, useCallback, useMemo } from "react";
import { VariantSelector, type Variant } from "./VariantSelector";
import { ProductGallery } from "./ProductGallery";
import { AddToCartButton } from "./AddToCartButton";
import { getVariantImage } from "@/lib/utils/variant";

interface ProductDetailsGridProps {
  productId: string;
  defaultGalleryImages: string[];
  variants: Variant[] | null;
  detailsContent: React.ReactNode; // The product details section (price, rating, etc.)
}

export function ProductDetailsGrid({
  productId,
  defaultGalleryImages,
  variants,
  detailsContent,
}: ProductDetailsGridProps) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

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

        {/* Variant Selection & Add to Cart */}
        {variants && variants.length > 0 ? (
          <div className="space-y-4 border-t pt-4">
            <VariantSelector
              variants={variants}
              onVariantSelect={handleVariantSelect}
            />
            <AddToCartButton productId={productId} variant={selectedVariant} />
          </div>
        ) : (
          <AddToCartButton
            productId={productId}
            variant={{ id: 0, variant_id: 0, size: "Default", color: "Default" }}
          />
        )}
      </div>
    </div>
  );
}
