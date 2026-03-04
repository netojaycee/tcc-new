"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { orderService, CreateOrderInput } from "@/lib/services/order.service";
import { cartService } from "@/lib/services/cart.service";
import { paymentService } from "@/lib/services/payment.service";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { checkoutFormSchema } from "@/lib/schema/checkout.schema";
import { variantMatchesId, variantsFromUnknown } from "@/lib/utils/variant";

// ============ HELPERS ============

/**
 * Detect currency code from country name
 */
function detectCurrencyFromCountry(country: string): string {
  const currencyMap: Record<string, string> = {
    "united kingdom": "gbp",
    uk: "gbp",
    "united states": "usd",
    us: "usd",
    usa: "usd",
    canada: "cad",
    australia: "aud",
    euro: "eur",
    europe: "eur",
  };

  const normalized = country.toLowerCase().trim();
  return currencyMap[normalized] || "cad"; // Default to CAD
}

// ============ READ ACTIONS ============

/**
 * Get current user's orders
 */
export async function getUserOrdersAction(
  limit: number = 10,
  offset: number = 0,
) {
  try {
    const session = await getSession();

    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    const result = await orderService.getUserOrders(
      session.userId,
      limit,
      offset,
    );
    return result;
  } catch (error) {
    console.error("Get user orders error:", error);
    return {
      success: false,
      error: "Failed to fetch orders",
      code: "FETCH_ERROR",
    };
  }
}

/**
 * Get single order by ID
 */
export async function getOrderAction(orderId: string) {
  try {
    const result = await orderService.getOrder(orderId);
    return result;
  } catch (error) {
    console.error("Get order error:", error);
    return {
      success: false,
      error: "Failed to fetch order",
      code: "FETCH_ERROR",
    };
  }
}





// ============ CANCEL ORDER ============

/**
 * Cancel order (user must own the order)
 */
export async function cancelOrderAction(orderId: string) {
  try {
    const session = await getSession();

    if (!session || !("userId" in session)) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      };
    }

    const result = await orderService.cancelOrder(orderId, session.userId);

    if (result.success) {
      revalidatePath("/orders");
      revalidatePath(`/orders/${orderId}`);
    }

    return result;
  } catch (error) {
    console.error("Cancel order error:", error);
    return {
      success: false,
      error: "Failed to cancel order",
      code: "CANCEL_ERROR",
    };
  }
}
// ============ PRINTFUL ORDER ACTIONS ============

/**
 * Create Printful order (called after Stripe payment confirmed)
 * Converts our order into a Printful order for fulfillment
 */
export async function createPrintfulOrderAction(orderId: string) {
  try {
    // Get the order details
    const orderResult = await orderService.getOrder(orderId);
    if (!orderResult.success) {
      return {
        success: false,
        error: "Order not found",
        code: "ORDER_NOT_FOUND",
      };
    }

    const order = orderResult.data;

    // Verify order is paid
    if (order.status !== "paid") {
      return {
        success: false,
        error: "Order must be paid before creating Printful order",
        code: "INVALID_STATUS",
      };
    }

    // Skip if already has Printful order ID
    if (order.printfulOrderId) {
      return {
        success: true,
        data: { orderId, printfulOrderId: order.printfulOrderId },
      };
    }

    const { printfulService } = await import(
      "@/lib/services/printful.service"
    );

    // Build Printful order data
    const printfulOrderData = {
      external_id: order.orderNumber,
      recipient: {
        name: `${order.firstName} ${order.lastName}`.trim(),
        email: order.email,
        address1: (order.deliveryAddress as any)?.street || "",
        city: (order.deliveryAddress as any)?.city || "",
        state_code: (order.deliveryAddress as any)?.state,
        state_name: (order.deliveryAddress as any)?.state,
        country_code: getCountryCode((order.deliveryAddress as any)?.country),
        zip: (order.deliveryAddress as any)?.zip || "",
      },
      items: order.items.map((item: any) => {
        const variantId = parseInt(item.variantId || "0");
        
        // Skip invalid variant IDs
        if (!variantId || isNaN(variantId)) {
          console.warn(
            `Skipping item with invalid variantId: ${item.variantId}`,
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

            const selectedVariant = variants.find(
              (v: any) => variantMatchesId(v, variantId),
            );

            if (selectedVariant?.files && Array.isArray(selectedVariant.files)) {
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

        if (files.length === 0) {
          console.warn(
            `No design files found for variant ${variantId}. Printful may reject this item.`,
          );
        }

        return {
          variant_id: variantId,
          quantity: item.quantity,
          price: item.product.basePrice,
          ...(files.length > 0 && { files }),
        };
      }).filter(Boolean),
      shipping: "STANDARD", // Default shipping method
    };

    // Create order in Printful
    const printfulOrder = await printfulService.createOrder(printfulOrderData);

    // Update our order with Printful details
    const updateResult = await orderService.setPrintfulOrder(
      orderId,
      String(printfulOrder.id),
      printfulOrder.status,
    );

    if (!updateResult.success) {
      return {
        success: false,
        error: "Failed to link Printful order",
        code: "UPDATE_ERROR",
      };
    }

    return {
      success: true,
      data: {
        orderId,
        printfulOrderId: printfulOrder.id,
        printfulStatus: printfulOrder.status,
      },
    };
  } catch (error) {
    console.error("Create Printful order error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
      code: "PRINTFUL_ERROR",
    };
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
  return countryCodeMap[normalized] || "GB"; // Default to GB
}