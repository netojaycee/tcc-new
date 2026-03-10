"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/admin/pagination";
import { getAdminProductsAction } from "@/lib/actions/admin.actions";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

const LIMIT = 10;

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAdminProductsAction(page, LIMIT, search || undefined);
      if (result.success) {
        setProducts(result.data || []);
        setTotal(result.total || 0);
        setPages(result.pages || 1);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const lowStockProducts = products.filter((p) => (p.soldCount || 0) > 50);
  const totalValue = products.reduce((sum, p) => sum + (p.basePrice || 0) * 10, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
        <p className="text-gray-500 mt-1">Track stock levels and product availability.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">Active in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">High-Demand Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{lowStockProducts.length}</p>
            <p className="text-xs text-muted-foreground">Over 50 units sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Est. Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">£{totalValue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Inventory value (est.)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Inventory</CardTitle>
          <CardDescription>Search and track product stock information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border border-input rounded-md px-3 py-2 w-full text-sm"
          />

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left font-semibold">Product</th>
                      <th className="px-4 py-3 text-left font-semibold">Price</th>
                      <th className="px-4 py-3 text-left font-semibold">Units Sold</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Demand Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const soldCount = product.soldCount || 0;
                      const demandLevel = soldCount > 50 ? "High" : soldCount > 20 ? "Medium" : "Low";
                      const demandColor =
                        demandLevel === "High"
                          ? "bg-red-100 text-red-800"
                          : demandLevel === "Medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800";

                      return (
                        <tr key={product.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {product.mainImage && (
                                <Image
                                  src={product.mainImage}
                                  alt={product.name}
                                  width={32}
                                  height={32}
                                  className="rounded"
                                />
                              )}
                              <span className="font-medium">{product.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">£{product.basePrice?.toFixed(2)}</td>
                          <td className="px-4 py-3 font-semibold">{soldCount}</td>
                          <td className="px-4 py-3">
                            <Badge className={product.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                              {product.active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={demandColor}>{demandLevel}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {pages > 1 && (
                <div className="flex justify-center pt-4">
                  <Pagination
                    currentPage={page}
                    totalPages={pages}
                    onPageChange={setPage}
                    isLoading={loading}
                  />
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-muted-foreground py-6">No products found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
       