import { NextRequest, NextResponse } from "next/server";
import { paymentService } from "@/lib/services/payment.service";
import { orderService } from "@/lib/services/order.service";
import { printfulService } from "@/lib/services/printful.service";
import { sendOrderConfirmationEmail } from "@/lib/services/email.service";
import { variantMatchesId, variantsFromUnknown } from "@/lib/utils/variant";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Stripe Webhook Handler
 * POST /api/v1/webhooks/stripe
 *
 * CRITICAL: Must use raw body to verify webhook signature
 * Never parse the request as JSON before verification
 */

// Get raw body as string (required for Stripe signature verification)
async function getRawBody(request: NextRequest): Promise<string> {
  const buffer = await request.arrayBuffer();
  return Buffer.from(buffer).toString("utf8");
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await getRawBody(request);
    let event: Stripe.Event;

    // Get Stripe signature from headers
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      console.warn("Missing stripe-signature header");
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 },
      );
    }

    if (!rawBody) {
      return NextResponse.json(
        { error: "Empty request body" },
        { status: 400 },
      );
    }

    // Verify and construct event
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (error) {
      console.error("Stripe signature verification failed:", error);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log(`Processing Stripe webhook event: ${event.type}`);

    // Handle payment_intent.succeeded
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      if (!paymentIntent.metadata?.orderId) {
        console.warn("Payment intent missing orderId in metadata");
        return NextResponse.json(
          { received: true, message: "No orderId in metadata" },
          { status: 200 },
        );
      }

      const orderId = paymentIntent.metadata.orderId;

      // Update order status to paid
      const orderUpdateResult = await orderService.updateOrderStatus(
        orderId,
        "paid",
      );

      if (!orderUpdateResult.success) {
        console.error(
          "Failed to update order status:",
          orderUpdateResult.error,
        );
        return NextResponse.json(
          { received: true, message: "Failed to update order status" },
          { status: 200 },
        );
      }

      // Create Printful order for fulfillment
      try {
        const orderResult = await orderService.getOrder(orderId);
        if (!orderResult.success) {
          console.error("Order not found:", orderId);
          return NextResponse.json(
            { received: true, message: "Order not found" },
            { status: 200 },
          );
        }

        const order = orderResult.data;

        // Build Printful order data
        const printfulOrderData = {
          external_id: order.orderNumber,
          recipient: {
            name: `${order.firstName} ${order.lastName}`.trim(),
            email: order.email,
            address1: (order.deliveryAddress as any)?.street || "",
            city: (order.deliveryAddress as any)?.city || "",
            state_code: (order.deliveryAddress as any)?.state || "",
            state_name: (order.deliveryAddress as any)?.state || "",
            country_code: (order.deliveryAddress as any)?.country || "",

            zip: (order.deliveryAddress as any)?.zip || "",
          },
          items: order.items
            .map((item: any) => {
              // Ensure variantId is valid and is a number
              const variantId = item.variantId
                ? parseInt(item.variantId, 10)
                : null;
              if (!variantId || isNaN(variantId)) {
                console.warn(
                  `Invalid variantId for item ${item.id}: "${item.variantId}" - skipping item`,
                );
                return null;
              }

              // Build files array - prefer customData, fallback to variant mockup files
              let files: Array<{ type?: string; url: string }> = [];

              // If user provided custom files/design
              if (item.customData && Array.isArray(item.customData)) {
                files = item.customData;
              }
              // Otherwise, try to get mockup files from the product variant
              else if (item.product?.variants) {
                try {
                  const variants = variantsFromUnknown(item.product.variants);

                  const selectedVariant = variants.find((v: any) =>
                    variantMatchesId(v, variantId),
                  );

                  if (
                    selectedVariant?.files &&
                    Array.isArray(selectedVariant.files)
                  ) {
                    // Use mockup/preview files from the variant as the design
                    files = selectedVariant.files
                      .filter((f: any) => f.preview_url || f.url)
                      .map((f: any) => ({
                        type: f.type || "design",
                        url: f.preview_url || f.url,
                      }));
                  }
                } catch (error) {
                  console.warn(
                    `Failed to extract variant files for variant ${variantId}:`,
                    error,
                  );
                }
              }

              // If still no files, log warning
              if (files.length === 0) {
                console.warn(
                  `No design files found for item ${item.id} (variant ${variantId}). This may cause Printful submission to fail.`,
                );
              }

              return {
                variant_id: variantId,
                quantity: item.quantity,
                price: item.price || 0,
                ...(files.length > 0 && { files }),
              };
            })
            .filter(Boolean), // Remove null items
          shipping: "STANDARD",
        };

        // Validate Printful order data
        if (!printfulOrderData.items || printfulOrderData.items.length === 0) {
          throw new Error("No valid items to fulfill");
        }

        if (!printfulOrderData.recipient.address1) {
          throw new Error("Delivery address is missing");
        }

        // Log the request being sent to Printful
        console.log(
          "Sending to Printful:",
          JSON.stringify(printfulOrderData, null, 2),
        );

        // Create order in Printful
        const printfulOrder =
          await printfulService.createOrder(printfulOrderData);

        // Update our order with Printful details
        await orderService.setPrintfulOrder(
          orderId,
          String(printfulOrder.id),
          printfulOrder.status,
        );

        console.log(
          `Successfully created Printful order ${printfulOrder.id} for order ${orderId}`,
        );
      } catch (printfulError) {
        console.error(
          "Failed to create Printful order:",
          printfulError instanceof Error
            ? printfulError.message
            : printfulError,
        );

        // Log additional details for debugging
        if (printfulError instanceof Error) {
          console.error("Error stack:", printfulError.stack);
        }
        // Don't fail the webhook, but log for manual intervention
      }

      // Send order confirmation email
      try {
        const orderResult = await orderService.getOrder(orderId);
        if (orderResult.success) {
          const order = orderResult.data;
          await sendOrderConfirmationEmail({
            firstName: order.firstName,
            orderNumber: order.orderNumber,
            orderId: order.id,
            orderTotal: order.total,
            itemCount: order.items.length,
            deliveryAddress: order.deliveryAddress,
            customerEmail: order.email,
            // deliveryAddress: `${(order.deliveryAddress as any)?.street}, ${(order.deliveryAddress as any)?.city}, ${(order.deliveryAddress as any)?.state} ${(order.deliveryAddress as any)?.zip}`,
          });
          console.log(`Sent order confirmation email to ${order.email}`);
        }
      } catch (emailError) {
        console.error(
          "Failed to send confirmation email:",
          emailError instanceof Error ? emailError.message : emailError,
        );
        // Don't fail webhook if email fails
      }

      return NextResponse.json(
        { received: true, message: "Payment processed successfully" },
        { status: 200 },
      );
    }

    // Handle payment_intent.payment_failed
    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      if (paymentIntent.metadata?.orderId) {
        const orderId = paymentIntent.metadata.orderId;
        await orderService.updateOrderStatus(orderId, "failed");
        console.log(`Order ${orderId} marked as failed`);
      }

      return NextResponse.json(
        { received: true, message: "Payment failure recorded" },
        { status: 200 },
      );
    }

    // Return success
    return NextResponse.json(
      { received: true, message: "Webhook processed" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Webhook error:", error);
    // Return 200 even on errors (Stripe will retry if 5xx)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 200 },
    );
  }
}

/**
 * Helper: Convert country name to ISO country code
 */
function getCountryCode(country: string): string {
  const countryCodeMap: Record<string, string> = {
    "united kingdom": "GB",
    uk: "GB",
    "united states": "US",
    us: "US",
    usa: "US",
    canada: "CA",
    australia: "AU",
    france: "FR",
    germany: "DE",
    spain: "ES",
    italy: "IT",
    netherlands: "NL",
    belgium: "BE",
    austria: "AT",
  };

  const normalized = (country || "").toLowerCase().trim();
  return countryCodeMap[normalized] || "GB";
}

/**
 * Webhook Events Handled:
 * - payment_intent.succeeded
 * - payment_intent.payment_failed
 * - charge.refunded
 *
 * Setup Instructions:
 * 1. In Stripe Dashboard: Developers → Webhooks
 * 2. Create Endpoint: https://yourdomain.com/api/v1/webhooks/stripe
 * 3. Events to listen: payment_intent, charge
 * 4. Copy signing secret to STRIPE_WEBHOOK_SECRET env var
 *
 * Testing Locally:
 * 1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
 * 2. Run: stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe
 * 3. Run: stripe trigger payment_intent.succeeded
 */
