"use client";

import React, { useState } from "react";
import {
  fetchAndSyncAllStoreProductsAction,
  fetchAndSyncCategoriesAction,
  fetchAndSyncAllCatalogProductsAction,
  syncAllPrintfulDataAction,
} from "@/lib/actions/product.actions";

export default function TestPage() {
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async (
    action: () => Promise<any>,
    actionName: string
  ) => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await action();
      setResponse({ ...result, action: actionName });
      console.log(`${actionName} response:`, result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Printful Sync Test</h1>

      {/* Sync All Data Section */}
      <div className="mb-8 p-6 border rounded-lg bg-blue-50">
        <h2 className="text-xl font-semibold mb-4">Sync All Printful Data</h2>
        <p className="text-sm text-gray-600 mb-4">
          Syncs categories, store products, and catalog products in order
        </p>
        <button
          onClick={() =>
            handleSync(syncAllPrintfulDataAction, "Sync All Data")
          }
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
        >
          {loading ? "Loading..." : "Sync All Data"}
        </button>
      </div>

      {/* Categories Section */}
      <div className="mb-8 p-6 border rounded-lg bg-purple-50">
        <h2 className="text-xl font-semibold mb-4">Sync Categories</h2>
        <p className="text-sm text-gray-600 mb-4">
          Fetch and sync all categories from Printful API
        </p>
        <button
          onClick={() =>
            handleSync(
              fetchAndSyncCategoriesAction,
              "Sync Categories"
            )
          }
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 font-semibold"
        >
          {loading ? "Loading..." : "Fetch & Sync Categories"}
        </button>
      </div>

      {/* Store Products Section */}
      <div className="mb-8 p-6 border rounded-lg bg-green-50">
        <h2 className="text-xl font-semibold mb-4">Sync Store Products</h2>
        <p className="text-sm text-gray-600 mb-4">
          Fetch and sync all store products from Printful API
        </p>
        <button
          onClick={() =>
            handleSync(
              fetchAndSyncAllStoreProductsAction,
              "Sync Store Products"
            )
          }
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 font-semibold"
        >
          {loading ? "Loading..." : "Fetch & Sync Store Products"}
        </button>
      </div>

      {/* Catalog Products Section */}
      <div className="mb-8 p-6 border rounded-lg bg-orange-50">
        <h2 className="text-xl font-semibold mb-4">Sync Catalog Products</h2>
        <p className="text-sm text-gray-600 mb-4">
          Fetch and sync all catalog products from Printful API (auto-links to
          categories)
        </p>
        <button
          onClick={() =>
            handleSync(
              fetchAndSyncAllCatalogProductsAction,
              "Sync Catalog Products"
            )
          }
          disabled={loading}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400 font-semibold"
        >
          {loading ? "Loading..." : "Fetch & Sync Catalog Products"}
        </button>
      </div>

      {/* Response Section */}
      {error && (
        <div className="mb-8 p-4 bg-red-100 border border-red-400 rounded">
          <h3 className="font-semibold text-red-800">Error:</h3>
          <p className="text-red-700 mt-2">{error}</p>
        </div>
      )}

      {response && (
        <div className="mb-8 p-4 bg-green-100 border border-green-400 rounded">
          <h3 className="font-semibold text-green-800 mb-4">
            {response.action} - Response:
          </h3>
          <pre className="bg-white p-4 rounded border overflow-auto max-h-96 text-xs">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}

      {!response && !error && (
        <div className="p-4 bg-gray-100 border border-gray-300 rounded text-gray-600">
          Click a button above to see the response here
        </div>
      )}
    </div>
  );
}
