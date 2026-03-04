/**
 * Skeleton loader for CategoryCard
 * Shows animated pulse effect while category is loading
 */
export function SkeletonCategoryCard() {
  return (
    <div className="space-y-3 p-4">
      {/* Image skeleton */}
      <div className="relative bg-gray-200 dark:bg-gray-700 rounded-lg aspect-square animate-pulse" />

      {/* Title skeleton */}
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />

      {/* Count skeleton */}
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
    </div>
  );
}
