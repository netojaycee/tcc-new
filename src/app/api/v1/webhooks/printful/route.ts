import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/lib/services/order.service";
import { productService } from "@/lib/services/product.service";
import { printfulService } from "@/lib/services/printful.service";
import {
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendOrderFailedEmail,
  sendOrderCanceledEmail,
} from "@/lib/services/email.service";
import { prisma } from "@/lib/db";

/**
 * Printful Webhook Handler
 * POST /api/v1/webhooks/printful
 *
 * Listens for events from Printful:
 * - package_shipped: Shipment information with tracking
 * - order_updated: Order status changes (production, processing, etc.)
 * - order_failed: Order fulfillment failed
 * - order_canceled: Order was canceled
 * - product_updated: Product or variant info changed
 * - stock_updated: Stock availability changed
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("Printful webhook event:", body.type);

    // Handle different event types
    switch (body.type) {
      case "package_shipped":
        return await handlePackageShipped(body);

      case "order_updated":
        return await handleOrderUpdated(body);

      case "order_failed":
        return await handleOrderFailed(body);

      case "order_canceled":
        return await handleOrderCanceled(body);

      case "product_updated":
        return await handleProductUpdated(body);

      case "stock_updated":
        return await handleStockUpdated(body);

      // Unused events but acceptable
      case "order_created":
      case "product_synced":
      case "product_deleted":
      case "package_returned":
      case "order_put_hold":
        console.log(`Event handled but not processed: ${body.type}`);
        return NextResponse.json(
          { received: true, message: "Event noted" },
          { status: 200 }
        );

      default:
        console.warn(`Unknown webhook event type: ${body.type}`);
        return NextResponse.json(
          { received: true, message: "Event type not handled" },
          { status: 200 }
        );
    }
  } catch (error) {
    console.error("Printful webhook error:", error);

    // Always return 200 to prevent webhook retries
    return NextResponse.json(
      {
        received: true,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 200 }
    );
  }
}

/**
 * Handle package_shipped event
 * Fires when shipment is sent with tracking info
 */
async function handlePackageShipped(body: any): Promise<NextResponse> {
  try {
    // console.log("Handling package_shipped event with data:", body.data);
    const shipmentData = body.data?.shipment;
    const orderData = body.data?.order;

    if (!orderData?.external_id) {
      console.warn("Package shipped webhook missing order or external_id");
      return NextResponse.json(
        { received: true, message: "Missing required fields" },
        { status: 200 }
      );
    }

    // Find order by external_id (our order number)
    const orderResult = await orderService.getOrder(orderData.external_id);

    if (!orderResult.success) {
      console.warn(`Order not found for external_id: ${orderData.external_id}`);
      return NextResponse.json(
        { received: true, message: "Order not found" },
        { status: 200 }
      );
    }

    const order = orderResult.data;

    // Update order status to shipped
    await orderService.updateOrderStatus(order.id, "shipped");
    await orderService.updatePrintfulStatus(order.id, "shipped");

    console.log(`Order ${order.id} marked as shipped`);

    // Send shipped email with tracking info
    try {
      await sendOrderShippedEmail({
        firstName: order.firstName,
        orderNumber: order.orderNumber,
        orderId: order.id,
        trackingNumber: shipmentData?.tracking_number || "Tracking info pending",
        carrierName: shipmentData?.carrier || "Printful",
        estimatedDelivery: shipmentData?.estimated_delivery_dates?.from
          ? new Date(shipmentData.estimated_delivery_dates.from * 1000).toLocaleDateString()
          : shipmentData?.estimated_delivery_date || "See tracking for updates",
        customerEmail: order.email,
      });
      console.log(`Sent shipped email to ${order.email}`);
    } catch (emailError) {
      console.error(
        "Failed to send shipped email:",
        emailError instanceof Error ? emailError.message : emailError
      );
    }

    return NextResponse.json(
      { received: true, message: "Package shipped event processed" },
      { status: 200 }
    );
  } catch (error) {
    console.error("handlePackageShipped error:", error);
    return NextResponse.json(
      { received: true, error: String(error) },
      { status: 200 }
    );
  }
}

/**
 * Handle order_updated event
 * Fires for ALL order changes - check status to determine action
 */
