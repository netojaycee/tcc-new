"use client";

import { useCartStore } from "@/stores/cart.store";
import { useCurrency } from "@/lib/context/currency.context";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  getVariantImage,
  variantMatchesId,
  variantsFromUnknown,
} from "@/lib/utils/variant";

interface OrderSummaryProps {
  // Detailed breakdown (payment step)
  costs?: {
    subtotal: number;
    tax?: number;
    shipping?: number;
    discount?: number;
    shippingTime?: string;
    total: number;
  };
  // Shipping rates with detailed info (for payment step)
  shippingRates?: Array<{
    id: string;
    name: string;
    rate: string;
    currency: string;
    minDeliveryDays: number;
    maxDeliveryDays: number;
    minDeliveryDate: string;
    maxDeliveryDate: string;
  }>;
  // Simple view (cart step) - calculate subtotal from items
  showDetailedBreakdown?: boolean;
  // Cart page only: checkout action and state
  onCheckout?: () => Promise<boolean>;
  isLoading?: boolean;
  items?: any[]; // Optional: pass items as prop, or use from store
  // If provided, amounts are already converted in this currency (no context conversion needed)
  displayCurrency?: string;
}

export function OrderSummary({
  items: itemsProp,
  costs,
  shippingRates,
  showDetailedBreakdown = false,
  onCheckout,
  isLoading = false,
  displayCurrency,
}: OrderSummaryProps) {
  const { items: storeItems } = useCartStore();
  const items = itemsProp || storeItems;
  const router = useRouter();
  const { convertAmount, formatPrice } = useCurrency();

  // If displayCurrency is provided, amounts are already converted - don't use context conversion
  const shouldConvert = !displayCurrency;
  const convert = shouldConvert ? convertAmount : (amount: number) => amount;

  if (items && items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Your cart is empty
      </div>
    );
  }
  // Calculate subtotal from items
  const itemSubtotal = items.reduce(
    (sum, item) => sum + item.product.basePrice * item.quantity,
    0,
  );
  const convertedItemSubtotal = convertAmount(itemSubtotal);

  const handleCheckout = async () => {
    if (onCheckout) {
      const isValid = await onCheckout();
      if (isValid) {
        router.push("/checkout");
      }
    }
  };

  return (
    <div
      className={
        showDetailedBreakdown
          ? "space-y-4"
          : "bg-[#F5F5F5] rounded p-4 md:p-6 h-fit sticky top-4 space-y-4"
      }
    >
      <h2 className="text-lg md:text-xl font-bold text-gray-900">
        Order Summary
      </h2>

      <div
        className={
          showDetailedBreakdown
            ? "border rounded-lg p-4 space-y-2"
            : "space-y-3 mb-4 pb-4 border-b"
        }
      >
        {/* Show item list only on detailed breakdown view (payment page) */}
        {showDetailedBreakdown && (
          <>
            {items.map((item) => {
              const subtotal = item.product.basePrice * item.quantity;
              // Items always have CAD prices from DB, always convert
              const convertedSubtotal = convertAmount(subtotal);
              const convertedPrice = convertAmount(item.product.basePrice);

              // Extract variant details
              let variantImage: string | undefined;
              let variantColor: string | undefined;
              let variantSize: string | undefined;

              if (item.variantId && item.product.variants) {
                try {
                  const variants = variantsFromUnknown(item.product.variants);
                  const selectedVariant = variants.find((v: any) =>
                    variantMatchesId(v, item.variantId),
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

              const displayImage = variantImage || item.product.mainImage;

              return (
                <div
                  key={item.id}
                  className="flex gap-3 py-3 border-b last:border-b-0"
                >
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

                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{item.product.name}</h3>
                    {(variantColor || variantSize) && (
                      <p className="text-xs text-muted-foreground">
                        {[variantColor, variantSize]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Qty: {item.quantity} ×{" "}
                      {formatPrice(item.product.basePrice, convertedPrice)}
                    </p>
                  </div>

                  <div className="text-sm font-semibold">
                    {formatPrice(subtotal, convertedSubtotal)}
                  </div>
                </div>
              );
            })}
            <div className="border-t pt-3" />
          </>
        )}

        {/* Price Breakdown */}
        {showDetailedBreakdown ? (
          // Payment page: show full breakdown
          // When displayCurrency is set, amounts are already converted - use convert() to skip context conversion
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">
                {formatPrice(
                  costs?.subtotal ?? 0,
                  convert(costs?.subtotal ?? 0),
                )}
              </span>
            </div>

            {costs?.discount !== undefined && costs.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-medium text-green-600">
                  -{formatPrice(costs.discount, convert(costs.discount))}
                </span>
              </div>
            )}

            {costs?.tax !== undefined && costs.tax > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium">
                  {formatPrice(costs.tax, convert(costs.tax))}
                </span>
              </div>
            )}

            {costs?.shipping !== undefined && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {shippingRates && shippingRates.length > 0
                      ? shippingRates[0].name
                      : "Shipping"}
                  </span>
                  <span className="font-medium">
                    {costs.shipping === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      formatPrice(costs.shipping, convert(costs.shipping))
                    )}
                  </span>
                </div>
              </>
            )}

            <div className="flex justify-between font-semibold border-t pt-2 mt-2">
              <span>Total</span>
              <span className="text-base">
                {formatPrice(
                  costs?.total ?? 0,
                  convert(costs?.total ?? 0),
                )}
              </span>
            </div>
          </div>
        ) : (
          // Cart page: show only subtotal
          <>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold text-gray-900">
                {formatPrice(itemSubtotal, convertedItemSubtotal)}
              </span>
            </div>

            <div className="text-xs text-gray-500 italic">
              Tax & shipping calculated at checkout
            </div>
          </>
        )}
      </div>

      {/* Total - cart page only */}
      {!showDetailedBreakdown && (
        <div className="flex justify-between items-center mb-6">
          <span className="text-base md:text-lg font-bold text-gray-900">
            Total
          </span>
          <span className="text-2xl md:text-3xl font-bold text-gray-900">
            {formatPrice(itemSubtotal, convertedItemSubtotal)}
          </span>
        </div>
      )}

      {/* Checkout Button - cart page only */}
      {!showDetailedBreakdown && onCheckout && (
        <Button
          onClick={handleCheckout}
          disabled={isLoading}
          className={`w-full py-3 rounded font-semibold text-white transition ${
            !isLoading
              ? "bg-teal-600 hover:bg-teal-700 cursor-pointer"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          {isLoading ? "Processing..." : "Proceed to Checkout"}
        </Button>
      )}

      {/* Continue Shopping - cart page only */}
      {!showDetailedBreakdown && (
        <Link
          href="/"
          className="block text-center text-sm text-teal-600 hover:text-teal-700 font-semibold mt-3 underline"
        >
          Continue Shopping
        </Link>
      )}
    </div>
  );
}
