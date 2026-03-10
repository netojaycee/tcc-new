"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/admin/pagination";
import { getAdminPromoCodesAction } from "@/lib/actions/admin.actions";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

const LIMIT = 10;

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchPromoCodes = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAdminPromoCodesAction(page, LIMIT);
      if (result.success) {
        setPromoCodes(result.data || []);
        setTotal(result.total || 0);
        setPages(result.pages || 1);
      }
    } catch (error) {
      console.error("Error fetching promo codes:", error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchPromoCodes();
  }, [fetchPromoCodes]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Promo Codes</h1>
          <p className="text-gray-500 mt-1">Create and manage promotional codes.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Promo Code
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Promo Codes</CardTitle>
          <CardDescription>Total: {total} promo codes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : promoCodes.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left font-semibold">Code</th>
                      <th className="px-4 py-3 text-left font-semibold">Type</th>
                      <th className="px-4 py-3 text-left font-semibold">Value</th>
                      <th className="px-4 py-3 text-left font-semibold">Uses</th>
                      <th className="px-4 py-3 text-left font-semibold">Expiry</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promoCodes.map((code) => (
                      <tr key={code.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{code.code}</td>
                        <td className="px-4 py-3 capitalize">{code.type}</td>
                        <td className="px-4 py-3">
                          {code.type === "percent" ? `${code.value}%` : `£${code.value.toFixed(2)}`}
                        </td>
                        <td className="px-4 py-3">
                          {code.usedCount} / {code.maxUses || "∞"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {code.expiry ? new Date(code.expiry).toLocaleDateString("en-GB") : "Never"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={code.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {code.active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
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
            <p className="text-center text-muted-foreground py-6">No promo codes found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
