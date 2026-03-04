import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Star } from "lucide-react";

export default function AccordionView({
  description,
  reviews,
  averageRating,
  reviewCount,
}: any) {
  return (
    <div className="md:hidden mt-8 border-t pt-8 space-y-2">
      <Accordion type="single" collapsible defaultValue="">
        {/* Description Accordion */}
        <AccordionItem value="description" className="border-b">
          <AccordionTrigger className="py-3 text-left font-medium text-gray-900 hover:no-underline hover:text-gray-700">
            Description
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            {description ? (
              <div className="space-y-3 text-gray-700 text-sm">
                <p>{description}</p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No description available</p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Reviews Accordion */}
        <AccordionItem value="reviews" className="border-b">
          <AccordionTrigger className="py-3 text-left font-medium text-gray-900 hover:no-underline hover:text-gray-700">
            Customer reviews
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-4">
              {/* Rating Summary */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={
                          i < Math.floor(averageRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-sm text-gray-900">
                    {averageRating.toFixed(1)} out of 5 ({reviewCount})
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  All reviews are from verified buyers
                </p>
              </div>

              {/* Reviews List */}
              <div className="space-y-3">
                {reviews.length > 0 ? (
                  reviews.map((review: any, idx: any) => (
                    <div key={idx} className="pb-3 border-b last:border-b-0">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-0.5 mb-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={
                                  i < (review.rating || 0)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }
                              />
                            ))}
                          </div>
                          <p className="text-gray-700 text-xs mb-1">
                            {(review as any)?.comment}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span className="font-medium">
                              {(review as any)?.name}
                            </span>
                            {(review as any)?.createdAt && (
                              <>
                                <span>•</span>
                                <span>
                                  {new Date(
                                    (review as any)?.createdAt,
                                  ).toLocaleDateString()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-xs">No reviews yet</p>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
