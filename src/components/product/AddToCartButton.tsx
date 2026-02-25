"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCart } from "@/lib/hooks/use-cart";
import { Loader2 } from "lucide-react";
import { resolveVariantId } from "@/lib/utils/variant";

interface Variant {
  id: number;
  size: string;
  color: string;
  variant_id?: number;
}

export interface AddToCartButtonProps {
  productId: string;
  variant?: Variant | null;
}

export function AddToCartButton({ productId, variant }: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  async function handleAddToCart() {
    const resolvedVariantId = resolveVariantId(variant);

    // Validate variant selection
    if (!variant || !resolvedVariantId) {
      toast.error("Please select variant first");
      return;
    }

    setLoading(true);
    try {
      // Pass both productId and variantId for proper tracking
      const success = await addItem(productId, resolvedVariantId, quantity);

      if (success) {
        toast.success(
          `Added ${quantity} item${quantity > 1 ? "s" : ""} to cart`,
        );
        setQuantity(1); // Reset quantity after successful add
      }
    } catch (error) {
      console.log(error, "failed to add to cart")
      toast.error("Failed to add to cart");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      {/* Quantity controls - commented out for now */}
      {/* <div className="flex items-center border border-gray-300 rounded">
        <button
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          disabled={loading || quantity <= 1}
          className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          −
        </button>
        <span className="px-4 py-2 min-w-12 text-center font-semibold">
          {quantity}
        </span>
        <button
          onClick={() => setQuantity(quantity + 1)}
          disabled={loading}
          className="px-3 py-2 text-gray-600 hover:bg-gray-100"
        >
          +
        </button>
      </div> */}

      <Button
        onClick={handleAddToCart}
        disabled={loading || !resolveVariantId(variant)}
        className="flex-1 bg-primary hover:bg-primary/80 cursor-pointer"
      >
        {loading && <Loader2 className="animate-spin mr-2" />}
        {!resolveVariantId(variant)
          ? "Select Variant First"
          : loading
            ? "Processing..."
            : "Add to Cart"}
      </Button>
    </div>
  );
}
