"use client";

import Link from "next/link";
import { useCart } from "@/lib/hooks/use-cart";
import { CartItemsSection } from "@/components/cart/CartItemsSection";
import { FreeDeliveryProgress } from "@/components/cart/FreeDeliveryProgress";
import { PromoCodeSection } from "@/components/cart/PromoCodeSection";
import { OrderSummary } from "@/components/checkout/order-summary";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/product/ProductCard";
import { getProductsAction } from "@/lib/actions/product.actions";
import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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

  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  // Fetch related products on mount
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      setRelatedLoading(true);
      try {
        const result = await getProductsAction({ limit: 6, offset: 0 });
        if (result.success) {
          setRelatedProducts(result.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setRelatedLoading(false);
      }
    };

    fetchRelatedProducts();
  }, []);

  // Calculate subtotal
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.basePrice * item.quantity,
    0,
  );

  // Calculate discount if promo applied
  const discount =
    appliedPromo && subtotal > 0 ? subtotal * (appliedPromo.discount / 100) : 0;

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
    <div className="min-h-screen px-4 lg:px-16 ">
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

        {/* You May Also Like - Carousel */}
        {relatedProducts.length > 0 && (
          <div className="mt-8 border-t pt-4 mb-10">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              you may also like
            </h3>

            <Carousel className="w-full">
              <CarouselContent className="-ml-2 md:-ml-4">
                {relatedProducts.map((product) => (
                  <CarouselItem
                    key={product.id}
                    className="pl-2 md:pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4"
                  >
                    <ProductCard product={product} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              {/* <CarouselPrevious className="" />
              <CarouselNext className="" /> */}

              {relatedProducts.length > 1 && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-full">
                  <CarouselDots />
                </div>
              )}
            </Carousel>
          </div>
        )}
      </div>
    </div>
  );
}
