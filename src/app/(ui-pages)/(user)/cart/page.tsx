"use client";

import Link from "next/link";
import { useCart } from "@/lib/hooks/use-cart";
import { CartItemsSection } from "@/components/cart/CartItemsSection";
import { FreeDeliveryProgress } from "@/components/cart/FreeDeliveryProgress";
import { PromoCodeSection } from "@/components/cart/PromoCodeSection";
import { OrderSummary } from "@/components/checkout/order-summary";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Cart Page
 * 
 * Simplified flow:
 * - Display all items in cart
 * - Allow quantity changes and item removal
 * - Show subtotal only (no selection)
 * - "Proceed to Checkout" button sends ALL items to checkout
 */
export default function CartPage() {
  const {
    items,
    loading,
    error,
    appliedPromo,
    updateItem,
    removeItem,
    applyPromo,
    validateForCheckout,
    refetch,
  } = useCart();

  // Calculate subtotal
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.basePrice * item.quantity,
    0,
  );

  // Calculate discount if promo applied
  const discount =
    appliedPromo && subtotal > 0
      ? subtotal * (appliedPromo.discount / 100)
      : 0;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen px-4 lg:px-16 bg-white">
        <div className="py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded" />
              ))}
            </div>
            <div>
              <Skeleton className="h-96 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart</h1>
          <p className="text-gray-600 mb-8">Your cart is empty</p>
          <Link
            href="/"
            className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-lg"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 lg:px-16 bg-white">
      {/* Main content */}
      <div className="py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Cart Items */}
          <div className="lg:col-span-2">
            {/* Free Delivery Progress */}
            {/* <FreeDeliveryProgress subtotal={subtotal} /> */}

            {/* Cart Items - all items, no selection */}
            <CartItemsSection
              items={items}
              onUpdateQuantity={updateItem}
              onRemoveItem={removeItem}
            />

            {/* Promo Code */}
            <PromoCodeSection
              onApplyPromo={applyPromo}
              appliedPromo={appliedPromo?.code}
              discount={discount}
            />
          </div>

          {/* Right Column - Order Summary */}
          <div>
            <OrderSummary
              showDetailedBreakdown={false}
              onCheckout={validateForCheckout}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
