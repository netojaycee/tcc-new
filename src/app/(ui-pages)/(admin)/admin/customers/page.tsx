"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/admin/pagination";
import { getAdminCustomersAction } from "@/lib/actions/admin.actions";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const LIMIT = 10;

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAdminCustomersAction(page, LIMIT, search || undefined);
      if (result.success) {
        setCustomers(result.data || []);
        setTotal(result.total || 0);
        setPages(result.pages || 1);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-gray-500 mt-1">Manage and view customer information.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>Total: {total} customers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : customers.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-3 text-left font-semibold">Customer</th>
                      <th className="px-4 py-3 text-left font-semibold">Email</th>
                      <th className="px-4 py-3 text-left font-semibold">Orders</th>
                      <th className="px-4 py-3 text-left font-semibold">Total Spent</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {getInitials(customer.firstName, customer.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <a href={`/admin/customers/${customer.id}`} className="font-medium text-blue-600 hover:underline">
                              {customer.firstName} {customer.lastName}
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{customer.email}</td>
                        <td className="px-4 py-3">{customer._count?.orders || 0}</td>
                        <td className="px-4 py-3 font-semibold">£{customer.totalSpent.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <Badge className={customer.verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                            {customer.verified ? "Verified" : "Unverified"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(customer.createdAt).toLocaleDateString("en-GB")}
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
            <p className="text-center text-muted-foreground py-6">No customers found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
