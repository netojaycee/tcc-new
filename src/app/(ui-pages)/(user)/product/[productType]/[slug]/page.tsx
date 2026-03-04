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
import { Star } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Review } from "@prisma/generated";
import { getProductsByCategoryAction } from "@/lib/actions/search.actions";

interface ProductPageProps {
  params: Promise<{ slug: string; productType: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug, productType } = await params;

  // Fetch product by slug using server action
  const result = await getProductAction(slug);

  if (!result.success || !result.data) {
    notFound();
  }

  const product = result.data;

  // console.log(product, "product");

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

  // Use product data or fallbacks for accordion content
  const whatIncluded = product.whatIncluded?.length
    ? product.whatIncluded
    : ([
        "Chocolate",
        "Chips",
        "Cookies",
        "Water",
        "Branded pen",
        "Crisps",
        "Biscuits",
      ] as string[]);

  const perfectFor = product.perfectFor?.length
    ? product.perfectFor
    : (["Anniversaries", "Employee incentives", "Casual Gifting"] as string[]);

  const whyChoose = product.whyChoose?.length
    ? product.whyChoose
    : [
        "Budget-friendly without compromising quality",
        "Seasonal and festive occasions",
        "Perfect gift for all ages and packaging occasions",
      ];

  const deliveryInfo = product.deliveryInfo || {
    title: "Royal Mail 24/7-verified Delivery - £4.50 | 2-4 days.",
    details: [
      "Acceptable ID includes a passport or driving license.",
      "If no suitable ID is provided, Royal Mail will leave instructions for redelivery or collection.",
    ],
  };

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
        {/* Reviews Section */}
        {/* <ReviewsSection
          averageRating={product.avgRating || 0}
          reviewCount={product.reviewCount || 0}
          reviews={reviews as any}
        /> */}
        {/* Additional Info Accordions */}
        {/* <div className="mt-8 space-y-3">
          <Accordion
            type="single"
            collapsible
            className="bg-[#E5E5E5]/30 p-2"
            defaultValue="perfect"
          >
            <AccordionItem value="perfect" className="">
              <AccordionTrigger className="px-4 py-3 underline underline-offset-3">
                Perfect For?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <ul className="space-y-2">
                  {perfectFor.map((item: string, idx: number) => (
                    <li
                      key={idx}
                      className="text-sm text-gray-700 flex items-start gap-2"
                    >
                      <span className="text-gray-400">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion
            type="single"
            collapsible
            className="bg-[#E5E5E5]/30 p-2"
            defaultValue="why"
          >
            <AccordionItem value="why" className="">
              <AccordionTrigger className="px-4 py-3 underline underline-offset-3">
                Why Choose this Package?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <ul className="space-y-2">
                  {whyChoose.map((item: string, idx: number) => (
                    <li
                      key={idx}
                      className="text-sm text-gray-700 flex items-start gap-2"
                    >
                      <span className="text-gray-400">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion
            type="single"
            collapsible
            className="bg-[#E5E5E5]/30 p-2"
            defaultValue="delivery"
          >
            <AccordionItem value="delivery" className="">
              <AccordionTrigger className="px-4 py-3 underline underline-offset-3">
                Delivery
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {deliveryInfo.title}
                  </p>
                  <ul className="space-y-2">
                    {deliveryInfo.details.map((detail: string, idx: number) => (
                      <li
                        key={idx}
                        className="text-sm text-gray-700 flex items-start gap-2"
                      >
                        <span className="text-gray-400">•</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div> */}

        {/* You May Also Like */}
        <div className="mt-12 border-t pt-8">
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
            You may also like
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
