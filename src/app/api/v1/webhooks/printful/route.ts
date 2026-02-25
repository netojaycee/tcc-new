import { NextRequest, NextResponse } from "next/server";
import { orderService } from "@/lib/services/order.service";
import {
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
} from "@/lib/services/email.service";

/**
 * Printful Webhook Handler
 * POST /api/v1/webhooks/printful
 *
 * Listens for order status updates from Printful:
 * - production, shipped, delivered, failed
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("Printful webhook event:", body.type);

    // Only process order-related events
    if (!body.type?.startsWith("order:")) {
      return NextResponse.json(
        { received: true, message: "Event type not handled" },
        { status: 200 }
      );
    }

    const orderData = body.data;

    if (!orderData || !orderData.external_id) {
      console.warn("Printful webhook missing external_id or data");
      return NextResponse.json(
        { received: true, message: "Missing required fields" },
        { status: 200 }
      );
    }

    // Find order by external_id (our order number)
    const orderResult = await orderService.getOrder(orderData.external_id);

    let orderId: string;

    if (orderResult.success) {
      orderId = orderResult.data.id;
    } else {
      // Try to find by order number if not found by ID
      // This is a fallback - in production, you'd query by orderNumber
      console.warn(
        `Order not found for external_id: ${orderData.external_id}`
      );
      return NextResponse.json(
        { received: true, message: "Order not found" },
        { status: 200 }
      );
    }

    // Map Printful status to our status
    let ourStatus: string | undefined;
    const printfulStatus = orderData.status?.toLowerCase();

    if (printfulStatus === "production" || printfulStatus === "pending") {
      ourStatus = "processing";
    } else if (
      printfulStatus === "shipped" ||
      printfulStatus === "in_transit"
    ) {
      ourStatus = "shipped";
    } else if (printfulStatus === "delivered") {
      ourStatus = "delivered";
    } else if (printfulStatus === "failed" || printfulStatus === "canceled") {
      ourStatus = "cancelled";
    }

    // Update order with Printful status
    const updateResult = await orderService.updatePrintfulStatus(
      orderId,
      printfulStatus || "unknown"
    );

    if (updateResult.success && ourStatus) {
      // Also update our order status
      await orderService.updateOrderStatus(
        orderId,
        ourStatus as any
      );
    }

    console.log(
      `Updated order ${orderId} with Printful status: ${printfulStatus}`
    );

    // Handle specific events
    switch (body.type) {
      case "order:shipped":
        console.log(`Order ${orderId} shipped`);
        try {
          const orderData = await orderService.getOrder(orderId);
          if (orderData.success) {
            const order = orderData.data;
            await sendOrderShippedEmail({
              firstName: order.firstName,
              orderNumber: order.orderNumber,
              orderId: order.id,
              trackingNumber: body.data.tracking_number || "Tracking info pending",
              carrierName: body.data.shipping_service || "Standard Shipping",
              estimatedDelivery: body.data.estimated_delivery_date || "See tracking for updates",
              customerEmail: order.email,
            });
            console.log(`Sent shipped email to ${order.email}`);
          }
        } catch (emailError) {
          console.error(
            "Failed to send shipped email:",
            emailError instanceof Error ? emailError.message : emailError
          );
        }
        break;

      case "order:delivered":
        console.log(`Order ${orderId} delivered`);
        try {
          const orderData = await orderService.getOrder(orderId);
          if (orderData.success) {
            const order = orderData.data;
            await sendOrderDeliveredEmail({
              firstName: order.firstName,
              orderNumber: order.orderNumber,
              orderId: order.id,
              customerEmail: order.email,
            });
            console.log(`Sent delivered email to ${order.email}`);
          }
        } catch (emailError) {
          console.error(
            "Failed to send delivered email:",
            emailError instanceof Error ? emailError.message : emailError
          );
        }
        break;

      case "order:failed":
        console.log(`Order ${orderId} failed to fulfill`);
        // Could trigger customer support alert here
        break;

      default:
        console.log(`Order event processed: ${body.type}`);
    }

    return NextResponse.json(
      { received: true, message: "Webhook processed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Printful webhook error:", error);

    // Return 200 to prevent webhook retries on parse errors
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 200 }
    );
  }
}

/**
 * Printful Webhook Events Handled:
 * - order:created - Order created in Printful
 * - order:updated - Order details changed
 * - order:shipped - Order shipped
 * - order:delivered - Order delivered
 * - order:failed - Order fulfillment failed
 * - order:canceled - Order was canceled
 *
 * Setup Instructions:
 * 1. In Printful Dashboard: Settings → Webhooks
 * 2. Add Webhook URL: https://yourdomain.com/api/v1/webhooks/printful
 * 3. Select events to listen
 * 4. Printful will send POST requests with order updates
 *
 * Testing Locally:
 * Use ngrok to expose localhost: ngrok http 3000
 * Then register webhook with ngrok URL in Printful settings
 */
