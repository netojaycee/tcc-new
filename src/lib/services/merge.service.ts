/**
 * Merge Service
 *
 * Handles merging of guest data (orders, carts) when a user creates an account
 * - Merge guest orders by email to user account
 * - Merge session cart to user account
 */

import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";

export type MergeResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

export const mergeService = {
  /**
   * Merge guest orders to user account
   *
   * When a user registers, find all orders placed with their email
   * (as guest) and link them to the new user account
   */
  async mergeOrdersByEmail(
    userId: string,
    email: string,
  ): Promise<MergeResult<{ mergedCount: number }>> {
    try {
      // Find all orders with this email that don't have a userId
      const guestOrders = await prisma.order.findMany({
        where: {
          email: email,
          userId: null, // Only unattached guest orders
        },
      });

      if (guestOrders.length === 0) {
        return {
          success: true,
          data: { mergedCount: 0 },
        };
      }

      // Update all guest orders to link to the new user
      const updateResult = await prisma.order.updateMany({
        where: {
          email: email,
          userId: null,
        },
        data: {
          userId: userId,
        },
      });

      console.log(
        `[Merge Service] Merged ${updateResult.count} orders for user ${userId}`,
      );

      // Invalidate user orders cache
      try {
        await redis.del(`user:${userId}:orders`);
      } catch (error) {
        console.error("Redis cache invalidation error:", error);
      }

      return {
        success: true,
        data: { mergedCount: updateResult.count },
      };
    } catch (error) {
      console.error("Order merge error:", error);
      return {
        success: false,
        error: "Failed to merge orders",
        code: "ORDER_MERGE_FAILED",
      };
    }
  },

  /**
   * Merge guest session cart to user account
   *
   * When a user logs in/signs up, find any cart associated with their
   * session and merge items into their user cart
   */
  async mergeCartBySessionId(
    userId: string,
    sessionId?: string,
  ): Promise<MergeResult<{ mergedItems: number }>> {
    try {
      if (!sessionId) {
        return {
          success: true,
          data: { mergedItems: 0 },
        };
      }

      // Get the guest session cart
      const sessionCart = await prisma.cart.findUnique({
        where: { sessionId },
        include: { items: true },
      });

      if (!sessionCart || sessionCart.items.length === 0) {
        return {
          success: true,
          data: { mergedItems: 0 },
        };
      }

      // Get or create user cart
      let userCart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
      });

      if (!userCart) {
        userCart = await prisma.cart.create({
          data: {
            userId,
            expireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
          include: { items: true },
        });
      }

      // Map existing items by productId + variantId for merging
      const existingItemsMap = new Map(
        userCart.items.map((item) => [`${item.productId}-${item.variantId}`, item]),
      );

      let mergedCount = 0;

      // Merge each session cart item
      for (const sessionItem of sessionCart.items) {
        const itemKey = `${sessionItem.productId}-${sessionItem.variantId}`;
        const existingItem = existingItemsMap.get(itemKey);

        if (existingItem) {
          // Item already in user cart: add quantities
          await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: existingItem.quantity + sessionItem.quantity,
            },
          });
        } else {
          // New item: create in user cart
          await prisma.cartItem.create({
            data: {
              cartId: userCart.id,
              productId: sessionItem.productId,
              variantId: sessionItem.variantId,
              quantity: sessionItem.quantity,
              price: sessionItem.price, // Use price from session item
            },
          });
        }

        mergedCount++;
      }

      // Delete the session cart (cascade delete will remove items)
      await prisma.cart.delete({
        where: { id: sessionCart.id },
      });

      console.log(
        `[Merge Service] Merged ${mergedCount} cart items for user ${userId} from session ${sessionId}`,
      );

      // Invalidate caches
      try {
        await redis.del(`cart:user:${userId}`);
        await redis.del(`cart:session:${sessionId}`);
      } catch (error) {
        console.error("Redis cache invalidation error:", error);
      }

      return {
        success: true,
        data: { mergedItems: mergedCount },
      };
    } catch (error) {
      console.error("Cart merge error:", error);
      return {
        success: false,
        error: "Failed to merge cart",
        code: "CART_MERGE_FAILED",
      };
    }
  },

  /**
   * Full merge operation (orders + cart)
   *
   * Called after user account creation to merge all guest data
   */
  async mergeAllGuestData(
    userId: string,
    email: string,
    sessionId?: string,
  ): Promise<
    MergeResult<{
      mergedOrders: number;
      mergedCartItems: number;
    }>
  > {
    try {
      // Merge orders by email
      const orderMerge = await this.mergeOrdersByEmail(userId, email);
      if (!orderMerge.success) {
        console.warn(`Order merge failed for user ${userId}:`, orderMerge.error);
      }

      // Merge cart by session
      const cartMerge = await this.mergeCartBySessionId(userId, sessionId);
      if (!cartMerge.success) {
        console.warn(`Cart merge failed for user ${userId}:`, cartMerge.error);
      }

      const result = {
        mergedOrders: orderMerge.success ? orderMerge.data.mergedCount : 0,
        mergedCartItems: cartMerge.success ? cartMerge.data.mergedItems : 0,
      };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Full merge error:", error);
      return {
        success: false,
        error: "Failed to merge guest data",
        code: "MERGE_FAILED",
      };
    }
  },
};
