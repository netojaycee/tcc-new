import {
  getProductAction,
  getProductsAction,
  getRelatedProductsAction,
  // getRelatedProductsAction,
} from "@/lib/actions/product.actions";
import { getProductReviewsAction } from "@/lib/actions/review.actions";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ProductCard } from "@/components/product/ProductCard";
import { ReviewsSection } from "@/components/product/ReviewsSection";
import { ProductDetailsGrid } from "@/components/product/ProductDetailsGrid";
import { ProductPricingDetails } from "@/components/product/ProductPricingDetails";
import { ProductInfoTabs } from "@/components/product/ProductInfoTabs";
import { Star } from "lucide-react";
import { Review } from "@prisma/generated";
import { getProductsByCategoryAction } from "@/lib/actions/search.actions";

interface ProductPageProps {
  params: Promise<{ slug: string; categorySlug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug, categorySlug: productType } = await params;

  // Fetch product by slug using server action
  const result = await getProductAction(slug);

  if (!result.success || !result.data) {
    notFound();
  }

  const product = result.data;


  console.log(product, "product");

  // Fetch real reviews
  const reviewsResult = await getProductReviewsAction(product.id, 10, 0);
  const reviews = reviewsResult.success ? reviewsResult.data : ([] as Review[]);

  // Fetch related products from same category
  const relatedResult = await getRelatedProductsAction({
    categoryId: product.categoryId,
  });
  const relatedProducts = relatedResult.success
    ? relatedResult.data
    : ([] as typeof relatedResult.data);

  // use all products with limit 4 in same category as fallback for related products
  // const relatedResult = await getProductsByCategoryAction(product.categoryId, {
  //   limit: 4,
  //   offset: 0,
  //   sortBy: "newest",
  // });
  // const relatedProducts = relatedResult.success
  //   ? relatedResult.data.products
  //   : ([] as any[]);

  // console.log("Related products:", relatedResult, product);


  return (
    <div className="bg-white">
      <div className="px-4 py-4 lg:px-16 md:py-8">
        <ProductDetailsGrid
          productId={product.id}
          variants={product.variants as any}
          defaultGalleryImages={product.gallery || []}
          productType={productType}
          detailsContent={
            <>
              {/* Product Pricing Details with Currency Conversion */}
              <ProductPricingDetails
                name={product.name}
                basePrice={product.basePrice}
                avgRating={product.avgRating}
                discountPercentage={product.discountPercentage}
                discountExpiry={product.discountExpiry}
              />
            </>
          }
        />
        
        {/* Product Info Tabs - Description & Reviews */}
        <ProductInfoTabs 
          description={product.description}
          reviews={reviews as any}
          averageRating={product.avgRating || 0}
          reviewCount={product.reviewCount || 0}
        />

        {/* You May Also Like */}
        <div className="mt-12 border-t pt-8">
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
            shop related items
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts &&
              relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
