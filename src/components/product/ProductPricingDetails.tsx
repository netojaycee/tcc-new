"use client";

import { Star } from "lucide-react";
import { useCurrency } from "@/lib/context/currency.context";

interface ProductPricingDetailsProps {
  name: string;
  basePrice: number;
  avgRating?: number;
  discountPercentage?: number;
  discountExpiry?: string | Date;
}

export function ProductPricingDetails({
  name,
  basePrice,
  avgRating,
  discountPercentage,
  discountExpiry,
}: ProductPricingDetailsProps) {
  const { convertAmount, formatPrice } = useCurrency();
  const convertedPrice = convertAmount(basePrice);

  const originalPrice = discountPercentage
    ? basePrice / (1 - (discountPercentage || 0) / 100)
    : undefined;
  const convertedOriginalPrice = originalPrice
    ? convertAmount(originalPrice)
    : undefined;

  return (
    <>
      {/* Rating and Sales */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={16}
              className={
                i < Math.floor(avgRating || 0)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }
            />
          ))}
        </div>
        <span className="text-xs md:text-sm text-gray-600">
          4.8/5{" "}
          <span className="mx-1 underline underline-offset-2">200 reviews</span>
        </span>
      </div>
      <h1 className="text-2xl md:text-3xl font-normal text-gray-900 mb-3">
        {name}
      </h1>

      {/* Price */}
      <div>
        <div className="flex items-baseline gap-2 mb-2 border-t border-b py-2">
          <span className="text-2xl md:text-3xl font-bold text-gray-900">
            {formatPrice(basePrice, convertedPrice)}
          </span>
          {discountPercentage && originalPrice && convertedOriginalPrice && (
            <span className="text-sm md:text-base text-gray-500 line-through">
              {formatPrice(originalPrice, convertedOriginalPrice)}
            </span>
          )}
        </div>
        {discountPercentage && discountExpiry && (
          <p className="text-xs text-red-600">
            Discount expires:{" "}
            {new Date(discountExpiry).toLocaleDateString()}
          </p>
        )}
      </div>
    </>
  );
}
