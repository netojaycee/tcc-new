import { HeroSection } from "@/components/landing/HeroSection";
import { CatalogCategoriesSection } from "@/components/landing/CatalogCategoriesSection";
import { BestSellingSection } from "@/components/landing/BestSellingSection";
import { ValuePropsSection } from "@/components/landing/ValuePropsSection";
import { SkeletonProductGrid, SkeletonCategoryGrid } from "@/components/skeletons";
import { Suspense } from "react";
// export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <HeroSection />

      {/* Best Selling Section */}
      <Suspense fallback={<SkeletonProductGrid count={8} />}>
        <BestSellingSection />
      </Suspense>

      {/* Catalog Categories Section */}
      <Suspense fallback={<SkeletonCategoryGrid count={6} />}>
        <CatalogCategoriesSection />
      </Suspense>
      {/* Value Props Section */}
      <ValuePropsSection />
    </div>
  );
}
