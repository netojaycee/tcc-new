// filepath: src/lib/actions/checkout-unified.actions.ts
"use server";

import { z } from "zod";
import { getSession, getOrCreateGuestSession } from "@/lib/auth";
import { cartService } from "@/lib/services/cart.service";
import { orderService } from "@/lib/services/order.service";
import { printfulService } from "@/lib/services/printful.service";
import { printfulLocationService } from "@/lib/services/printful-location.service";
import { prisma } from "../db";
import { paymentService } from "@/lib/services/payment.service";

/**
 * Unified checkout action - SINGLE call that does everything
 * 
 * Flow:
 * 1. Validate input
 * 2. Get cart items
 * 3. Validate address with Printful
 * 4. Get shipping rates from Printful
 * 5. Get cost estimate from Printful
 * 6. Apply promo code discount
 * 7. Create draft order in DB with locked costs
 * 8. Return summary data
 * 
 * NOTE: This creates the order but does NOT create Stripe payment intent yet
 * That happens only after user confirms on the summary screen
 */
export async function checkoutUnifiedAction(input: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  deliveryAddress: {
    street: string;
    city: string;
    state?: string;
    zip: string;
    country: string;
  };
  promoCode?: string;
  currency: string;      // User's currency (USD, GBP, CAD, etc)
  exchangeRate: number;  // Exchange rate from CAD to user's currency
}) {
  try {
    // ========== VALIDATION ==========
    const schema = z.object({
      email: z.string().email("Invalid email"),
      firstName: z.string().min(1, "First name required"),
      lastName: z.string().min(1, "Last name required"),
      phone: z.string().optional(),
      deliveryAddress: z.object({
        street: z.string().min(1, "Street required"),
        city: z.string().min(1, "City required"),
        state: z.string().optional(),
        zip: z.string().min(1, "ZIP required"),
        country: z.string().min(2, "Country required"),
      }),
      promoCode: z.string().optional(),
      currency: z.string().min(2, "Currency required"),
      exchangeRate: z.number().positive("Exchange rate must be positive"),
    });

    const validated = schema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Validation failed",
        code: "VALIDATION_ERROR",
      };
    }

    // ========== SESSION ==========
    let session = await getSession();
    if (!session) {
      session = await getOrCreateGuestSession();
    }

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
        code: "SESSION_ERROR",
      };
    }

    // ========== GET CART ==========
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

    const cartItems = cart.items.map((item: any) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      price: item.product.basePrice,
      customData: item.customData,
    }));

    // Calculate subtotal (from product basePrice, not Printful)
    const subtotal = cartItems.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    // ========== VALIDATE ADDRESS WITH PRINTFUL ==========
    const country = await printfulLocationService.getCountryByCode(
      validated.data.deliveryAddress.country
    );

    if (!country) {
      return {
        success: false,
        error: `Country not found: ${validated.data.deliveryAddress.country}`,
        code: "INVALID_COUNTRY",
      };
    }

    // If country has states and none provided, error
    if (country.states && country.states.length > 0 && !validated.data.deliveryAddress.state) {
      return {
        success: false,
        error: "State/province is required for this country",
        code: "MISSING_STATE",
      };
    }

    // ========== GET SHIPPING RATES (for UI, optional) ==========
    let shippingRates: any[] = [];
    try {
      shippingRates = await printfulLocationService.getShippingRates(
        cartItems.map((item: any) => ({
          variant_id: item.variantId,
          quantity: item.quantity,
        })),
        {
          country_code: validated.data.deliveryAddress.country,
          state_code: validated.data.deliveryAddress.state,
          city: validated.data.deliveryAddress.city,
          zip: validated.data.deliveryAddress.zip,
          address1: validated.data.deliveryAddress.street,
        }
      );
      console.log("[Checkout Unified] Shipping rates:", shippingRates);
    } catch (error) {
      console.warn("[Checkout Unified] Shipping rates fetch failed:", error);
      // Not critical - estimate costs will still work
    }

    // ========== ESTIMATE COSTS FROM PRINTFUL ==========
    let printfulCosts;
    try {
      printfulCosts = await printfulService.estimateOrderCosts(
        cartItems.map((item: any) => ({
          variant_id: item.variantId,
          quantity: item.quantity,
        })),
        {
          address1: validated.data.deliveryAddress.street,
          city: validated.data.deliveryAddress.city,
          state_code: validated.data.deliveryAddress.state,
          country_code: validated.data.deliveryAddress.country,
          zip: validated.data.deliveryAddress.zip,
        }
      );
    } catch (error) {
      console.error("[Checkout Unified] Printful cost estimate failed:", error);
      return {
        success: false,
        error: "Failed to calculate shipping and tax. Please try again.",
        code: "PRINTFUL_ERROR",
      };
    }

    // ========== APPLY PROMO CODE ==========
    let discountAmount = 0;
    let promoCodeId: string | undefined;
    if (validated.data.promoCode) {
      try {
        const promoResult = await prisma.promoCode.findFirst({
          where: {
            code: validated.data.promoCode.toUpperCase(),
            active: true,
            expiry: { gt: new Date() },
          },
        });

        if (promoResult) {
          if (promoResult.type === "percent") {
            discountAmount = (subtotal * promoResult.value) / 100;
          } else {
            discountAmount = promoResult.value;
          }
          promoCodeId = promoResult.id;
        }
      } catch (error) {
        console.warn("[Checkout Unified] Promo code check failed:", error);
      }
    }

    // ========== CALCULATE FINAL COSTS ==========
    // Convert all costs from CAD (Printful returns CAD) to user's currency
    const convertFromCAD = (cadAmount: number) => {
      return Math.round(cadAmount * validated.data.exchangeRate * 100) / 100;
    };

    const finalCosts = {
      subtotal: convertFromCAD(subtotal),
      discount: convertFromCAD(discountAmount),
      tax: convertFromCAD(printfulCosts.tax || 0),
      shipping: convertFromCAD(printfulCosts.shipping || 0),
      shippingTime: printfulCosts.shipping_time || "",
      total: convertFromCAD(
        subtotal - discountAmount + (printfulCosts.tax || 0) + (printfulCosts.shipping || 0)
      ),
    };

    console.log("[Checkout Unified] Final costs (in " + validated.data.currency + "):", finalCosts);

    // ========== CREATE DRAFT ORDER IN DB ==========
    let draftOrderId: string;
    try {
      draftOrderId = await orderService.createDraftOrder({
        email: validated.data.email,
        firstName: validated.data.firstName,
        lastName: validated.data.lastName,
        phone: validated.data.phone,
        deliveryAddress: validated.data.deliveryAddress,
        items: cartItems,
        subtotal: finalCosts.subtotal,
        discountAmount: finalCosts.discount,
        tax: finalCosts.tax,
        shippingFee: finalCosts.shipping,
        total: finalCosts.total,
        currency: validated.data.currency,
        promoCodeId,
        userId,
        sessionId,
        shippingRates: shippingRates.length > 0 ? shippingRates : undefined,
      });
    } catch (error) {
      console.error("[Checkout Unified] Draft order creation failed:", error);
      return {
        success: false,
        error: "Failed to create draft order",
        code: "ORDER_ERROR",
      };
    }

    // ========== CREATE PAYMENT INTENT ==========
    let clientSecret: string;
    try {
      // Use the user's currency (already converted amounts are in this currency)
      const paymentResult = await paymentService.createPaymentIntent({
        orderId: draftOrderId,
        amount: finalCosts.total,
        email: validated.data.email,
        currency: validated.data.currency,
      });

      if (!paymentResult.success) {
        return {
          success: false,
          error: paymentResult.error || "Failed to create payment intent",
          code: "PAYMENT_ERROR",
        };
      }

      clientSecret = paymentResult.data.clientSecret;

      // ========== SAVE SHIPPING RATES TO ORDER ==========
      // shippingRates is order-specific data from Printful, save for checkout display
      // clientSecret is now saved in Payment model by paymentService.createPaymentIntent()
      await prisma.order.update({
        where: { id: draftOrderId },
        data: {
          shippingRates: shippingRates.length > 0 ? (shippingRates as any) : null,
        },
      });
    } catch (error) {
      console.error("[Checkout Unified] Payment intent creation failed:", error);
      return {
        success: false,
        error: "Failed to create payment. Please try again.",
        code: "PAYMENT_ERROR",
      };
    }

    // ========== RETURN SUMMARY DATA WITH CLIENT SECRET ==========
    return {
      success: true,
      data: {
        draftOrderId,
        clientSecret,
        email: validated.data.email,
        firstName: validated.data.firstName,
        lastName: validated.data.lastName,
        deliveryAddress: validated.data.deliveryAddress,
        items: cartItems,
        costs: finalCosts,
        shippingRates: shippingRates.length > 0 ? shippingRates : undefined,
      },
    };
  } catch (error) {
    console.error("[Checkout Unified] Unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      code: "UNEXPECTED_ERROR",
    };
  }
}

