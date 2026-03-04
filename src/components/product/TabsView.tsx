import React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Star, User2 } from "lucide-react";

interface TabsViewProps {
  description: string | null | undefined;
  reviews: any[];
  averageRating: number;
  reviewCount: number;
}

export default function TabsView({
  description,
  reviews,
  averageRating,
  reviewCount,
}: TabsViewProps) {
  return (
    <Tabs
      defaultValue="description"
      className="hidden md:block mt-8 border-t pt-8"
    >
      <TabsList className="grid w-full max-w-md grid-cols-2 border-b bg-transparent p-0 rounded-none h-auto">
        <TabsTrigger
          value="description"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent "
        >
          Description
        </TabsTrigger>
        <TabsTrigger
          value="reviews"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent"
        >
          Customer reviews
        </TabsTrigger>
      </TabsList>

      <TabsContent value="description" className="mt-6">
        {description ? (
          <div className="space-y-4 text-gray-700">
            <p>{description}</p>
          </div>
        ) : (
          <p className="text-gray-500">No description available</p>
        )}
      </TabsContent>

      <TabsContent value="reviews" className="mt-6">
        <div className="space-y-6">
          {/* Rating Summary */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={
                      i < Math.floor(averageRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>
              <span className="font-semibold text-gray-900">
                {averageRating.toFixed(1)} out of 5 ({reviewCount} reviews)
              </span>
            </div>
            <p className="text-sm text-gray-600">
              All reviews are from verified buyers
            </p>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.length > 0 ? (
              reviews.map((review, idx) => (
                <div key={idx} className="pb-4 border-b last:border-b-0">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-0.5 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={
                              i < (review.rating || 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }
                          />
                        ))}
                      </div>
                      <p className="text-gray-700 text-sm mb-2">
                        {(review as any).comment}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <User2 size={12} />
                        <span className="font-medium">
                          {(review as any).name}
                        </span>
                        {(review as any).createdAt && (
                          <>
                            <span>•</span>
                            <span>
                              {new Date(
                                (review as any).createdAt,
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
              <p className="text-gray-500 text-sm">No reviews yet</p>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
