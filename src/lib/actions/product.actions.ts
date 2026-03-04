"use server";

import { getSession } from "@/lib/auth";
import { productService } from "@/lib/services/product.service";

// ============ USER READ ACTIONS ============

/**
 * Get all products with filters
 */
export async function getProductsAction(filters?: {
  type?: "store" | "catalog";
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: "newest" | "popular" | "price_asc" | "price_desc" | "rating";
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  fits?: string[];
  materials?: string[];
  minRating?: number;
}) {
  try {
    const result = await productService.getProducts(filters);
    return { success: true, data: result.products, total: result.total };
  } catch (error) {
    console.error("Get products error:", error);
    return { success: false, error: "Failed to fetch products" };
  }
}

export async function getRelatedProductsAction(filters?: { categoryId?: string }) {
  try {
    const result = await productService.getRelatedProducts(filters);
    return { success: true, data: result.products, total: result.total };
  } catch (error) {
    console.error("Get products error:", error);
    return { success: false, error: "Failed to fetch products" };
  }
}

/**
 * Get single product by ID or slug
 */
export async function getProductAction(identifier: string) {
  try {
    if (!identifier || identifier.trim() === "") {
      return { success: false, error: "Product identifier required" };
    }

    const product = await productService.getProductByIdentifier(identifier);
    if (!product) {
      return { success: false, error: "Product not found" };
    }

    return { success: true, data: product };
  } catch (error) {
    console.error("Get product error:", error);
    return { success: false, error: "Failed to fetch product" };
  }
}

/**
 * Search products
 */
export async function searchProductsAction(query: string, limit = 20) {
  try {
    if (!query || query.trim() === "") {
      return { success: true, data: [] };
    }

    const results = await productService.searchProducts(query, limit);
    return { success: true, data: results };
  } catch (error) {
    console.error("Search products error:", error);
    return { success: false, error: "Failed to search products" };
  }
}

/**
 * Fetch and sync all store products from Printful (admin only)
 */
export async function fetchAndSyncAllStoreProductsAction() {
  try {
    // // Check authentication and role
    // const session = await getSession();
    // if (!session || !("userId" in session)) {
    //   return {
    //     success: false,
    //     error: "Unauthorized",
    //     code: "UNAUTHORIZED",
    //   };
    // }

    // TODO: Add role check for admin
    // const user = await getUser(session.userId);
    // if (user?.role !== "admin") {
    //   return { success: false, error: "Admin access required", code: "FORBIDDEN" };
    // }

    const result = await productService.syncPrintfulStoreProducts();
    if (
      !result.success ||
      !result.data ||
      !Array.isArray(result.data.results)
    ) {
      return {
        success: false,
        error: "Failed to fetch store products",
        message: result.error || "Unknown error",
      };
    }
    const count = result.data.results.length;
    return {
      success: true,
      message: result.data.message,
      count,
    };
  } catch (error) {
    console.error("Fetch all store products action error:", error);
    return {
      success: false,
      error: "Failed to fetch store products",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fetch and sync all categories from Printful (admin only)
 */
export async function fetchAndSyncCategoriesAction() {
  try {
    const result = await productService.syncPrintfulCategories();
    if (
      !result.success ||
      !result.data ||
      !Array.isArray(result.data.results)
    ) {
      return {
        success: false,
        error: "Failed to fetch categories",
        message: result.error || "Unknown error",
      };
    }
    const count = result.data.results.length;
    return {
      success: true,
      message: result.data.message,
      count,
    };
  } catch (error) {
    console.error("Fetch categories action error:", error);
    return {
      success: false,
      error: "Failed to fetch categories",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fetch and sync all catalog products from Printful (admin only)
 */
export async function fetchAndSyncAllCatalogProductsAction() {
  try {
    const result = await productService.syncPrintfulCatalogProducts();
    if (
      !result.success ||
      !result.data ||
      !Array.isArray(result.data.results)
    ) {
      return {
        success: false,
        error: "Failed to fetch catalog products",
        message: result.error || "Unknown error",
      };
    }
    const count = result.data.results.length;
    return {
      success: true,
      message: result.data.message,
      count,
    };
  } catch (error) {
    console.error("Fetch all catalog products action error:", error);
    return {
      success: false,
      error: "Failed to fetch catalog products",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Sync all Printful data (categories first, then store products, then catalog products)
 */
export async function syncAllPrintfulDataAction() {
  try {
    // Sync in order: categories first, then store products, then catalog products
    const categoryResult = await productService.syncPrintfulCategories();
    const storeResult = await productService.syncPrintfulStoreProducts();
    const catalogResult = await productService.syncPrintfulCatalogProducts();

    const categoryCount =
      categoryResult.success &&
      categoryResult.data &&
      Array.isArray(categoryResult.data.results)
        ? categoryResult.data.results.length
        : 0;
    const storeCount =
      storeResult.success &&
      storeResult.data &&
      Array.isArray(storeResult.data.results)
        ? storeResult.data.results.length
        : 0;
    const catalogCount =
      catalogResult.success &&
      catalogResult.data &&
      Array.isArray(catalogResult.data.results)
        ? catalogResult.data.results.length
        : 0;

    const totalCount = categoryCount + storeCount + catalogCount;

    if (
      !categoryResult.success ||
      !storeResult.success ||
      !catalogResult.success
    ) {
      return {
        success: false,
        message: "Some sync operations failed",
        error: `Categories: ${categoryResult.success ? "OK" : "FAILED"}, Store: ${storeResult.success ? "OK" : "FAILED"}, Catalog: ${catalogResult.success ? "OK" : "FAILED"}`,
      };
    }

    return {
      success: true,
      message: `Successfully synced all Printful data. Categories: ${categoryCount}, Store Products: ${storeCount}, Catalog Products: ${catalogCount}`,
      count: totalCount,
    };
  } catch (error) {
    console.error("Full sync action error:", error);
    return {
      success: false,
      error: "Failed to sync all Printful data",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