/**
 * Confirm draft order and create Stripe payment intent
 * Called AFTER user reviews summary and clicks "Pay Now"
 */
export async function confirmAndPayAction(input: { draftOrderId: string }) {
  try {
    const schema = z.object({
      draftOrderId: z.string().min(1, "Draft order ID required"),
    });

    const validated = schema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Validation failed",
        code: "VALIDATION_ERROR",
      };
    }

    // Get draft order from DB
    const draftOrder = await prisma.order.findUnique({
      where: { id: validated.data.draftOrderId },
      include: { items: true },
    });

    if (!draftOrder) {
      return {
        success: false,
        error: "Draft order not found",
        code: "NOT_FOUND",
      };
    }

    // Accept draft or pending status
    const status = draftOrder.status as string;
    const isValidStatus = status === "draft" || status === "pending";
    if (!isValidStatus) {
      return {
        success: false,
        error: "Order is no longer in draft status",
        code: "INVALID_STATUS",
      };
    }

    // Create Stripe PaymentIntent
    const { paymentService } = await import("@/lib/services/payment.service");
    const deliveryAddr = typeof draftOrder.deliveryAddress === "string" 
      ? JSON.parse(draftOrder.deliveryAddress) 
      : draftOrder.deliveryAddress as any;
    const currency = detectCurrencyFromCountry(deliveryAddr?.country || "");

    const paymentResult = await paymentService.createPaymentIntent({
      orderId: draftOrder.id,
      amount: draftOrder.total || 0,
      email: draftOrder.email || "noreply@example.com",
      currency,
    });

    if (!paymentResult.success) {
      return {
        success: false,
        error: paymentResult.error,
        code: paymentResult.code,
      };
    }

    return {
      success: true,
      data: {
        orderId: draftOrder.id,
        clientSecret: paymentResult.data.clientSecret,
        amount: draftOrder.total,
        currency,
      },
    };
  } catch (error) {
    console.error("[Confirm And Pay] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process payment",
      code: "PAYMENT_ERROR",
    };
  }
}

/**
 * Helper to detect currency from country
 */
function detectCurrencyFromCountry(country: string): string {
  const currencyMap: Record<string, string> = {
    "united states": "usd",
    us: "usd",
    canada: "cad",
    uk: "gbp",
    "united kingdom": "gbp",
    australia: "aud",
  };

  const normalized = country.toLowerCase().trim();
  return currencyMap[normalized] || "cad";
}
