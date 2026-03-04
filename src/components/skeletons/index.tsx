/**
 * Combined skeleton loaders for sections
 */
import { SkeletonProductCard } from "./SkeletonProductCard";
import { SkeletonCategoryCard } from "./SkeletonCategoryCard";

export function SkeletonProductGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonCategoryGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {[...Array(count)].map((_, i) => (
        <SkeletonCategoryCard key={i} />
      ))}
    </div>
  );
}

export { SkeletonProductCard, SkeletonCategoryCard };
