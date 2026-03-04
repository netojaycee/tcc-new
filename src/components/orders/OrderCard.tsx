"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

interface OrderCardProps {
  id: string;
  orderNumber: string;
  status: "draft" | "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "failed";
  createdAt: Date;
  total: number;
  itemCount: number;
  currency?: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800" },
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  paid: { label: "Processing", color: "bg-blue-100 text-blue-800" },
  processing: { label: "Processing", color: "bg-blue-100 text-blue-800" },
  shipped: { label: "On delivery", color: "bg-orange-100 text-orange-800" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
  failed: { label: "Failed", color: "bg-red-100 text-red-800" },
};

export function OrderCard({
  id,
  orderNumber,
  status,
  createdAt,
  total,
  itemCount,
  currency = "CAD",
}: OrderCardProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const formattedDate = new Date(createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const formattedTime = new Date(createdAt).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <Link href={`/orders/${orderNumber}`}>
      <div className="border border-gray-200 rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow">
        {/* Header - Order Number and Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm md:text-base">
              Order #{orderNumber}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {formattedDate} • {formattedTime}
            </p>
          </div>
          <Badge className={`${config.color} whitespace-nowrap ml-2`}>
            {config.label}
          </Badge>
        </div>

        {/* Items Info */}
        <div className="flex items-center justify-between py-3 border-t border-b border-gray-100">
          <p className="text-sm text-gray-600">
            {itemCount} {itemCount === 1 ? "item" : "items"} ordered
          </p>
          <p className="text-lg font-bold text-gray-900">
            {currency.toUpperCase()} {total.toFixed(2)}
          </p>
        </div>

        {/* Footer - Navigate Indicator */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-gray-500">View details</span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </Link>
  );
}
