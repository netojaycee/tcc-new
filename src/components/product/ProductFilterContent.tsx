"use client";

import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "../ui/button";

interface FilterValues {
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  fits?: string[];
  materials?: string[];
  minRating?: number;
}

interface ProductFilterContentProps {
  onFilterChange?: (filters: FilterValues) => void;
  initialFilters?: FilterValues;
}

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];
const FIT_OPTIONS = ["Unisex", "Men", "Women"];
const MATERIAL_OPTIONS = ["Cotton", "Polyester", "Wool", "Blend"];

export function ProductFilterContent({ 
  onFilterChange, 
  initialFilters = {} 
}: ProductFilterContentProps) {
  const [filters, setFilters] = useState<FilterValues>(initialFilters);

  const handlePriceChange = (type: "min" | "max", value: number) => {
    const newFilters = { ...filters };
    if (type === "min") newFilters.minPrice = value;
    if (type === "max") newFilters.maxPrice = value;
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleSizeToggle = (size: string) => {
    const newSizes = (filters.sizes || []).includes(size)
      ? (filters.sizes || []).filter(s => s !== size)
      : [...(filters.sizes || []), size];
    const newFilters = { ...filters, sizes: newSizes };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleFitToggle = (fit: string) => {
    const newFits = (filters.fits || []).includes(fit)
      ? (filters.fits || []).filter(f => f !== fit)
      : [...(filters.fits || []), fit];
    const newFilters = { ...filters, fits: newFits };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleMaterialToggle = (material: string) => {
    const newMaterials = (filters.materials || []).includes(material)
      ? (filters.materials || []).filter(m => m !== material)
      : [...(filters.materials || []), material];
    const newFilters = { ...filters, materials: newMaterials };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleRatingChange = (rating: number) => {
    const newFilters = { ...filters, minRating: rating };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleReset = () => {
    setFilters({});
    onFilterChange?.({});
  };

  return (
    <div className="p-4 min-w-55">
      <h2 className="font-semibold mb-4">Filters</h2>

      <Accordion type="multiple" defaultValue={["price", "size"]} className="space-y-0">
        {/* Price Filter */}
        <AccordionItem value="price" className="border-b">
          <AccordionTrigger className="py-3">Price</AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-500">Min</label>
                <input
                  type="number"
                  value={filters.minPrice || ""}
                  onChange={e => handlePriceChange("min", Number(e.target.value) || 0)}
                  placeholder="$0"
                  className="w-full border rounded px-2 py-1 text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Max</label>
                <input
                  type="number"
                  value={filters.maxPrice || ""}
                  onChange={e => handlePriceChange("max", Number(e.target.value) || 0)}
                  placeholder="$1000"
                  className="w-full border rounded px-2 py-1 text-xs"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Size Filter */}
        <AccordionItem value="size" className="border-b">
          <AccordionTrigger className="py-3">Size</AccordionTrigger>
          <AccordionContent className="pb-3 ">
            <div className="space-y-2 grid grid-cols-4">
              {SIZE_OPTIONS.map(size => (
                <label key={size} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={(filters.sizes || []).includes(size)}
                    onChange={() => handleSizeToggle(size)}
                    className="rounded"
                  />
                  {size}
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Fit Filter */}
        {/* <AccordionItem value="fit" className="border-b">
          <AccordionTrigger className="py-3">Fit</AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="space-y-2">
              {FIT_OPTIONS.map(fit => (
                <label key={fit} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={(filters.fits || []).includes(fit)}
                    onChange={() => handleFitToggle(fit)}
                    className="rounded"
                  />
                  {fit}
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem> */}

        {/* Material Filter */}
        {/* <AccordionItem value="material" className="border-b">
          <AccordionTrigger className="py-3">Material</AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="space-y-2">
              {MATERIAL_OPTIONS.map(material => (
                <label key={material} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={(filters.materials || []).includes(material)}
                    onChange={() => handleMaterialToggle(material)}
                    className="rounded"
                  />
                  {material}
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem> */}

        {/* Rating Filter */}
        <AccordionItem value="rating" className="border-b">
          <AccordionTrigger className="py-3">Min Rating</AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(rating => (
                <label key={rating} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="rating"
                    checked={filters.minRating === rating}
                    onChange={() => handleRatingChange(rating)}
                  />
                  {"★".repeat(rating)} {rating}+
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {Object.keys(filters).some(key => filters[key as keyof FilterValues]) && (
        <Button
          onClick={handleReset}
          className="w-full text-sm "
        >
          Clear Filters
        </Button>
      )}
    </div>
  );
}
