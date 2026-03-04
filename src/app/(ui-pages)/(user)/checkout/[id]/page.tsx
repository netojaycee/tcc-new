"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { OrderSummary } from "@/components/checkout/order-summary";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getOrderAction,
} from "@/lib/actions/order.actions";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

interface OrderData {
  id: string;
  draftOrderId: string;
  currency: string;
  clientSecret: string;
  email: string;
  firstName: string;
  lastName: string;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  items: any[];
  costs: {
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    shippingTime?: string;
    total: number;
  };
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
}

export default function CheckoutPaymentPage() {
  const params = useParams();
  const orderId = params.id as string;  // Use the ID directly from params
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError("Order ID not found");
        setLoading(false);
        return;
      }

      try {
        // Fetch the order using server action
        const result = await getOrderAction(orderId);

        if (!result.success || !result.data) {
          throw new Error(result.error || "Invalid order data");
        }
        console.log("Fetched order data:", result.data);
        setOrder(result.data);
      } catch (err: any) {
        console.error("Error fetching order:", err);
        setError(err.message || "Failed to load order");
        toast.error("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="border border-red-200 bg-red-50 rounded p-4">
        <p className="text-red-600">
          {error || "Failed to load order. Please try again."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Order Summary (sticky on desktop) - shows complete order data */}
      <div className="order-first lg:order-last lg:sticky lg:top-8 h-fit">
        <OrderSummary
          items={order.items}
          costs={order.costs}
          shippingRates={order.shippingRates}
          showDetailedBreakdown={true}
          displayCurrency={order.currency}
        />
      </div>

      {/* Payment Form Section */}
      <div className="lg:col-span-2">
        {order.clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret: order.clientSecret,
              appearance: {
                theme: "stripe",
              },
            }}
          >
            <CheckoutForm
              clientSecret={order.clientSecret}
              orderId={(order as any).orderNumber.toString().toLowerCase()}
            />
          </Elements>
        ) : (
          <div className="border border-red-200 bg-red-50 rounded p-4">
            <p className="text-red-600">
              Payment intent not ready. Please try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
