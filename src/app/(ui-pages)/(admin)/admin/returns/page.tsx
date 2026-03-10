"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/admin/pagination";
import { getAdminReturnsAction } from "@/lib/actions/admin.actions";
import { Badge } from "@/components/ui/badge";

const LIMIT = 10;

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function ReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("");

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAdminReturnsAction(page, LIMIT, status || undefined);
      if (result.success) {
        setReturns(result.data || []);
        setTotal(result.total || 0);
        setPages(result.pages || 1);
      }
    } catch (error) {
      console.error("Error fetching returns:", error);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Returns</h1>
        <p className="text-gray-500 mt-1">Manage customer returns and refunds.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Return Requests</CardTitle>
          <CardDescription>Total: {total} returns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="border border-input rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : returns.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left font-semibold">Return #</th>
                      <th className="px-4 py-3 text-left font-semibold">Order #</th>
                      <th className="px-4 py-3 text-left font-semibold">Customer Email</th>
                      <th className="px-4 py-3 text-left font-semibold">Reason</th>
                      <th className="px-4 py-3 text-left font-semibold">Refund Amount</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returns.map((ret) => (
                      <tr key={ret.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{ret.returnNumber}</td>
                        <td className="px-4 py-3 font-medium text-blue-600">{ret.order.orderNumber}</td>
                        <td className="px-4 py-3 text-muted-foreground">{ret.order.email}</td>
                        <td className="px-4 py-3">{ret.reason}</td>
                        <td className="px-4 py-3 font-semibold">£{ret.refundAmount?.toFixed(2) || "0.00"}</td>
                        <td className="px-4 py-3">
                          <Badge className={statusColors[ret.status] || "bg-gray-100 text-gray-800"}>
                            {ret.status}
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
            <p className="text-center text-muted-foreground py-6">No returns found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
