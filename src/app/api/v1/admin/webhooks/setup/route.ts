import { NextRequest, NextResponse } from "next/server";
import { printfulService } from "@/lib/services/printful.service";

/**
 * POST /api/v1/admin/webhooks/setup
 * Set up or update Printful webhook configuration
 * 
 * Request body:
 * {
 *   "url": "https://example.com/api/v1/webhooks/printful",
 *   "types": ["package_shipped", "order:shipped", "order:delivered", "order:failed", "order:canceled", "product:updated", "stock_updated"],
 *   "productIds": [1, 2, 3] // Optional: Product IDs to monitor for stock updates
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, types, productIds } = body;

    // Validate required fields
    if (!url || !types || !Array.isArray(types)) {
      return NextResponse.json(
        {
          error: "Missing or invalid required fields: url, types (array)",
        },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid webhook URL format" },
        { status: 400 }
      );
    }

    // Build webhook params
    const params: any = {};

    // If stock_updated is in types and productIds provided, add params
    if (types.includes("stock_updated") && productIds && Array.isArray(productIds)) {
      params.stock_updated = {
        product_ids: productIds,
      };
    } else if (types.includes("stock_updated") && !productIds) {
      // If stock_updated is in types but no productIds provided, get all product IDs
      console.log("[Webhook Setup] Fetching all product IDs for stock monitoring...");
      const allProductIds = await printfulService.getProductIdsForStockMonitoring();
      if (allProductIds.length > 0) {
        params.stock_updated = {
          product_ids: allProductIds,
        };
        console.log(`[Webhook Setup] Monitoring ${allProductIds.length} products for stock updates`);
      }
    }

    // Create webhook in Printful
    const webhookConfig = await printfulService.createWebhook(url, types, params);

    return NextResponse.json(
      {
        success: true,
        message: "Webhook configured successfully",
        config: webhookConfig,
        monitoredProductCount: params.stock_updated?.product_ids?.length || 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Webhook Setup] Error:", error);

    const message = error instanceof Error ? error.message : "Failed to setup webhook";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/admin/webhooks/setup
 * Get current webhook configuration
 */
export async function GET(request: NextRequest) {
  try {
    const webhookConfig = await printfulService.getWebhook();

    if (!webhookConfig) {
      return NextResponse.json(
        {
          configured: false,
          message: "No webhook configured yet",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        configured: true,
        config: webhookConfig,
        monitoredProductCount: webhookConfig.params?.stock_updated?.product_ids?.length || 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Webhook Status] Error:", error);

    const message = error instanceof Error ? error.message : "Failed to fetch webhook configuration";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/admin/webhooks/setup
 * Delete webhook configuration
 */
export async function DELETE(request: NextRequest) {
  try {
    await printfulService.deleteWebhook();

    return NextResponse.json(
      {
        success: true,
        message: "Webhook deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Webhook Delete] Error:", error);

    const message = error instanceof Error ? error.message : "Failed to delete webhook";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
