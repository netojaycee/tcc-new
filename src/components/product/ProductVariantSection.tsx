"use client";

import { useState, useCallback, useMemo } from "react";
import { VariantSelector, type Variant } from "./VariantSelector";
import { ProductGallery } from "./ProductGallery";
import { AddToCartButton } from "./AddToCartButton";
import { getVariantImage } from "@/lib/utils/variant";

interface ProductVariantSectionProps {
  productId: string;
  variants: Variant[];
  defaultGalleryImages: string[];
}

export function ProductVariantSection({
  productId,
  variants,
  defaultGalleryImages,
}: ProductVariantSectionProps) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

  const handleVariantSelect = useCallback((variant: Variant) => {
    setSelectedVariant(variant);
  }, []);

  // Extract preview image from selected variant, fallback to default gallery
  const galleryImages = useMemo(() => {
    if (!selectedVariant) return defaultGalleryImages;

    const variantImage = getVariantImage(selectedVariant);

    return variantImage ? [variantImage, ...defaultGalleryImages] : defaultGalleryImages;
  }, [selectedVariant, defaultGalleryImages]);

  if (!variants || variants.length === 0) {
    // Fallback for products without variants
    return (
      <>
        <ProductGallery images={defaultGalleryImages} />
        <AddToCartButton
          productId={productId}
          variant={{ id: 0, variant_id: 0, size: "Default", color: "Default" }}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Product Gallery - shows selected variant image or default */}
      <ProductGallery images={galleryImages} />

      {/* Variant Selection */}
      <VariantSelector
        variants={variants}
        onVariantSelect={handleVariantSelect}
      />

      {/* Add to Cart Button */}
      <AddToCartButton productId={productId} variant={selectedVariant} />
    </div>
  );
}
