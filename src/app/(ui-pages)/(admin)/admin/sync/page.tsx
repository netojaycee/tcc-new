"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";

interface SyncStatus {
  store?: {
    success: boolean;
    data?: {
      message: string;
      results: any[];
    };
    error?: string;
  };
  catalog?: {
    success: boolean;
    data?: {
      message: string;
      results: any[];
    };
    error?: string;
  };
  categories?: {
    success: boolean;
    data?: {
      message: string;
      results: any[];
    };
    error?: string;
  };
}

interface Stats {
  storeProducts: number;
  catalogProducts: number;
  totalProducts: number;
}

export default function AdminSyncPage() {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load initial stats
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch("/api/v1/admin/sync");
      const data = await res.json();
      if (data.success) {
        setStats({
          storeProducts: data.stats.store,
          catalogProducts: data.stats.catalog,
          totalProducts: data.stats.total,
        });
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  const handleSync = async (type: "store" | "catalog" | "all") => {
    setSyncing(type);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/v1/admin/sync?type=${type}`, {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        setSyncStatus(data.results);
        setStats(data.summary);
      } else {
        setError(data.error || "Sync failed");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect to API"
      );
    } finally {
      setLoading(false);
      setSyncing(null);
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Sync</h1>
          <p className="text-gray-600 mt-2">
            Manually synchronize products from Printful
          </p>
        </div>

        {/* Stats Card */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Store Products</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.storeProducts}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Catalog Products</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.catalogProducts}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Total Products</div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.totalProducts}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sync Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Sync Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => handleSync("store")}
                disabled={loading}
                className="w-full"
                variant={syncing === "store" ? "default" : "outline"}
              >
                {syncing === "store" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {syncing === "store" ? "Syncing..." : "Sync Store"}
              </Button>

              <Button
                onClick={() => handleSync("catalog")}
                disabled={loading}
                className="w-full"
                variant={syncing === "catalog" ? "default" : "outline"}
              >
                {syncing === "catalog" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {syncing === "catalog" ? "Syncing..." : "Sync Catalog"}
              </Button>

              <Button
                onClick={() => handleSync("all")}
                disabled={loading}
                className="w-full"
                variant={syncing === "all" ? "default" : "outline"}
              >
                {syncing === "all" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {syncing === "all" ? "Syncing..." : "Sync All"}
              </Button>
            </div>

            <Button
              onClick={loadStats}
              disabled={loading}
              variant="ghost"
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Stats
            </Button>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 flex gap-4">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-red-900">Sync Error</div>
                <div className="text-sm text-red-700 mt-1">{error}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Alert */}
        {syncStatus && !error && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6 flex gap-4">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-green-900">
                  Sync Completed Successfully
                </div>

                {/* Store Results */}
                {syncStatus.store && (
                  <div className="mt-3 text-sm text-green-700">
                    <div className="font-medium">Store Products:</div>
                    {syncStatus.store.success ? (
                      <div className="text-green-600">
                        ✓ {syncStatus.store.data?.message}
                      </div>
                    ) : (
                      <div className="text-red-600">
                        ✗ {syncStatus.store.error}
                      </div>
                    )}
                  </div>
                )}

                {/* Catalog Results */}
                {syncStatus.catalog && (
                  <div className="mt-2 text-sm text-green-700">
                    <div className="font-medium">Catalog Products:</div>
                    {syncStatus.catalog.success ? (
                      <div className="text-green-600">
                        ✓ {syncStatus.catalog.data?.message}
                      </div>
                    ) : (
                      <div className="text-red-600">
                        ✗ {syncStatus.catalog.error}
                      </div>
                    )}
                  </div>
                )}

                {/* Categories Results */}
                {syncStatus.categories && (
                  <div className="mt-2 text-sm text-green-700">
                    <div className="font-medium">Categories:</div>
                    {syncStatus.categories.success ? (
                      <div className="text-green-600">
                        ✓ {syncStatus.categories.data?.message}
                      </div>
                    ) : (
                      <div className="text-red-600">
                        ✗ {syncStatus.categories.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-sm text-blue-700 space-y-2">
              <p className="font-medium">ℹ️ Sync Information</p>
              <ul className="space-y-1 text-xs">
                <li>
                  • <strong>Sync Store:</strong> Pulls products from your Printful store
                </li>
                <li>
                  • <strong>Sync Catalog:</strong> Pulls from Printful catalog
                </li>
                <li>
                  • <strong>Sync All:</strong> Syncs store, catalog, and categories
                </li>
                <li>
                  • Only in-stock variants are saved (availability_status check)
                </li>
                <li>• Products with no available variants are skipped</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
