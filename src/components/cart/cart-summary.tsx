"use client";

import { useCartStore } from "@/stores/cart.store";
import { useCurrency } from "@/lib/context/currency.context";
import { useMemo } from "react";

export function CartSummary() {
  const { items } = useCartStore();
  const { convertAmount, formatPrice } = useCurrency();

  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + item.product.basePrice * item.quantity,
      0,
    );
  }, [items]);

  const convertedSubtotal = convertAmount(subtotal);

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="font-medium">
          {formatPrice(subtotal, convertedSubtotal)}
        </span>
      </div>

      <div className="border-t pt-3">
        <div className="flex justify-between">
          <span className="font-semibold">Estimated Total</span>
          <span className="font-bold text-lg">
            {formatPrice(subtotal, convertedSubtotal)}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center italic">
        Tax & shipping calculated at checkout based on your delivery address
      </p>
    </div>
  );
}
