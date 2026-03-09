"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export interface SizeTableMeasurement {
  type_label: string;
  values: Array<{
    size: string;
    value?: string;
    min_value?: string;
    max_value?: string;
  }>;
}

export interface SizeTable {
  type: "measure_yourself" | "product_measure" | "international";
  unit: "inches" | "cm" | "none";
  description?: string;
  image_url?: string;
  image_description?: string;
  measurements: SizeTableMeasurement[];
}

export interface SizeGuideData {
  product_id: number;
  available_sizes: string[];
  size_tables: SizeTable[];
}

interface SizeGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sizeGuideData?: SizeGuideData | null;
}

export function SizeGuideModal({
  open,
  onOpenChange,
  sizeGuideData,
}: SizeGuideModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[90%] md:w-full md:max-w-4xl h-[80vh] overflow-y-auto">
        <DialogHeader  className="text-left">
          <DialogTitle>Size Guide</DialogTitle>
          <DialogDescription>
            Find your perfect fit using our size guide
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 space-y-6">
          {sizeGuideData && sizeGuideData.size_tables ? (
            sizeGuideData.size_tables.map((table, tableIdx) => (
              <div key={tableIdx} className="space-y-3">
                {/* Table header with unit and type */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {table.type === "measure_yourself"
                      ? "Measure Yourself"
                      : table.type === "product_measure"
                        ? "Product Measurements"
                        : "Size Chart"}{" "}
                    {table.unit !== "none" && `(${table.unit})`}
                  </h3>
                  {table.description && (
                    <p
                      className="text-sm text-gray-600 mb-2"
                      dangerouslySetInnerHTML={{
                        __html: table.description.replace(/\\n/g, "<br/>"),
                      }}
                    />
                  )}
                  {table.image_url && (
                    <div className="my-3">
                      <Image
                        width={600}
                        height={600}
                        src={table.image_url}
                        alt={table.type}
                        className="w-full h-auto rounded border border-gray-200"
                      />
                      {table.image_description && (
                        <p
                          className="text-xs text-gray-600 mt-2"
                          dangerouslySetInnerHTML={{
                            __html: table.image_description.replace(/\\n/g, "<br/>"),
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Size tables */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">
                          Size
                        </th>
                        {table.measurements.map((measurement, mIdx) => (
                          <th
                            key={mIdx}
                            className="text-left py-3 px-4 font-semibold text-gray-900"
                          >
                            {measurement.type_label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.measurements[0]?.values.map((_, rowIdx) => (
                        <tr
                          key={rowIdx}
                          className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {table.measurements[0].values[rowIdx]?.size}
                          </td>
                          {table.measurements.map((measurement, mIdx) => (
                            <td key={mIdx} className="py-3 px-4 text-gray-700">
                              {measurement.values[rowIdx]?.value ||
                                (measurement.values[rowIdx]?.min_value &&
                                  measurement.values[rowIdx]?.max_value &&
                                  `${measurement.values[rowIdx]?.min_value} - ${measurement.values[rowIdx]?.max_value}`) ||
                                "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">
                Size guide information is not available for this product.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