async function handleOrderUpdated(body: any): Promise<NextResponse> {
  try {
    const orderData = body.data?.order;

    if (!orderData?.external_id) {
      console.warn("Order updated webhook missing external_id");
      return NextResponse.json(
        { received: true, message: "Missing required fields" },
        { status: 200 }
      );
    }

    // Find order by external_id
    const orderResult = await orderService.getOrder(orderData.external_id);

    if (!orderResult.success) {
      console.warn(`Order not found for external_id: ${orderData.external_id}`);
      return NextResponse.json(
        { received: true, message: "Order not found" },
        { status: 200 }
      );
    }

    const order = orderResult.data;
    await orderService.updatePrintfulStatus(order.id, orderData.status);

    // Check if order is delivered - if so, send delivered email
    if (
      orderData.status?.toLowerCase() === "fulfilled" ||
      orderData.status?.toLowerCase() === "delivered"
    ) {
      try {
        await sendOrderDeliveredEmail({
          firstName: order.firstName,
          orderNumber: order.orderNumber,
          orderId: order.id,
          customerEmail: order.email,
        });
        console.log(`Sent delivered email to ${order.email}`);
      } catch (emailError) {
        console.error(
          "Failed to send delivered email:",
          emailError instanceof Error ? emailError.message : emailError
        );
      }
    }

    console.log(
      `Order ${order.id} updated with status: ${orderData.status}`
    );

    return NextResponse.json(
      { received: true, message: "Order updated event processed" },
      { status: 200 }
    );
  } catch (error) {
    console.error("handleOrderUpdated error:", error);
    return NextResponse.json(
      { received: true, error: String(error) },
      { status: 200 }
    );
  }
}

/**
 * Handle order_failed event
 * Fires when order fulfillment fails
 */
async function handleOrderFailed(body: any): Promise<NextResponse> {
  try {
    const orderData = body.data?.order;
    const failureReason = body.data?.reason;

    if (!orderData?.external_id) {
      console.warn("Order failed webhook missing external_id");
      return NextResponse.json(
        { received: true, message: "Missing required fields" },
        { status: 200 }
      );
    }

    const orderResult = await orderService.getOrder(orderData.external_id);

    if (!orderResult.success) {
      console.warn(`Order not found for external_id: ${orderData.external_id}`);
      return NextResponse.json(
        { received: true, message: "Order not found" },
        { status: 200 }
      );
    }

    const order = orderResult.data;

    // Update order status to cancelled/failed
    await orderService.updateOrderStatus(order.id, "failed");
    await orderService.updatePrintfulStatus(order.id, "failed");

    console.log(`Order ${order.id} failed: ${failureReason}`);

    // Send failed email
    try {
      await sendOrderFailedEmail({
        firstName: order.firstName,
        orderNumber: order.orderNumber,
        orderId: order.id,
        customerEmail: order.email,
        reason: failureReason || "Order could not be fulfilled",
      });
      console.log(`Sent failed email to ${order.email}`);
    } catch (emailError) {
      console.error(
        "Failed to send failed email:",
        emailError instanceof Error ? emailError.message : emailError
      );
    }

    return NextResponse.json(
      { received: true, message: "Order failed event processed" },
      { status: 200 }
    );
  } catch (error) {
    console.error("handleOrderFailed error:", error);
    return NextResponse.json(
      { received: true, error: String(error) },
      { status: 200 }
    );
  }
}

/**
 * Handle order_canceled event
 * Fires when order is canceled
 */
async function handleOrderCanceled(body: any): Promise<NextResponse> {
  try {
    const orderData = body.data?.order;
    const cancelReason = body.data?.reason;

    if (!orderData?.external_id) {
      console.warn("Order canceled webhook missing external_id");
      return NextResponse.json(
        { received: true, message: "Missing required fields" },
        { status: 200 }
      );
    }

    const orderResult = await orderService.getOrder(orderData.external_id);

    if (!orderResult.success) {
      console.warn(`Order not found for external_id: ${orderData.external_id}`);
      return NextResponse.json(
        { received: true, message: "Order not found" },
        { status: 200 }
      );
    }

    const order = orderResult.data;

    // Update order status to cancelled
    await orderService.updateOrderStatus(order.id, "cancelled");
    await orderService.updatePrintfulStatus(order.id, "canceled");

    console.log(`Order ${order.id} cancelled: ${cancelReason}`);

    // Send cancelled email
    try {
      await sendOrderCanceledEmail({
        firstName: order.firstName,
        orderNumber: order.orderNumber,
        orderId: order.id,
        customerEmail: order.email,
        reason: cancelReason || "Order was canceled",
      });
      console.log(`Sent canceled email to ${order.email}`);
    } catch (emailError) {
      console.error(
        "Failed to send canceled email:",
        emailError instanceof Error ? emailError.message : emailError
      );
    }

    return NextResponse.json(
      { received: true, message: "Order canceled event processed" },
      { status: 200 }
    );
  } catch (error) {
    console.error("handleOrderCanceled error:", error);
    return NextResponse.json(
      { received: true, error: String(error) },
      { status: 200 }
    );
  }
}

/**
 * Handle product_updated event
 * Fires when product or variant is updated
 */
