import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { z } from "zod";

const CACHE_TTL = 1800; // 30 minutes for orders

// Types
export type OrderResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

// Validation Schemas
// TODO: If we need to support saved addresses from Address model, revert shippingAddressId and adjust logic accordingly
export const createOrderSchema = z.object({
  cartItems: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
        price: z.number().positive(),
        variantId: z.string().optional(), // Printful variant ID
        customData: z.any().optional(), // Customization data
      }),
    )
    .min(1, "Cart cannot be empty"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  shippingAddressId: z.string().optional(), // TODO: For future use with saved addresses
  shippingAddress: z
    .object({
      street: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      zip: z.string().min(1),
      country: z.string().min(1),
    })
    .optional(), // TODO: For future use with saved addresses
  deliveryAddress: z
    .object({
      street: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      zip: z.string().min(1),
      country: z.string().min(1),
    })
    .optional(), // Address collected from checkout form
  promoCodeId: z.string().optional(),
  email: z.string().email().optional(), // For guest orders
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// Helper: Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

// Helper: Invalidate order cache
async function invalidateOrderCache(userId?: string) {
  try {
    if (userId) {
      await redis.del(`orders:user:${userId}`);
    }
  } catch (error) {
    console.error("Redis cache invalidation error:", error);
  }
}




export const orderService = {
  // ============ READ OPERATIONS ============

  /**
   * Get user's orders (paginated)
   */
  async getUserOrders(
    userId: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<OrderResult<{ orders: any[]; total: number }>> {
    try {
      // Try cache first
      const cacheKey = `orders:user:${userId}`;
      try {
        const cached = await redis.get(cacheKey);
        if (cached) return { success: true, data: cached as any };
      } catch (error) {
        console.error("Redis get error:", error);
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where: { userId },
          include: {
            items: {
              include: { product: { select: { name: true, gallery: true } } },
            },
            promoCode: true,
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
        }),
        prisma.order.count({ where: { userId } }),
      ]);

      const result = { orders, total };

      try {
        await redis.set(cacheKey, result, { ex: CACHE_TTL });
      } catch (error) {
        console.error("Redis set error:", error);
      }

      return { success: true, data: result };
    } catch (error) {
      console.error("Get user orders error:", error);
      return {
        success: false,
        error: "Failed to fetch orders",
        code: "FETCH_ERROR",
      };
    }
  },

  /**
   * Get single order by ID or order number
   */
  async getOrder(idOrOrderNumber: string): Promise<any> {
    try {
      const order = await prisma.order.findFirst({
        where: {
          OR: [{ id: idOrOrderNumber }, { orderNumber: idOrOrderNumber.toString().toUpperCase() }],
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  basePrice: true,
                  mainImage: true,
                  variants: true,
                },
              },
            },
          },
          payment: true,
        },
      });

      if (!order) {
        return {
          success: false,
          error: "Order not found",
        };
      }

      // Parse delivery address from JSON
      const deliveryAddress =
        typeof order.deliveryAddress === "string"
          ? JSON.parse(order.deliveryAddress)
          : order.deliveryAddress;

      // Parse shipping rates from JSON
      const shippingRates =
        typeof order.shippingRates === "string"
          ? JSON.parse(order.shippingRates)
          : (order.shippingRates as any) || [];

      // Return transformed order - clientSecret is read from the payment relation
      return {
        success: true,
        data: {
          id: order.id,
          draftOrderId: order.id,
          currency: order.currency,
          clientSecret: order.payment?.stripeClientSecret || "",
          email: order.email || "",
          firstName: order.firstName || "",
          lastName: order.lastName || "",
          deliveryAddress: deliveryAddress,
          status: order.status,
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          items: order.items.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
            product: item.product,

          })),
          costs: {
            subtotal: order.subtotal,
            discountAmount: order.discountAmount || 0,
            tax: order.tax || 0,
            shipping: order.shippingFee || 0,
            total: order.total,
          },
          shippingRates: Array.isArray(shippingRates) ? shippingRates : [],
        },
      };
    } catch (error) {
      console.error("Get order error:", error);
      return {
        success: false,
        error: "Failed to fetch order",
        code: "FETCH_ERROR",
      };
    }
  },

  /**
   * Get order by payment intent ID (for webhook verification)
   */
  async getOrderByPaymentIntentId(
    stripePaymentIntentId: string,
  ): Promise<OrderResult<any>> {
    try {
      const order = await prisma.order.findFirst({
        where: { stripePaymentIntentId },
        include: {
          items: { include: { product: true } },
          payment: true,
        },
      });

      if (!order) {
        return {
          success: false,
          error: "Order not found",
          code: "NOT_FOUND",
        };
      }

      return { success: true, data: order };
    } catch (error) {
      console.error("Get order by payment intent error:", error);
      return {
        success: false,
        error: "Failed to fetch order",
        code: "FETCH_ERROR",
      };
    }
  },

  /**
   * Create draft order (checkout unified flow)
   * This is called before payment - costs are locked at this point
   * Called from checkoutUnifiedAction
   */
  async createDraftOrder(data: {
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
    items: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
      price: number;
      customData?: any;
    }>;
    subtotal: number;
    discountAmount: number;
    tax: number;
    shippingFee: number;
    total: number;
    currency: string;      // User's currency (amounts are already converted)
    promoCodeId?: string;
    userId?: string;
    sessionId?: string;
    shippingRates?: any[]; // Save shipping rates to order
  }): Promise<{ draftOrderId: string; orderNumber: string }> {
    try {
      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: data.userId,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          email: data.email,
          guestSessionId: data.sessionId,
          status: "draft", // Draft until payment
          currency: data.currency,
          subtotal: data.subtotal,
          tax: data.tax,
          shippingFee: data.shippingFee,
          discountAmount: data.discountAmount,
          total: data.total,
          deliveryAddress: data.deliveryAddress as any,
          shippingRates: data.shippingRates
            ? (data.shippingRates as any)
            : null, // Save shipping rates
          promoCodeId: data.promoCodeId,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              variantId: item.variantId,
              customData: item.customData,
            })),
          },
        },
      });

      // Invalidate user cache
      if (data.userId) {
        await invalidateOrderCache(data.userId);
      }

      return { draftOrderId: order.id, orderNumber: order.orderNumber };  // Return UUID and orderNumber
    } catch (error) {
      console.error("Create draft order error:", error);
      throw new Error("Failed to create draft order");
    }
  },

  // ============ UPDATE ORDER STATUS ============

  /**
   * Update order status (used by payment webhook)
   */
  async updateOrderStatus(
    orderId: string,
    status:
      | "draft"
      | "pending"
      | "paid"
      | "processing"
      | "shipped"
      | "delivered"
      // | "completed"
      | "cancelled"
      | "failed",
  ): Promise<OrderResult<any>> {
    try {
      const order = await prisma.order.findUnique({ where: { id: orderId } });

      if (!order) {
        return {
          success: false,
          error: "Order not found",
          code: "NOT_FOUND",
        };
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status },
        include: {
          items: { include: { product: true } },
          payment: true,
        },
      });

      // Invalidate cache
      if (order.userId) {
        await invalidateOrderCache(order.userId);
      }

      return { success: true, data: updated };
    } catch (error) {
      console.error("Update order status error:", error);
      return {
        success: false,
        error: "Failed to update order",
        code: "UPDATE_ERROR",
      };
    }
  },

  /**
   * Set Stripe payment intent ID on order
   */
  async setStripePaymentIntent(
    orderId: string,
    stripePaymentIntentId: string,
  ): Promise<OrderResult<any>> {
    try {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { stripePaymentIntentId },
        include: { items: { include: { product: true } } },
      });

      return { success: true, data: order };
    } catch (error) {
      console.error("Set Stripe payment intent error:", error);
      return {
        success: false,
        error: "Failed to set payment intent",
        code: "UPDATE_ERROR",
      };
    }
  },

  /**
   * Set Printful order ID and status on order (after payment)
   */
  async setPrintfulOrder(
    orderId: string,
    printfulOrderId: string,
    printfulStatus: string = "draft",
  ): Promise<OrderResult<any>> {
    try {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          printfulOrderId,
          printfulStatus,
          lastPrintfulSync: new Date(),
        },
        include: { items: { include: { product: true } } },
      });

      return { success: true, data: order };
    } catch (error) {
      console.error("Set Printful order error:", error);
      return {
        success: false,
        error: "Failed to set Printful order",
        code: "UPDATE_ERROR",
      };
    }
  },

  /**
   * Update Printful status (synced from Printful webhook)
   */
  async updatePrintfulStatus(
    orderId: string,
    printfulStatus: string,
  ): Promise<OrderResult<any>> {
    try {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          printfulStatus,
          lastPrintfulSync: new Date(),
        },
        include: { items: { include: { product: true } } },
      });

      return { success: true, data: order };
    } catch (error) {
      console.error("Update Printful status error:", error);
      return {
        success: false,
        error: "Failed to update Printful status",
        code: "UPDATE_ERROR",
      };
    }
  },

  // ============ CANCEL ORDER ============

  /**
   * Cancel order (only if pending)
   */
  async cancelOrder(
    orderId: string,
    userId?: string,
  ): Promise<OrderResult<any>> {
    try {
      const order = await prisma.order.findUnique({ where: { id: orderId } });

      if (!order) {
        return {
          success: false,
          error: "Order not found",
          code: "NOT_FOUND",
        };
      }

      // Verify ownership
      if (userId && order.userId !== userId) {
        return {
          success: false,
          error: "Unauthorized",
          code: "FORBIDDEN",
        };
      }

      // Can only cancel pending orders
      if (order.status !== "pending") {
        return {
          success: false,
          error: "Can only cancel pending orders",
          code: "INVALID_STATUS",
        };
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: "cancelled" },
        include: { items: { include: { product: true } } },
      });

      if (userId) {
        await invalidateOrderCache(userId);
      }

      return { success: true, data: updated };
    } catch (error) {
      console.error("Cancel order error:", error);
      return {
        success: false,
        error: "Failed to cancel order",
        code: "CANCEL_ERROR",
      };
    }
  },
};
