import Link from "next/link";
import Image from "next/image";
import { Product } from "@/lib/hooks/use-products";
import { Star } from "lucide-react";
import { AddToCartButton } from "./AddToCartButton";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  // Calculate average rating from reviews (if available in future)
  const rating = product.avgRating || 4;
  const soldCount = 3;
  // const categoryName = product.category?.title || product.type || "PRODUCT";

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
      href={`/product/${product.productType}/${product.slug}`}
    >
      <div className="group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg">
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
          {product.description && (
            <p className="text-xs text-gray-600 line-clamp-2 h-8">
              {product.description}
            </p>
          )}

          {/* Rating and Review Count */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              {renderStars(rating)}
              {soldCount > 0 && (
                <p className="text-xs text-gray-500">({soldCount}+ sold)</p>
              )}
            </div>
          </div>

          {/* Price */}
          <p className="text-lg font-bold text-gray-900 pt-1">
            {new Intl.NumberFormat("en-CA", {
              style: "currency",
              currency: "CAD",
            }).format(product.basePrice)}
          </p>

          {/* <AddToCartButton productId={product.id} /> */}
        </div>
      </div>
    </Link>
  );
}
