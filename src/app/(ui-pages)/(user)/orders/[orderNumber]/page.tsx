"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { getOrderAction } from "@/lib/actions/order.actions";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mail,
  Phone,
  MapPin,
  Package,
  Truck,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  printfulStatus?: string; // From Printful webhooks
  createdAt: Date;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
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
  shipments?: Array<{
    id: number;
    status: string;
    carrier: string;
    service: string;
    tracking_number: string;
    tracking_url: string;
    estimated_delivery_dates: {
      from: number;
      to: number;
    };
  }>;
}

/**
 * Map Printful order status to timeline steps
 * Printful statuses: draft, pending, failed, on_hold, production, shipped, fulfilled, canceled
 */
function getTimelineSteps(
  status: string,
  printfulStatus: string | undefined,
  createdAt: Date,
) {
  // Use printfulStatus if available (from webhooks), fallback to status
  const currentStatus = printfulStatus || status;

  const printfulStatusMap: Record<
    string,
    Array<{
      label: string;
      status: "completed" | "pending" | "failed";
      description?: string;
    }>
  > = {
    // Draft - order created but not confirmed
    draft: [
      {
        label: "Order Confirmed",
        status: "pending",
        description: "Waiting for payment confirmation",
      },
      { label: "Package Prepared", status: "pending" },
      { label: "In Transit", status: "pending" },
      { label: "Out for Delivery", status: "pending" },
      { label: "Delivered", status: "pending" },
    ],
    // Pending - order confirmed, awaiting processing
    pending: [
      {
        label: "Order Confirmed",
        status: "completed",
        description: "We received your order",
      },
      {
        label: "Package Prepared",
        status: "pending",
        description: "Processing your order",
      },
      { label: "In Transit", status: "pending" },
      { label: "Out for Delivery", status: "pending" },
      { label: "Delivered", status: "pending" },
    ],
    // Production - actively being prepared
    production: [
      {
        label: "Order Confirmed",
        status: "completed",
        description: "We received your order",
      },
      {
        label: "Package Prepared",
        status: "completed",
        description: "Your order is being prepared",
      },
      { label: "In Transit", status: "pending", description: "Awaiting pickup" },
      { label: "Out for Delivery", status: "pending" },
      { label: "Delivered", status: "pending" },
    ],
    // Shipped - order has been shipped
    shipped: [
      {
        label: "Order Confirmed",
        status: "completed",
        description: "We received your order",
      },
      {
        label: "Package Prepared",
        status: "completed",
        description: "Package assembled and shipped",
      },
      {
        label: "In Transit",
        status: "completed",
        description: "Package is on the way to you",
      },
      {
        label: "Out for Delivery",
        status: "pending",
        description: "Delivery expected soon",
      },
      { label: "Delivered", status: "pending" },
    ],
    // Fulfilled - order is complete
    fulfilled: [
      {
        label: "Order Confirmed",
        status: "completed",
        description: "We received your order",
      },
      {
        label: "Package Prepared",
        status: "completed",
        description: "Package assembled and shipped",
      },
      { label: "In Transit", status: "completed" },
      { label: "Out for Delivery", status: "completed" },
      { label: "Delivered", status: "completed" },
    ],
    // Failed - order fulfillment failed
    failed: [
      {
        label: "Order Confirmed",
        status: "completed",
        description: "We received your order",
      },
      {
        label: "Package Preparation Failed",
        status: "failed",
        description: "Order could not be fulfilled",
      },
    ],
    // On hold - order is on hold
    on_hold: [
      {
        label: "Order Confirmed",
        status: "completed",
        description: "We received your order",
      },
      {
        label: "On Hold",
        status: "pending",
        description: "Order requires review/approval",
      },
    ],
    // Canceled - order was canceled
    canceled: [
      {
        label: "Order Confirmed",
        status: "completed",
        description: "We received your order",
      },
      {
        label: "Order Canceled",
        status: "failed",
        description: "This order has been canceled",
      },
    ],
  };

  const steps =
    printfulStatusMap[currentStatus] ||
    printfulStatusMap[status] || [
      { label: "Order Confirmed", status: "completed" as const },
      { label: "Processing", status: "pending" as const },
    ];

  return steps.map((step) => ({
    ...step,
    timestamp: createdAt,
  }));
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = params.orderNumber as string;

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
          className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6"
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
    order.printfulStatus,
    new Date(order.createdAt),
  );

  const statusConfig: Record<string, { label: string; color: string }> = {
    // Local statuses
    draft: { label: "Draft", color: "bg-gray-100 text-gray-800" },
    pending: { label: "Pending Payment", color: "bg-yellow-100 text-yellow-800" },
    paid: { label: "Paid", color: "bg-blue-100 text-blue-800" },
    processing: { label: "Processing", color: "bg-blue-100 text-blue-800" },
    shipped: { label: "Shipped", color: "bg-orange-100 text-orange-800" },
    delivered: { label: "Delivered", color: "bg-green-100 text-green-800" },
    cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
    failed: { label: "Failed", color: "bg-red-100 text-red-800" },
    // Printful statuses (from webhooks)
    on_hold: { label: "On Hold", color: "bg-yellow-100 text-yellow-800" },
    production: { label: "In Production", color: "bg-blue-100 text-blue-800" },
    fulfilled: { label: "Fulfilled", color: "bg-green-100 text-green-800" },
  };

  const statusInfo =
    statusConfig[order.printfulStatus || order.status] || statusConfig.pending;

  return (
    <div className="min-h-screen px-4 lg:px-16 py-8 bg-white">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Debug: Show current status */}
      {order.printfulStatus && (
        <div className="mb-4 p-2 bg-blue-50 text-xs text-blue-700 rounded">
          Printful Status: {order.printfulStatus}
        </div>
      )}

      {/* Order Header */}
      <div className="border rounded mb-6">
        <div className="bg-[#FAFAFA] border-b border-gray-200 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Order #{order.orderNumber}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className={`${statusInfo.color} text-xs font-medium`}>
              {statusInfo.label}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Package className="w-4 h-4" />
              <span>
                {new Date(order.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>
                {new Date(order.createdAt).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* ORDER SUMMARY */}
          <div className="border rounded">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide bg-[#FAFAFA] border-b border-gray-200 p-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Order Summary
            </h2>
            <div className="p-4 space-y-4">
              {/* Product Items */}
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 border rounded p-3 bg-gray-50"
                  >
                    {item.product.mainImage && (
                      <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden shrink-0">
                        <Image
                          src={item.product.mainImage}
                          alt={item.product.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-sm text-gray-900">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {order.currency.toUpperCase()}{" "}
                          {item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-gray-600">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cost Breakdown */}
              <div className="border-t pt-4 space-y-2 text-sm">
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
                  <span>Delivery fee</span>
                  <span>
                    {order.currency.toUpperCase()}{" "}
                    {order.costs.shipping.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>
                    {order.currency.toUpperCase()}{" "}
                    {order.costs.tax.toFixed(2)}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold text-gray-900">
                  <span>Total</span>
                  <span>
                    {order.currency.toUpperCase()}{" "}
                    {order.costs.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ORDER TRACKING - Desktop only */}
          <div className="hidden lg:block border rounded">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide bg-[#FAFAFA] border-b border-gray-200 p-3 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Order Tracking
            </h2>
            <div className="p-4">
              <OrderTimeline steps={timelineSteps} />
            </div>
          </div>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Delivery Method & Tracking */}
          <div className="border rounded">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide bg-[#FAFAFA] border-b border-gray-200 p-3 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Delivery Details
            </h2>
            <div className="p-4 space-y-3">
              {order.shipments && order.shipments.length > 0 ? (
                order.shipments.map((shipment, idx) => (
                  <div
                    key={idx}
                    className="pb-3 border-b last:border-b-0 last:pb-0 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">
                        Carrier
                      </span>
                      <p className="text-sm font-semibold text-gray-900">
                        {shipment.carrier}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">
                        Service
                      </span>
                      <p className="text-sm font-semibold text-gray-900">
                        {shipment.service}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">
                        Tracking Number
                      </span>
                      <a
                        href={shipment.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-primary hover:text-primary/80 underline"
                      >
                        {shipment.tracking_number}
                      </a>
                    </div>
                    {shipment.estimated_delivery_dates && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-medium">
                          Est. Delivery
                        </span>
                        <p className="text-sm font-semibold text-gray-900">
                          {new Date(
                            shipment.estimated_delivery_dates.from * 1000,
                          ).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">
                  Tracking info not available yet. Check back soon!
                </div>
              )}
            </div>
          </div>

          {/* RECIPIENT INFORMATION */}
          <div className="border rounded">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide bg-[#FAFAFA] border-b border-gray-200 p-3 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Recipient Information
            </h2>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">
                  Email address
                </span>
                <p className="text-sm text-gray-900 font-medium text-right">
                  {order.email}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">
                  Phone number
                </span>
                <p className="text-sm text-gray-900 font-medium">
                  {order.phone || "Not provided"}
                </p>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs text-gray-500 font-medium">
                  Delivery address
                </span>
                <p className="text-sm text-gray-900 font-medium text-right">
                  {order.deliveryAddress.street}
                  <br />
                  {order.deliveryAddress.city} {order.deliveryAddress.state}{" "}
                  {order.deliveryAddress.zip}
                  <br />
                  {order.deliveryAddress.country}
                </p>
              </div>
            </div>
          </div>

          {/* ORDER TRACKING - Mobile only */}
          <div className="block lg:hidden border rounded">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide bg-[#FAFAFA] border-b border-gray-200 p-3 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Order Tracking
            </h2>
            <div className="p-4">
              <OrderTimeline steps={timelineSteps} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
