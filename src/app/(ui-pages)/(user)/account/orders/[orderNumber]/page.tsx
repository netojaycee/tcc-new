"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { getOrderAction } from "@/lib/actions/order.actions";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, Truck, Package } from "lucide-react";
import { useCurrency } from "@/lib/context/currency.context";
import Link from "next/link";

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: Date;
  email: string;
  firstName: string;
  lastName: string;
  currency: string;
  items: Array<{
    id: string;
    product: any;
    quantity: number;
    price: number;
  }>;
  costs: {
    subtotal: number;
    discountAmount: number;
    tax: number;
    shipping: number;
    total: number;
  };
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

function getTimelineSteps(status: string, createdAt: Date) {
  const statusMap: Record<
    string,
    Array<{
      label: string;
      status: "completed" | "pending";
      description?: string;
    }>
  > = {
    paid: [
      {
        label: "Order Confirmed",
        status: "completed",
        description: "We received your order",
      },
      { label: "Package Prepared", status: "pending" },
      { label: "In Transit", status: "pending" },
      { label: "Out for Delivery", status: "pending" },
      { label: "Delivered", status: "pending" },
    ],
    processing: [
      {
        label: "Order Confirmed",
        status: "completed",
        description: "We received your order",
      },
      { label: "Package Prepared", status: "pending" },
      { label: "In Transit", status: "pending" },
      { label: "Out for Delivery", status: "pending" },
      { label: "Delivered", status: "pending" },
    ],
    shipped: [
      {
        label: "Order Confirmed",
        status: "completed",
        description: "We received your order",
      },
      {
        label: "Package Prepared",
        status: "completed",
        description: "Gift package assembled",
      },
      {
        label: "In Transit",
        status: "completed",
        description: "Package handed to courier and is on the way.",
      },
      {
        label: "Out for Delivery",
        status: "pending",
        description: "Estimated later today",
      },
      { label: "Delivered", status: "pending" },
    ],
    delivered: [
      {
        label: "Order Confirmed",
        status: "completed",
        description: "We received your order",
      },
      {
        label: "Package Prepared",
        status: "completed",
        description: "Gift package assembled",
      },
      { label: "In Transit", status: "completed" },
      { label: "Out for Delivery", status: "completed" },
      { label: "Delivered", status: "completed" },
    ],
    cancelled: [
      { label: "Order Confirmed", status: "completed" },
      { label: "Cancelled", status: "pending" },
    ],
  };

  return (
    statusMap[status] || [
      { label: "Order Confirmed", status: "completed" as const },
      { label: "Processing", status: "pending" as const },
    ]
  ).map((step) => ({
    ...step,
    timestamp: createdAt,
  }));
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = params.orderNumber as string;
  const { formatPrice } = useCurrency();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderNumber) return;

    const fetchOrder = async () => {
      setLoading(true);
      try {
        const result = await getOrderAction(orderNumber);

        if (result.success) {
          setOrder(result.data);
        } else {
          setError(result.error || "Order not found");
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="min-h-screen px-4 lg:px-16 py-8 bg-white">
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen px-4 lg:px-16 py-8 bg-white">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </button>
        <div className="max-w-4xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600 text-lg font-semibold">{error}</p>
            <Link
              href="/orders"
              className="mt-4 inline-block px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const timelineSteps = getTimelineSteps(
    order.status,
    new Date(order.createdAt),
  );

  return (
    <div className="min-h-screen px-4 lg:px-16 py-8 bg-white">
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Order Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Order #{order.orderNumber}
          </h1>
        </div>
        <p className="text-gray-600">
          {new Date(order.createdAt).toLocaleDateString("en-US", {
            month: "long",
            day: "2-digit",
            year: "numeric",
          })}{" "}
          •{" "}
          {new Date(order.createdAt).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl">
        {/* Main Content - Left */}
        <div className="lg:col-span-2 space-y-8">
          {/* Order Timeline */}
          <div className="bg-gray-50 rounded-lg p-4 md:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Order Tracking
            </h2>
            <OrderTimeline steps={timelineSteps} />
          </div>

          {/* Ordered Items */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 md:px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Items Ordered ({order.items.length})
              </h2>
            </div>
            <div className="divide-y">
              {order.items.map((item) => (
                <div key={item.id} className="p-4 md:p-6 flex gap-4">
                  {item.product.mainImage && (
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={item.product.mainImage}
                        alt={item.product.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {item.product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Quantity: {item.quantity}
                    </p>
                    <p className="text-sm font-medium text-gray-900 mt-2">
                      {order.currency.toUpperCase()} {item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar - Right */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="border rounded-lg p-4 md:p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>
                  {order.currency.toUpperCase()}{" "}
                  {order.costs.subtotal.toFixed(2)}
                </span>
              </div>
              {order.costs.discountAmount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Discount</span>
                  <span>
                    -{order.currency.toUpperCase()}{" "}
                    {order.costs.discountAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>
                  {order.currency.toUpperCase()} {order.costs.tax.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>
                  {order.currency.toUpperCase()}{" "}
                  {order.costs.shipping.toFixed(2)}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between font-semibold text-gray-900">
                <span>Total</span>
                <span>
                  {order.currency.toUpperCase()} {order.costs.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="border rounded-lg p-4 md:p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Delivery Address
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium text-gray-900">
                {order.firstName} {order.lastName}
              </p>
              <p>{order.deliveryAddress.street}</p>
              <p>
                {order.deliveryAddress.city}, {order.deliveryAddress.state}{" "}
                {order.deliveryAddress.zip}
              </p>
              <p>{order.deliveryAddress.country}</p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="border rounded-lg p-4 md:p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Contact Info</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <div>
                <p className="text-xs text-gray-500 uppercase">Email</p>
                <p className="font-medium text-gray-900">{order.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
