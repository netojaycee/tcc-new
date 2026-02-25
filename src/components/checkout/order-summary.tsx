"use client";

import { useCartStore } from "@/stores/cart.store";
import { CartSummary } from "@/components/cart/cart-summary";
import Image from "next/image";
import {
  getVariantImage,
  variantMatchesId,
  variantsFromUnknown,
} from "@/lib/utils/variant";

interface OrderSummaryProps {
  order?: any;
}

export function OrderSummary({ order }: OrderSummaryProps) {
    const { items } = useCartStore();

    if (items.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Your cart is empty
            </div>
        );
    }
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Order Summary</h2>

            <div className="border rounded-lg p-4">
                <div className="space-y-2">
                    {items.map((item) => {
                        const subtotal = item.product.basePrice * item.quantity;

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
                                    variantImage = getVariantImage(selectedVariant as any);
                                }
                            } catch (error) {
                                console.error("Error parsing variant data:", error);
                            }
                        }

                        // Use variant image if available, otherwise fall back to product main image
                        const displayImage = variantImage || item.product.mainImage;

                        return (
                            <div key={item.id} className="flex gap-3 py-3 border-b last:border-b-0">
                                {/* Product Image (Variant Preview) */}
                                <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-100 shrink-0">
                                    {displayImage ? (
                                        <Image
                                            src={displayImage}
                                            alt={item.product.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                            No image
                                        </div>
                                    )}
                                </div>

                                {/* Product Info */}
                                <div className="flex-1">
                                    <h3 className="font-medium text-sm">{item.product.name}</h3>
                                    {/* Show variant details if available */}
                                    {(variantColor || variantSize) && (
                                        <p className="text-xs text-muted-foreground">
                                            {[variantColor, variantSize].filter(Boolean).join(" • ")}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Qty: {item.quantity} × {new Intl.NumberFormat("en-CA", {
                                          style: "currency",
                                          currency: "CAD",
                                        }).format(item.product.basePrice)}
                                    </p>
                                </div>

                                {/* Subtotal */}
                                <div className="text-sm font-semibold">
                                    {new Intl.NumberFormat("en-CA", {
                                      style: "currency",
                                      currency: "CAD",
                                    }).format(subtotal)}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 pt-4 border-t">
                  {order ? (
                    // Payment step: show order totals with tax/shipping
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{new Intl.NumberFormat("en-CA", {
                          style: "currency",
                          currency: "CAD",
                        }).format(order.subtotal ?? 0)}</span>
                      </div>
                      {order.discountAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Discount</span>
                          <span className="text-green-600">-{new Intl.NumberFormat("en-CA", {
                            style: "currency",
                            currency: "CAD",
                          }).format(order.discountAmount ?? 0)}</span>
                        </div>
                      )}
                      {order.tax > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tax</span>
                          <span>{new Intl.NumberFormat("en-CA", {
                            style: "currency",
                            currency: "CAD",
                          }).format(order.tax ?? 0)}</span>
                        </div>
                      )}
                      {order.shippingFee >= 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Shipping</span>
                          <span>
                            {order.shippingFee === 0 ? (
                              <span className="text-green-600">Free</span>
                            ) : (
                              new Intl.NumberFormat("en-CA", {
                                style: "currency",
                                currency: "CAD",
                              }).format(order.shippingFee ?? 0)
                            )}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Total</span>
                        <span>{new Intl.NumberFormat("en-CA", {
                          style: "currency",
                          currency: "CAD",
                        }).format(order.total ?? 0)}</span>
                      </div>
                    </div>
                  ) : (
                    <CartSummary />
                  )}
                </div>
            </div>
        </div>
    );
}
