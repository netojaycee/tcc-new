"use client";

import { Star } from "lucide-react";

import { Review } from "@prisma/generated";
import TabsView from "./TabsView";
import AccordionView from "./AccordionView";

interface ProductInfoTabsProps {
  description: string | null | undefined;
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
}

export function ProductInfoTabs({
  description,
  reviews,
  averageRating,
  reviewCount,
}: ProductInfoTabsProps) {
  return (
    <>
      <TabsView
        description={description}
        reviews={reviews}
        averageRating={averageRating}
        reviewCount={reviewCount}
      />
      <AccordionView
        description={description}
        reviews={reviews}
        averageRating={averageRating}
        reviewCount={reviewCount}
      />
    </>
  );
}
