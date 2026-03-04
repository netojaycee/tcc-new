"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore, CartItem } from "@/stores/cart.store";
import { useCurrency } from "@/lib/context/currency.context";
import {
  getVariantImage,
  variantMatchesId,
  variantsFromUnknown,
} from "@/lib/utils/variant";

interface CartItemsSectionProps {
  items: CartItem[];
  onUpdateQuantity?: (itemId: string, quantity: number) => Promise<boolean>;
  onRemoveItem?: (itemId: string) => Promise<boolean>;
}

export function CartItemsSection({
  items,
  onUpdateQuantity,
  onRemoveItem,
}: CartItemsSectionProps) {
  const { updateQuantity, removeItem } = useCartStore();
  const { convertAmount, formatPrice } = useCurrency();

  const handleIncrement = async (item: CartItem) => {
    const newQuantity = item.quantity + 1;
    if (onUpdateQuantity) {
      await onUpdateQuantity(item.id, newQuantity);
    } else {
      updateQuantity(item.id, newQuantity);
    }
  };

  const handleDecrement = async (item: CartItem) => {
    if (item.quantity > 1) {
      const newQuantity = item.quantity - 1;
      if (onUpdateQuantity) {
        await onUpdateQuantity(item.id, newQuantity);
      } else {
        updateQuantity(item.id, newQuantity);
      }
    }
  };

  const handleRemove = async (itemId: string) => {
    if (onRemoveItem) {
      await onRemoveItem(itemId);
    } else {
      removeItem(itemId);
    }
  };

  return (
    <div className="bg-white rounded border">
      {/* Header */}
      <div className="bg-[#F5F5F5] p-3 border-b">
        <span className="flex items-center gap-2 font-semibold text-sm">
          📦 Cart Items ({items.length})
        </span>
      </div>

      {/* Items List */}
      <div className="space-y-3 p-2 md:p-4">
        {items.map((item) => {
          const subtotal = item.product.basePrice * item.quantity;
          const convertedPrice = convertAmount(item.product.basePrice);
          const convertedSubtotal = convertAmount(subtotal);

          // Extract variant preview image if variant is selected
          let variantImage: string | undefined;
          let variantColor: string | undefined;
          let variantSize: string | undefined;

          if (item.variantId && item.product.variants) {
            try {
              const variants = variantsFromUnknown(item.product.variants);

              const selectedVariant = variants.find(
                (v: any) => variantMatchesId(v, item.variantId),
              );

              if (selectedVariant) {
                variantColor = (selectedVariant as any).color;
                variantSize = (selectedVariant as any).size;
                variantImage = getVariantImage(selectedVariant);
              }
            } catch (error) {
              console.error("Error parsing variant data:", error);
            }
          }

          const displayImage = variantImage || item.product.mainImage;

          return (
            <div
              key={item.id}
              className="flex gap-2 p-2 border rounded border-gray-200 bg-[#F5F5F5]"
            >
              {/* Product Image (Variant Preview) */}
              <div className="relative w-20 h-20 rounded overflow-hidden bg-gray-100 shrink-0">
                {displayImage ? (
                  <Image
                    src={displayImage}
                    alt={item.product.name}
                    fill
                    className="object-contain p-1"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    No image
                  </div>
                )}
              </div>

              {/* Product Info & Controls Container */}
              <div className="flex-1 flex flex-col">
                {/* Top Row: Product name and Delete button */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm md:text-base line-clamp-1">
                      {item.product.name}
                    </h3>
                    {(variantColor || variantSize) && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {[variantColor, variantSize].filter(Boolean).join(" • ")}
                      </p>
                    )}
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {formatPrice(item.product.basePrice, convertedPrice)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-red-500 hover:text-red-700 shrink-0 p-2 -mt-2 -mr-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Bottom Row: Subtotal + Quantity Controls */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Subtotal: {formatPrice(subtotal, convertedSubtotal)}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecrement(item)}
                      disabled={item.quantity <= 1}
                      className="p-1 hover:bg-gray-200 rounded-full bg-white disabled:opacity-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleIncrement(item)}
                      className="p-1 hover:bg-gray-200 rounded-full bg-white shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
