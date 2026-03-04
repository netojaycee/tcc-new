"use client"
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/lib/hooks/use-products";
import { Pencil, PencilOff, Star } from "lucide-react";
import { AddToCartButton } from "./AddToCartButton";
import { useCurrency } from "@/lib/context/currency.context";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { convertAmount, currency, formatPrice } = useCurrency();

  // Calculate average rating from reviews (if available in future)
  const rating = product.avgRating || 4;
  const soldCount = 3;
  // const categoryName = product.category?.title || product.type || "PRODUCT";

  // Convert price to user's currency
  const convertedPrice = convertAmount(product.basePrice);

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={
              star <= Math.round(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }
          />
        ))}
      </div>
    );
  };

  return (
    <Link
      prefetch={true}
      href={`/products/${product.productType}/${product.slug}`}
    >
      <div className="group cursor-pointer overflow-hidden rounded-none border-none bg-white transition-shadow hover:shadow-lg">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {product.mainImage ? (
            <Image
              src={product.mainImage}
              alt={product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gray-200">
              <span className="text-sm text-gray-500">No Image</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-3 space-y-2">
          {/* Product Name */}
          <h3 className="underline text-sm font-semibold text-gray-900 line-clamp-1">
            {product.name}
          </h3>

          {/* Description */}
          {/* {product.description && ( */}
          {/* <p className="text-xs text-gray-600 line-clamp-2 h-8">
              {product.description}
            </p> */}
          {/* )} */}

          {/* Rating and Review Count */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              {renderStars(rating)}
              {soldCount > 0 && (
                <p className="text-xs text-gray-500">({soldCount}+ sold)</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            {/* Price - Converted to user's currency */}
            <p className="text-lg font-bold text-gray-900 pt-1">
              {formatPrice(product.basePrice, convertedPrice)}
            </p>
            {product.productType === "catalog" ? (
              <Pencil className="w-4 h-4 text-gray-500" />
            ) : (
              <PencilOff className="w-4 h-4 text-red-500" />
            )}
          </div>

          {/* <AddToCartButton productId={product.id} /> */}
        </div>
      </div>
    </Link>
  );
}
