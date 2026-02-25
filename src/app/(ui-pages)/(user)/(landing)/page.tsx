import { HeroSection } from "@/components/landing/HeroSection";
import { CatalogCategoriesSection } from "@/components/landing/CatalogCategoriesSection";
import { BestSellingSection } from "@/components/landing/BestSellingSection";
import { ValuePropsSection } from "@/components/landing/ValuePropsSection";
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <HeroSection />

      {/* Best Selling Section */}
      <BestSellingSection />

      {/* Catalog Categories Section */}
      <CatalogCategoriesSection />

      {/* Value Props Section */}
      <ValuePropsSection />
    </div>
  );
}
