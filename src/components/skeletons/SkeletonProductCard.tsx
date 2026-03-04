/**
 * Skeleton loader for ProductCard
 * Shows animated pulse effect while product is loading
 */
export function SkeletonProductCard() {
  return (
    <div className="space-y-4 p-4">
      {/* Image skeleton */}
      <div className="relative bg-gray-200 dark:bg-gray-700 rounded-lg aspect-square animate-pulse" />

      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse" />
      </div>

      {/* Price skeleton */}
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse mt-2" />

      {/* Rating skeleton */}
      <div className="space-y-2">
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
            />
          ))}
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/4 animate-pulse" />
      </div>

      {/* Button skeleton */}
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mt-4 animate-pulse" />
    </div>
  );
}
