"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserOrdersAction } from "@/lib/actions/order.actions";
import { OrderCard } from "@/components/orders/OrderCard";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface Order {
  id: string;
  orderNumber: string;
  status: "draft" | "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "failed";
  createdAt: Date;
  total: number;
  items: any[];
  currency?: string;
}

export default function AllOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const result = await getUserOrdersAction(50, 0);

        if (result.success) {
          setOrders((result as any)?.data || []);
        } else {
          setError(result.error || "Failed to fetch orders");
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen px-4 lg:px-16 py-8 bg-white">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
        <div className="space-y-4 max-w-4xl">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen px-4 lg:px-16 py-8 bg-white">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
        <div className="max-w-4xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen px-4 lg:px-16 py-8 bg-white">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
        <div className="max-w-4xl">
          <div className="text-center py-16">
            <p className="text-gray-600 mb-6">You haven&apos;t placed any orders yet</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 lg:px-16 py-8 bg-white">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

      <div className="max-w-4xl space-y-4">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            id={order.id}
            orderNumber={order.orderNumber}
            status={order.status}
            createdAt={order.createdAt}
            total={order.total}
            itemCount={order.items?.length || 0}
            currency={order.currency}
          />
        ))}
      </div>
    </div>
  );
}
