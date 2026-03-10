"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardOverviewAction } from "@/lib/actions/analytics.actions";
import { Badge } from "@/components/ui/badge";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const days = parseInt(dateRange);
      const now = new Date();
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      const result = await getDashboardOverviewAction(startDate, now);
      if (result.success) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-gray-500 mt-1">
            Detailed insights and performance metrics.
          </p>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-gray-500 mt-1">
            Detailed insights and performance metrics.
          </p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="border border-input rounded-md px-3 py-2 text-sm"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {analytics && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  £{analytics.totalRevenue?.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Period revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{analytics.totalOrders}</p>
                <p className="text-xs text-muted-foreground">Orders placed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Order Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  £{analytics.avgOrderValue?.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Average per order
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  New Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{analytics.newCustomers}</p>
                <p className="text-xs text-muted-foreground">This period</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Orders by Status</CardTitle>
                <CardDescription>
                  Breakdown of orders by current status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {analytics.ordersByStatus?.map((status: any) => (
                  <div
                    key={status.status}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm capitalize">{status.status}</span>
                    <Badge variant="secondary">{status.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Currency</CardTitle>
                <CardDescription>Revenue breakdown by currency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.revenueByCurrency?.map((currency: any) => (
                  <div
                    key={currency.currency}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{currency.currency}</p>
                      <p className="text-xs text-muted-foreground">
                        {currency.orders} orders
                      </p>
                    </div>
                    <p className="text-lg font-bold">
                      {currency.currency} {currency.total?.toFixed(2)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {analytics.topProducts && analytics.topProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Products</CardTitle>
                <CardDescription>
                  Most ordered products this period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topProducts.map((product: any, idx: number) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between pb-2 border-b last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          #{idx + 1} {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          £{product.revenue?.toFixed(2)} revenue
                        </p>
                      </div>
                      <Badge>{product.orders} orders</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