async function handleProductUpdated(body: any): Promise<NextResponse> {
  try {
    const syncProductData = body.data?.sync_product;

    if (!syncProductData?.id) {
      console.warn("Product updated webhook missing product data");
      return NextResponse.json(
        { received: true, message: "Missing required fields" },
        { status: 200 }
      );
    }

    const printfulProductId = String(syncProductData.id);
    console.log(`Product updated: ${printfulProductId}`);

    // Find and update product in database
    const product = await prisma.product.findUnique({
      where: { printfulStoreProductId: printfulProductId },
    });

    if (product) {
      // Fetch latest product data from Printful
      const productDetail = await printfulService.getStoreProductById(
        printfulProductId
      );

      // Update activeVariantCount
      const activeCount = productDetail.sync_variants.filter(
        (v: any) => v.synced && !v.is_discontinued
      ).length;

      await prisma.product.update({
        where: { id: product.id },
        data: {
          activeVariantCount: activeCount,
          lastStockSync: new Date(),
        },
      });

      console.log(
        `Updated product ${product.id} - active variants: ${activeCount}`
      );
    }

    return NextResponse.json(
      { received: true, message: "Product updated event processed" },
      { status: 200 }
    );
  } catch (error) {
    console.error("handleProductUpdated error:", error);
    return NextResponse.json(
      { received: true, error: String(error) },
      { status: 200 }
    );
  }
}

/**
 * Handle stock_updated event
 * Fires when product variant stock changes
 */
async function handleStockUpdated(body: any): Promise<NextResponse> {
  try {
    const productId = body.data?.product_id;
    const variantStock = body.data?.variant_stock;

    if (!productId || !variantStock) {
      console.warn("Stock updated webhook missing required data");
      return NextResponse.json(
        { received: true, message: "Missing required fields" },
        { status: 200 }
      );
    }

    const printfulProductId = String(productId);
    console.log(`Stock updated for product: ${printfulProductId}`);

    // Find and update product in database
    const product = await prisma.product.findUnique({
      where: { printfulStoreProductId: printfulProductId },
    });

    if (product) {
      // Get list of inactive variant IDs
      const inactiveIds = new Set([
        ...(variantStock.out || []),
        ...(variantStock.discontinued || []),
      ]);

      // Fetch current variants from Printful to get accurate count
      try {
        const productDetail = await printfulService.getStoreProductById(
          printfulProductId
        );

        // Count variants that are NOT in the inactive list
        const allVariants = productDetail.sync_variants || [];
        const activeCount = allVariants.filter(
          (v: any) =>
            !inactiveIds.has(v.id) &&
            v.synced &&
            v.availability_status?.toLowerCase() !== "discontinued"
        ).length;

        await prisma.product.update({
          where: { id: product.id },
          data: {
            activeVariantCount: activeCount,
            lastStockSync: new Date(),
          },
        });

        console.log(
          `Stock updated for product ${product.id} - active variants: ${activeCount}`
        );
      } catch (err) {
        console.error("Failed to update product stock:", err);
      }
    }

    return NextResponse.json(
      { received: true, message: "Stock updated event processed" },
      { status: 200 }
    );
  } catch (error) {
    console.error("handleStockUpdated error:", error);
    return NextResponse.json(
      { received: true, error: String(error) },
      { status: 200 }
    );
  }
}

/**
 * Printful Webhook Events Handled (from OpenAPI):
 *
 * ORDER EVENTS:
 * - order_created: Order first created in Printful
 * - order_updated: Any order changes (status, details, etc.)
 * - order_failed: Order fulfillment failed (sends email)
 * - order_canceled: Order was canceled (sends email)
 *
 * SHIPMENT EVENTS:
 * - package_shipped: Shipment sent with tracking (sends email)
 * - package_returned: Shipment returned to facility
 *
 * PRODUCT EVENTS:
 * - product_updated: Product or variant updated
 * - product_synced: Product imported from ecommerce platform
 * - product_deleted: Product or variant deleted
 *
 * STOCK EVENTS:
 * - stock_updated: Product variant stock changed
 *
 * Setup Instructions:
 * 1. Call POST /api/v1/admin/webhooks/setup with:
 *    {
 *      "url": "https://yourdomain.com/api/v1/webhooks/printful",
 *      "types": ["package_shipped", "order_updated", "order_failed", "order_canceled", "product_updated", "stock_updated"],
 *      "productIds": [1, 2, 3]  // for stock_updated monitoring
 *    }
 *
 * 2. Webhook will be registered with Printful
 *
 * Testing Locally:
 * Use ngrok: ngrok http 3000
 * Then call setup endpoint with ngrok URL
 */
