import { NextRequest, NextResponse } from "next/server";
import { productService } from "@/lib/services/product.service";
import { prisma } from "@/lib/db";

/**
 * Admin API for manual product synchronization
 * POST /api/v1/admin/sync
 * 
 * Query params:
 * - type: "store" | "catalog" | "all" (default: "all")
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const syncType = searchParams.get("type") || "all";

    console.log(`[Admin Sync] Starting sync for type: ${syncType}`);

    const results: any = {};

    // Sync store products
    if (syncType === "store" || syncType === "all") {
      console.log("[Admin Sync] Syncing store products...");
      const storeResult = await productService.syncPrintfulStoreProducts();
      results.store = storeResult;
    }

    // Sync catalog products
    if (syncType === "catalog" || syncType === "all") {
      console.log("[Admin Sync] Syncing catalog products...");
      const catalogResult = await productService.syncPrintfulCatalogProducts();
      results.catalog = catalogResult;
    }

    // Sync categories
    if (syncType === "catalog" || syncType === "all") {
      console.log("[Admin Sync] Syncing categories...");
      const categoriesResult = await productService.syncPrintfulCategories();
      results.categories = categoriesResult;
    }

    // Get summary stats
    const stats = await prisma.product.groupBy({
      by: ["productType"],
      _count: true,
    });

    const storeCount = stats.find((s) => s.productType === "store")?._count || 0;
    const catalogCount =
      stats.find((s) => s.productType === "catalog")?._count || 0;

    console.log(
      `[Admin Sync] Complete! Store: ${storeCount}, Catalog: ${catalogCount}`
    );

    return NextResponse.json(
      {
        success: true,
        message: `Sync completed for ${syncType}`,
        results,
        summary: {
          storeProducts: storeCount,
          catalogProducts: catalogCount,
          totalProducts: storeCount + catalogCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Admin Sync] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Get current sync status and product counts
 */
export async function GET(request: NextRequest) {
  try {
    const stats = await prisma.product.groupBy({
      by: ["productType"],
      _count: true,
    });

    const storeProducts = await prisma.product.findMany({
      where: { productType: "store" },
      select: {
        id: true,
        name: true,
        activeVariantCount: true,
        lastStockSync: true,
      },
      take: 10,
      orderBy: { lastStockSync: "desc" },
    });

    const catalogProducts = await prisma.product.findMany({
      where: { productType: "catalog" },
      select: {
        id: true,
        name: true,
        activeVariantCount: true,
        lastStockSync: true,
      },
      take: 10,
      orderBy: { lastStockSync: "desc" },
    });

    return NextResponse.json(
      {
        success: true,
        stats: {
          store: stats.find((s) => s.productType === "store")?._count || 0,
          catalog:
            stats.find((s) => s.productType === "catalog")?._count || 0,
          total:
            (stats.find((s) => s.productType === "store")?._count || 0) +
            (stats.find((s) => s.productType === "catalog")?._count || 0),
        },
        recentProducts: {
          store: storeProducts,
          catalog: catalogProducts,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Admin Sync GET] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
