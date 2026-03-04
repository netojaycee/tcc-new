"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCurrency } from "@/lib/context/currency.context";
import { useCart } from "@/lib/hooks/use-cart";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOrderAction } from "@/lib/actions/order.actions";

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const { clearCart } = useCart();
  const orderId = searchParams.get("orderId");  // Use UUID directly

  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(true);
  const hasCleared = useRef(false);

  // Fetch order when orderId is available
  useEffect(() => {
    if (!orderId) {
      router.push("/");
      return;
    }

    const fetchOrder = async () => {
      setIsPending(true);
      const result = await getOrderAction(orderId);

      if (!result.success) {
        setError(result.error || "Failed to fetch order");
      } else {
        setOrder((result as any).data);
      }
      setIsPending(false);
    };

    fetchOrder();
  }, [orderId, router]);

  // Clear cart when order is successfully loaded (only once)
  useEffect(() => {
    if (order && !error && !hasCleared.current) {
      hasCleared.current = true;
      clearCart();
    }
  }, [order, error, clearCart]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
            <Button onClick={() => router.push("/")} className="mt-4">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="text-center mb-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-muted-foreground">
          Thank you for your purchase. Your order has been successfully placed.
        </p>
      </div>

      {order && (
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>Order #{order.orderNumber}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{order.status}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total</p>
                <p className="font-medium">
                  {formatPrice(order.costs.total, order.costs.total)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{order.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Items</h3>
              <div className="space-y-2">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.product?.name || "Item"} x {item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Price Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>
                    {formatPrice(order.costs.subtotal, order.costs.subtotal)}
                  </span>
                </div>
                {order.costs.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-green-600">
                      -
                      {formatPrice(
                        order.costs.discountAmount,
                        order.costs.discountAmount,
                      )}
                    </span>
                  </div>
                )}
                {order.costs.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>
                      {formatPrice(order.costs.tax, order.costs.tax)}
                    </span>
                  </div>
                )}
                {order.costs.shipping >= 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>
                      {order.costs.shipping === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        formatPrice(
                          order.costs.shipping,
                          order.costs.shipping,
                        )
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total</span>
                  <span>
                    {formatPrice(order.costs.total, order.costs.total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={() => router.push("/")} className="flex-1">
                Continue Shopping
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/orders")}
                className="flex-1"
              >
                View Orders
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function OrderConfirmationPage() {
  return <OrderConfirmationContent />;
}
