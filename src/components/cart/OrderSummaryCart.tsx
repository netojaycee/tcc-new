"use client";

import { useRouter } from "next/navigation";
import { useCurrency } from "@/lib/context/currency.context";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface OrderSummaryProps {
  subtotal: number;
  discountAmount?: number;
  total?: number;
  selectedItemsCount: number;
  totalItems: number;
  isPromoApplied?: boolean;
  onCheckout: () => Promise<boolean>;
  isLoading?: boolean;
}

export function OrderSummaryCart({
  subtotal,
  discountAmount = 0,
  total,
  selectedItemsCount,
  totalItems,
  isPromoApplied = false,
  onCheckout,
  isLoading = false,
}: OrderSummaryProps) {
  const router = useRouter();
  const { convertAmount, formatPrice } = useCurrency();

  // Calculate values if not provided
  const calculatedTotal = total ?? (subtotal - discountAmount);

  // Convert amounts
  const convertedSubtotal = convertAmount(subtotal);
  const convertedDiscount = convertAmount(discountAmount);
  const convertedTotal = convertAmount(calculatedTotal);

  const canCheckout = selectedItemsCount > 0 && !isLoading;

  const handleCheckout = async () => {
    if (canCheckout) {
      const isValid = await onCheckout();
      if (isValid) {
        router.push("/checkout");
      }
    }
  };

  return (
    <div className="bg-[#F5F5F5] rounded p-4 md:p-6 h-fit sticky top-4">
      <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
        Order Summary
      </h2>

      {/* Items Count */}
      <div className="text-sm text-gray-600 mb-4 pb-4 border-b">
        <p>
          {selectedItemsCount} of {totalItems} items selected
        </p>
      </div>

      {/* Price Breakdown */}
      <div className="space-y-3 mb-4 pb-4 border-b">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-semibold text-gray-900">
            {formatPrice(subtotal, convertedSubtotal)}
          </span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Discount {isPromoApplied && "✓"}
            </span>
            <span className="font-semibold text-green-600">
              -{formatPrice(discountAmount, convertedDiscount)}
            </span>
          </div>
        )}

        <div className="text-xs text-gray-500 italic">
          Tax & shipping calculated at checkout
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center mb-6">
        <span className="text-base md:text-lg font-bold text-gray-900">
          Total
        </span>
        <span className="text-2xl md:text-3xl font-bold text-gray-900">
          {formatPrice(calculatedTotal, convertedTotal)}
        </span>
      </div>

      {/* Checkout Button */}
      <Button
        onClick={handleCheckout}
        disabled={!canCheckout}
        className={`w-full py-3 rounded font-semibold text-white transition ${
          canCheckout
            ? "bg-primary hover:bg-primary/80 cursor-pointer"
            : "bg-gray-300 cursor-not-allowed"
        }`}
      >
        {isLoading ? "Processing..." : "Proceed to Checkout"}
      </Button>

      {selectedItemsCount === 0 && (
        <p className="text-sm text-red-600 mt-3 text-center">
          Please select items to checkout
        </p>
      )}

      {/* Continue Shopping Link */}
      <Link
        href="/"
        className="block text-center text-sm text-primary hover:text-primary/80 font-semibold mt-3 underline"
      >
        Continue Shopping
      </Link>
    </div>
  );
}
