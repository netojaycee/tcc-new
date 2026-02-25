"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { orderService, CreateOrderInput } from "@/lib/services/order.service";
import { cartService } from "@/lib/services/cart.service";
import { paymentService } from "@/lib/services/payment.service";
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

// ============ CHECKOUT ACTION (Main checkout flow) ============

/**
 * Main checkout action - called from checkout form
 * Validates recipient info and address, creates order with cart items
 * Returns orderId and clientSecret for Stripe payment
 */
export async function checkoutAction(input: any) {
  try {
    // Validate input with checkout schema
    const validated = checkoutFormSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Validation failed",
        code: "VALIDATION_ERROR",
      };
    }

    const session = await getSession();
    let userId: string | undefined;
    let sessionId: string | undefined;
    // console.log(session)

    if (session && "userId" in session) {
      userId = session.userId;
    } else if (session && session.isGuest) {
      sessionId = session.sessionId;
    } else {
      return {
        success: false,
        error: "Invalid session - please refresh and try again",
        code: "INVALID_SESSION",
      };
    }

    // Get cart items
    const cart = userId
      ? await cartService.getCart(undefined, userId)
      : await cartService.getCart(sessionId, undefined);

    if (!cart || !cart.items || cart.items.length === 0) {
      return {
        success: false,
        error: "Your cart is empty",
        code: "EMPTY_CART",
      };
    }

    // Prepare cart items for order
    const cartItems = cart.items.map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.product.basePrice,
      variantId: item.variantId, // Include variant ID for Printful
      customData: item.customData, // Include customization data
    }));

    // Use delivery address from form
    const deliveryAddress = validated.data.deliveryAddress;

    // Create order
    const orderResult = await orderService.createOrder(
      {
        cartItems,
        deliveryAddress,
        firstName: validated.data.firstName || "",
        lastName: validated.data.lastName || "",
        email: validated.data.email,
        occasion: validated.data.occasion || undefined,
        specialMessage: validated.data.specialMessage || undefined,
      },
      userId,
      sessionId,
    );

    if (!orderResult.success) {
      return {
        success: false,
        error: orderResult.error,
        code: orderResult.code,
      };
    }

    // Create Stripe PaymentIntent for the order
    const currency = detectCurrencyFromCountry(deliveryAddress.country);
    const paymentResult = await paymentService.createPaymentIntent({
      orderId: orderResult.data.id,
      amount: orderResult.data.total,
      email: validated.data.email,
      currency,
    });

    if (!paymentResult.success) {
      return {
        success: false,
        error: paymentResult.error,
        code: paymentResult.code,
      };
    }

    // Clear cart after successful order creation and payment intent creation
    await cartService.clearCart(userId, sessionId);
    revalidatePath("/checkout");
    revalidatePath("/cart");

    // Return order ID, client secret, and full order data for display
    return {
      success: true,
      data: {
        orderId: orderResult.data.id,
        clientSecret: paymentResult.data.clientSecret,
        order: orderResult.data,
      },
    };
  } catch (error) {
    console.error("Checkout action error:", error);
    return {
      success: false,
      error: "An error occurred during checkout",
      code: "CHECKOUT_ERROR",
    };
  }
}

// ============ CREATE ORDER ============

/**
 * Create order from cart
 * Cart items will be passed from client
 */
export async function createOrderAction(input: CreateOrderInput) {
  try {
    // Validate input
    const validated = z
      .object({
        cartItems: z
          .array(
            z.object({
              productId: z.string().min(1),
              quantity: z.number().int().positive(),
              price: z.number().positive(),
            }),
          )
          .min(1),
        shippingAddressId: z.string().optional(),
        shippingAddress: z
          .object({
            street: z.string().min(1),
            city: z.string().min(1),
            state: z.string().min(1),
            zip: z.string().min(1),
            country: z.string().min(1),
          })
          .optional(),
        promoCodeId: z.string().optional(),
        email: z.string().email().optional(),
      })
      .safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0].message,
        code: "VALIDATION_ERROR",
      };
    }

    const session = await getSession();
    let userId: string | undefined;
    let sessionId: string | undefined;

    if (session && "userId" in session) {
      userId = session.userId;
    } else if (session && session.isGuest) {
      sessionId = session.sessionId;
    } else {
      return {
        success: false,
        error: "Invalid session",
        code: "INVALID_SESSION",
      };
    }

    // Create order
    const result = await orderService.createOrder(
      validated.data,
      userId,
      sessionId,
    );

    if (result.success) {
      // Clear cart after order creation
      await cartService.clearCart(userId, sessionId);
      revalidatePath("/orders");
      revalidatePath("/checkout");
    }

    return result;
  } catch (error) {
    console.error("Create order error:", error);
    return {
      success: false,
      error: "Failed to create order",
      code: "CREATE_ERROR",
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