import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { z } from "zod";
import { printfulService } from "@/lib/services/printful.service";

const CACHE_TTL = 1800; // 30 minutes for cart (more frequent updates)

// Types
export type CartResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

export interface ShippingAddress {
  street: string;
  city: string;
  state?: string;
  zip: string;
  country: string;
}

// Validation Schemas
export const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID required"),
  variantId: z.string().min(1, "Variant ID required"),
  quantity: z.number().int().positive("Quantity must be positive"),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive("Quantity must be positive"),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

// Helper: Invalidate cart cache
async function invalidateCartCache(userId?: string, sessionId?: string) {
  try {
    if (userId) {
      await redis.del(`cart:user:${userId}`);
    }
    if (sessionId) {
      await redis.del(`cart:session:${sessionId}`);
    }
  } catch (error) {
    console.error("Redis cache invalidation error:", error);
  }
}

// Helper: Get or create cart
async function getOrCreateCart(
  userId?: string,
  sessionId?: string,
): Promise<any> {
  let cart;

  if (userId) {
    cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
          expireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
        include: { items: { include: { product: true } } },
      });
    }
  } else if (sessionId) {
    cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: { items: { include: { product: true } } },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          sessionId,
          expireAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days for guest
        },
        include: { items: { include: { product: true } } },
      });
    }
  }

  return cart;
}

// Helper: Calculate tax based on delivery address country
// DEPRECATED: Now using Printful API for tax calculation
// Kept for reference only
function calculateTax(subtotal: number, country: string): number {
  const taxRates: Record<string, number> = {
    "united kingdom": 0.2, // UK VAT 20%
    uk: 0.2,
    "united states": 0.0, // US: varies by state, for now 0 (apply state tax separately if needed)
    us: 0.0,
    usa: 0.0,
    canada: 0.05, // Canada: GST 5% (provinces add PST)
    australia: 0.1, // Australia: GST 10%
  };

  const normalized = country.toLowerCase().trim();
  const taxRate = taxRates[normalized] || 0;

  return Math.round(subtotal * taxRate * 100) / 100;
}

// Helper: Calculate shipping fee based on subtotal and country
// DEPRECATED: Now using Printful API for shipping calculation
// Kept for reference only
function calculateShipping(subtotal: number, country: string): number {

  // Free shipping on orders over £50
  if (subtotal >= 50) {
    return 0;
  }

  // Shipping rates by region
  const shippingRates: Record<string, number> = {
    "united kingdom": 4.99,
    uk: 4.99,
    "united states": 9.99,
    us: 9.99,
    usa: 9.99,
    canada: 14.99,
    australia: 19.99,
  };

  const normalized_lower = country.toLowerCase().trim();
  return shippingRates[normalized_lower] || 9.99; // Default to $9.99
}

