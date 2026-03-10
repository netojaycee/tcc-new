"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/admin/pagination";
import { getAdminProductsAction } from "@/lib/actions/admin.actions";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";
import Image from "next/image";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"store" | "catalog" | "">("");

  const LIMIT = 10;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAdminProductsAction(
        page,
        LIMIT,
        search || undefined,
        type ? type : undefined
      );
      if (result.success) {
        setProducts(result.data || []);
        setTotal((result as any).total || 0);
        setPages(result.pages || 1);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, type]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-gray-500 mt-1">Manage your product inventory and details.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Inventory</CardTitle>
          <CardDescription>Total: {total} products</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search products by name or slug..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as "store" | "catalog" | "");
                setPage(1);
              }}
              className="border border-input rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Types</option>
              <option value="store">Store</option>
              <option value="catalog">Catalog</option>
            </select>
          </div>

          {/* Table */}
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
                      <th className="px-4 py-3 text-left font-semibold">Image</th>
                      <th className="px-4 py-3 text-left font-semibold">Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Type</th>
                      <th className="px-4 py-3 text-left font-semibold">Price</th>
                      <th className="px-4 py-3 text-left font-semibold">Sales</th>
                      <th className="px-4 py-3 text-left font-semibold">Rating</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {product.mainImage ? (
                            <Image
                              src={product.mainImage}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="rounded"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <a href={`/admin/products/${product.id}`} className="font-medium text-blue-600 hover:underline">
                            {product.name}
                          </a>
                        </td>
                        <td className="px-4 py-3 capitalize">{product.productType}</td>
                        <td className="px-4 py-3 font-semibold">£{product.basePrice.toFixed(2)}</td>
                        <td className="px-4 py-3">{product.soldCount}</td>
                        <td className="px-4 py-3">
                          {product.avgRating > 0 ? (
                            <span>{product.avgRating.toFixed(1)} ⭐</span>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={product.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {product.active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
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
