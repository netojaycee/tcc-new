"use client";

import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cart.store";
import { RecipientAndAddressForm } from "@/components/checkout/recipient-and-address-form";
import { OrderSummary } from "@/components/checkout/order-summary";
import { Loader2 } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleOrderCreated = (
    orderId: string,
    clientSecret: string,
    orderData?: any,
  ) => {
    // Redirect to payment page with order ID (UUID)
    router.push(`/checkout/${orderId}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form Section */}
      <div className="lg:col-span-2">
        <RecipientAndAddressForm onOrderCreated={handleOrderCreated} />
      </div>

      {/* Order Summary (sticky on desktop) - shows cart subtotal */}
      <div className="lg:sticky lg:top-8 h-fit">
        <OrderSummary showDetailedBreakdown={false} />
      </div>
    </div>
  );
}