export const cartService = {
  // ============ READ OPERATIONS ============

  /**
   * Get cart by user or session
   */
  async getCart(sessionId?: string, userId?: string): Promise<any | null> {
    if (!userId && !sessionId) {
      return null;
    }
// console.log(sessionId, userId)
    // Check cache first
    const cacheKey = userId
      ? `cart:user:${userId}`
      : `cart:session:${sessionId}`;

      // console.log(cacheKey)

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return cached;
    } catch (error) {
      console.error("Redis get error:", error);
    }

    const cart = await prisma.cart.findUnique({
      where: userId ? { userId } : { sessionId: sessionId! },
      include: {
        items: {
          select: {
            id: true,
            cartId: true,
            productId: true,
            quantity: true,
            price: true,
            variantId: true,
            createdAt: true,
            updatedAt: true,
            product: {
              select: { 
                id: true, 
                name: true, 
                basePrice: true, 
                mainImage: true,
                gallery: true,
                variants: true, // Include variants JSON to get variant preview images
              },
            },
          },
        },
      },
    });

    if (cart) {
      try {
        await redis.set(cacheKey, cart, { ex: CACHE_TTL });
      } catch (error) {
        console.error("Redis set error:", error);
      }
    }

    return cart;
  },

  // ============ WRITE OPERATIONS ============

  /**
   * Add item to cart (or increase quantity if exists)
   * Note: productId can be either a database product ID or a Printful variant ID (numeric string)
   * When from product variants, it's the Printful variantId (e.g., "5147976736")
   */
  async addToCart(
    data: AddToCartInput,
    userId?: string,
    sessionId?: string,
  ): Promise<CartResult<any>> {
    try {
      if (!userId && !sessionId) {
        return {
          success: false,
          error: "User ID or Session ID required",
          code: "INVALID_CONTEXT",
        };
      }

      const validated = addToCartSchema.parse(data);

      // Get or create cart first
      const cart = await getOrCreateCart(userId, sessionId);

      // Check if product+variant combination already in cart
      const existingItem = cart.items.find(
        (item: any) => item.productId === validated.productId && item.variantId === validated.variantId,
      );

      let cartItem;
      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + validated.quantity;

        cartItem = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
          include: { product: true },
        });
      } else {
        // Create new cart item with both productId and variantId
        cartItem = await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: validated.productId,
            variantId: validated.variantId, // Printful variant ID (e.g., "5147976736")
            quantity: validated.quantity,
            price: 0, // Price will be determined from Printful or product data during checkout
          },
          include: { product: true },
        });
      }

      // Invalidate cache
      await invalidateCartCache(userId, sessionId);

      return { success: true, data: cartItem };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
          code: "VALIDATION_ERROR",
        };
      }
      console.error("Add to cart error:", error);
      return {
        success: false,
        error: "Failed to add item to cart",
        code: "ADD_ERROR",
      };
    }
  },

  /**
   * Update cart item quantity
   */
  async updateCartItem(
    itemId: string,
    data: UpdateCartItemInput,
    userId?: string,
    sessionId?: string,
  ): Promise<CartResult<any>> {
    try {
      if (!userId && !sessionId) {
        return {
          success: false,
          error: "User ID or Session ID required",
          code: "INVALID_CONTEXT",
        };
      }

      const validated = updateCartItemSchema.parse(data);

      // Verify item exists and belongs to user/session
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: itemId },
        include: { cart: true, product: true },
      });

      if (!cartItem) {
        return {
          success: false,
          error: "Cart item not found",
          code: "NOT_FOUND",
        };
      }

      // Verify ownership
      if (userId && cartItem.cart.userId !== userId) {
        return {
          success: false,
          error: "Unauthorized",
          code: "FORBIDDEN",
        };
      }

      if (sessionId && cartItem.cart.sessionId !== sessionId) {
        return {
          success: false,
          error: "Unauthorized",
          code: "FORBIDDEN",
        };
      }

      // Check stock
      // if (cartItem.product.availableQuantity < validated.quantity) {
      //   return {
      //     success: false,
      //     error: `Only ${cartItem.product.availableQuantity} in stock`,
      //     code: "INSUFFICIENT_STOCK",
      //   };
      // }

      const updated = await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity: validated.quantity },
        include: { product: true },
      });

      await invalidateCartCache(userId, sessionId);

      return { success: true, data: updated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0].message,
          code: "VALIDATION_ERROR",
        };
      }
      console.error("Update cart item error:", error);
      return {
        success: false,
        error: "Failed to update cart item",
        code: "UPDATE_ERROR",
      };
    }
  },

  /**
   * Remove item from cart
   */
  async removeFromCart(
    itemId: string,
    userId?: string,
    sessionId?: string,
  ): Promise<CartResult<any>> {
    try {
      if (!userId && !sessionId) {
        return {
          success: false,
          error: "User ID or Session ID required",
          code: "INVALID_CONTEXT",
        };
      }

      const cartItem = await prisma.cartItem.findUnique({
        where: { id: itemId },
        include: { cart: true },
      });

      if (!cartItem) {
        return {
          success: false,
          error: "Cart item not found",
          code: "NOT_FOUND",
        };
      }

      // Verify ownership
      if (userId && cartItem.cart.userId !== userId) {
        return {
          success: false,
          error: "Unauthorized",
          code: "FORBIDDEN",
        };
      }

      if (sessionId && cartItem.cart.sessionId !== sessionId) {
        return {
          success: false,
          error: "Unauthorized",
          code: "FORBIDDEN",
        };
      }

      await prisma.cartItem.delete({
        where: { id: itemId },
      });

      await invalidateCartCache(userId, sessionId);

      return { success: true, data: { id: itemId } };
    } catch (error) {
      console.error("Remove from cart error:", error);
      return {
        success: false,
        error: "Failed to remove item from cart",
        code: "DELETE_ERROR",
      };
    }
  },

  /**
   * Clear cart
   */
  async clearCart(
    userId?: string,
    sessionId?: string,
  ): Promise<CartResult<any>> {
    try {
      if (!userId && !sessionId) {
        return {
          success: false,
          error: "User ID or Session ID required",
          code: "INVALID_CONTEXT",
        };
      }

      const cart = await prisma.cart.findUnique({
        where: userId ? { userId } : { sessionId: sessionId! },
      });

      if (!cart) {
        return { success: true, data: { cleared: true } };
      }

      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      await invalidateCartCache(userId, sessionId);

      return { success: true, data: { cleared: true } };
    } catch (error) {
      console.error("Clear cart error:", error);
      return {
        success: false,
        error: "Failed to clear cart",
        code: "DELETE_ERROR",
      };
    }
  },

  // ============ MERGE OPERATIONS ============

  /**
   * Merge guest cart to user cart on registration/login
   * Strategy: Add new products, increase quantity for existing products
   */
  async mergeGuestCartToUser(
    userId: string,
    sessionId: string,
  ): Promise<CartResult<any>> {
    try {
      // Get both carts
      const [guestCart, userCart] = await Promise.all([
        prisma.cart.findUnique({
          where: { sessionId },
          include: { items: true },
        }),
        getOrCreateCart(userId),
      ]);

      if (!guestCart || !guestCart.items.length) {
        return { success: true, data: userCart };
      }

      // Merge items
      for (const guestItem of guestCart.items) {
        const existingItem = userCart.items.find(
          (item: any) => item.productId === guestItem.productId,
        );

        if (existingItem) {
          // Increase quantity
          await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + guestItem.quantity },
          });
        } else {
          // Add new item
          await prisma.cartItem.create({
            data: {
              cartId: userCart.id,
              productId: guestItem.productId,
              quantity: guestItem.quantity,
              price: guestItem.price,
            },
          });
        }
      }

      // Delete guest cart
      await prisma.cart.delete({
        where: { sessionId },
      });

      // Get updated user cart
      const mergedCart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } },
      });

      await invalidateCartCache(userId, sessionId);

      return { success: true, data: mergedCart };
    } catch (error) {
      console.error("Merge cart error:", error);
      return {
        success: false,
        error: "Failed to merge carts",
        code: "MERGE_ERROR",
      };
    }
  },

  // ============ UTILITY OPERATIONS ============

  /**
   * Calculate cart totals (subtotal, tax, shipping, discount)
   */
  async calculateTotals(
    userId?: string,
    sessionId?: string,
    promoCode?: string,
  ): Promise<any> {
    const cart = await this.getCart(userId, sessionId);

    if (!cart || cart.items.length === 0) {
      return {
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0,
        itemCount: 0,
      };
    }

    // Calculate subtotal
    const subtotal = cart.items.reduce(
      (sum: number, item: any) => sum + item.product.basePrice * item.quantity,
      0,
    );

    // Check for promo discount
    let discount = 0;
    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({
        where: { code: promoCode.toUpperCase() },
      });

      if (promo && promo.active) {
        const now = new Date();
        if (!promo.expiry || promo.expiry > now) {
          if (promo.minOrder === null || subtotal >= promo.minOrder) {
            if (promo.type === "percent") {
              discount = (subtotal * promo.value) / 100;
            } else if (promo.type === "fixed") {
              discount = promo.value;
            }
          }
        }
      }
    }

    // Apply minimum order for discount
    const discountedSubtotal = subtotal - discount;

    // Calculate tax (10%)
    const tax = discountedSubtotal * 0.1;

    // Calculate shipping (free over $50)
    const shipping = subtotal >= 50 ? 0 : 4.99;

    // Calculate total
    const total = discountedSubtotal + tax + shipping;

    return {
      subtotal,
      tax: Math.round(tax * 100) / 100,
      shipping,
      discount: Math.round(discount * 100) / 100,
      total: Math.round(total * 100) / 100,
      itemCount: cart.items.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0,
      ),
    };
  },

  /**
   * Apply promo code to cart
   */
  async applyPromoCode(
    userId: string | undefined,
    code: string,
    sessionId?: string,
  ): Promise<CartResult<any>> {
    try {
      // Validate promo code exists and is active
      const promo = await prisma.promoCode.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (!promo) {
        return {
          success: false,
          error: "Invalid promo code",
          code: "PROMO_NOT_FOUND",
        };
      }

      if (!promo.active) {
        return {
          success: false,
          error: "This promo code is no longer active",
          code: "PROMO_INACTIVE",
        };
      }

      // Check expiry
      if (promo.expiry && promo.expiry < new Date()) {
        return {
          success: false,
          error: "This promo code has expired",
          code: "PROMO_EXPIRED",
        };
      }

      // Check usage limit
      if (promo.maxUses && promo.usedCount >= promo.maxUses) {
        return {
          success: false,
          error: "This promo code has reached its usage limit",
          code: "PROMO_LIMIT_REACHED",
        };
      }

      // Return promo details
      return {
        success: true,
        data: {
          code: promo.code,
          type: promo.type,
          value: promo.value,
          minOrder: promo.minOrder,
        },
      };
    } catch (error) {
      console.error("Apply promo code error:", error);
      return {
        success: false,
        error: "Failed to apply promo code",
        code: "PROMO_ERROR",
      };
    }
  },

  /**
   * Validate cart before checkout
   */
  async validateCheckout(
    userId?: string,
    sessionId?: string,
  ): Promise<CartResult<any>> {
    try {
      const cart = await this.getCart(sessionId, userId);

      if (!cart || cart.items.length === 0) {
        return {
          success: false,
          error: "Your cart is empty",
          code: "EMPTY_CART",
        };
      }

      // Check stock for each item
      for (const item of cart.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          return {
            success: false,
            error: `Product "${item.product.name}" no longer exists`,
            code: "PRODUCT_NOT_FOUND",
          };
        }

        // if (product.availableQuantity < item.quantity) {
        //   return {
        //     success: false,
        //     error: `Only ${product.availableQuantity} of "${product.name}" available`,
        //     code: "INSUFFICIENT_STOCK",
        //   };
        // }
      }

      // Calculate totals
      const totals = await this.calculateTotals(userId, sessionId);

      return {
        success: true,
        data: {
          items: cart.items,
          totals,
        },
      };
    } catch (error) {
      console.error("Validate checkout error:", error);
      return {
        success: false,
        error: "Failed to validate checkout",
        code: "VALIDATION_ERROR",
      };
    }
  },

  /**
   * Calculate totals with address (includes tax + estimated shipping)
   * Returns detailed breakdown for checkout display
   */
  async calculateTotalsWithAddress(
    userId: string | undefined,
    address: ShippingAddress,
    promoCode?: string,
    sessionId?: string,
  ): Promise<CartResult<any>> {
    try {
      if (!userId && !sessionId) {
        return {
          success: false,
          error: "User ID or Session ID required",
          code: "INVALID_CONTEXT",
        };
      }

      const cart = await this.getCart(sessionId, userId);

      if (!cart || cart.items.length === 0) {
        return {
          success: false,
          error: "Your cart is empty",
          code: "EMPTY_CART",
        };
      }

      // Calculate subtotal
      const subtotal = cart.items.reduce(
        (sum: number, item: any) => sum + item.product.basePrice * item.quantity,
        0,
      );

      // Check for promo discount
      let discount = 0;
      if (promoCode) {
        const promo = await prisma.promoCode.findUnique({
          where: { code: promoCode.toUpperCase() },
        });

        if (promo && promo.active) {
          const now = new Date();
          if (!promo.expiry || promo.expiry > now) {
            if (promo.minOrder === null || subtotal >= promo.minOrder) {
              if (promo.type === "percent") {
                discount = (subtotal * promo.value) / 100;
              } else if (promo.type === "fixed") {
                discount = promo.value;
              }
            }
          }
        }
      }

      const discountedSubtotal = subtotal - discount;

      // Get real shipping and tax from Printful
      // Do NOT use fallback rates - require Printful to work
      let shipping = 0;
      let tax = 0;
      let shippingTime = "";

      try {
        const printfulItems = cart.items.map((item: any) => ({

          variant_id: item.variantId,
          quantity: item.quantity,
        }));

        // Convert country code for Printful API
        const countryCode = address.country.toUpperCase().slice(0, 2);

        console.log("[Checkout] Calling Printful for shipping/tax estimate");
        const printfulCosts = await printfulService.estimateOrderCosts(
          printfulItems,
          {
            address1: address.street,
            city: address.city,
            state_code: address.state || "",
            country_code: countryCode,
            zip: address.zip,
          },
        );

        shipping = printfulCosts.shipping || 0;
        tax = printfulCosts.tax || 0;
        shippingTime = printfulCosts.shipping_time || "5-10 business days";
        console.log(JSON.stringify(printfulCosts, null, 2));
        console.log(
          `[Checkout] Printful estimated - Shipping: ${shipping}, Tax: ${tax}, Time: ${shippingTime}`,
        );
      } catch (error) {
        console.error("[Checkout] Printful cost estimation failed:", error);
        return {
          success: false,
          error: "Unable to calculate shipping costs. Please try again or contact support.",
          code: "PRINTFUL_ERROR",
        };
      }

      // Calculate total
      const total = discountedSubtotal + tax + shipping;

      return {
        success: true,
        data: {
          subtotal: Math.round(subtotal * 100) / 100,
          tax: Math.round(tax * 100) / 100,
          shipping: Math.round(shipping * 100) / 100,
          discount: Math.round(discount * 100) / 100,
          total: Math.round(total * 100) / 100,
          shippingTime,
          itemCount: cart.items.reduce(
            (sum: number, item: any) => sum + item.quantity,
            0,
          ),
          items: cart.items.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            product: {
              id: item.product.id,
              name: item.product.name,
              basePrice: item.product.basePrice,
              gallery: item.product.gallery,
            },
            quantity: item.quantity,
            price: item.product.basePrice,
            variantId: item.variantId,
            customData: item.customData,
            lineTotal: item.product.basePrice * item.quantity,
          })),
        },
      };
    } catch (error) {
      console.error("Calculate totals with address error:", error);
      return {
        success: false,
        error: "Failed to calculate totals",
        code: "CALCULATION_ERROR",
      };
    }
  },
};
