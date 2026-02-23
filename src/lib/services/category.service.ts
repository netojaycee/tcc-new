import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";

const CACHE_TTL = 3600; // 1 hour

// Types
export type CategoryResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

// Helper: Invalidate category cache
async function invalidateCategoryCache(categoryId?: string) {
  try {
    if (categoryId) {
      await redis.del(`category:${categoryId}`);
    }
    // Invalidate all category list caches
    const keys = await redis.keys("categories:*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error("Redis cache invalidation error:", error);
  }
}

export const categoryService = {
  // ============ READ OPERATIONS ============

  /**
   * Get all categories
   */
  async getAllCategories(filters?: {
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const { limit = 50, offset = 0 } = filters || {};
    const cacheKey = `categories:all:${limit}:${offset}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return cached as any[];
    } catch (error) {
      console.error("Redis get error:", error);
    }

    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { title: "asc" },
      skip: offset,
      take: limit,
    });

    try {
      await redis.set(cacheKey, categories, { ex: CACHE_TTL });
    } catch (error) {
      console.error("Redis set error:", error);
    }

    return categories;
  },

  /**
   * Get single category by ID or title
   */
  async getCategoryByIdentifier(identifier: string): Promise<any | null> {
    const cacheKey = `category:${identifier}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return cached as any;
    } catch (error) {
      console.error("Redis get error:", error);
    }

    const category = await prisma.category.findFirst({
      where: {
        OR: [
          { id: identifier },
          { title: identifier },
          { printfulId: parseInt(identifier) || undefined },
        ],
      },
      include: {
        products: { select: { id: true, name: true, slug: true } },
        _count: { select: { products: true } },
      },
    });

    if (category) {
      try {
        await redis.set(cacheKey, category, { ex: CACHE_TTL });
      } catch (error) {
        console.error("Redis set error:", error);
      }
    }

    return category;
  },

  /**
   * Get categories with products (for catalog)
   */
  async getCategoriesWithProducts(limit = 10): Promise<any[]> {
    const cacheKey = `categories:with-products:${limit}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return cached as any[];
    } catch (error) {
      console.error("Redis get error:", error);
    }

    const categories = await prisma.category.findMany({
      include: {
        products: { take: limit, select: { id: true, name: true, slug: true, mainImage: true } },
        _count: { select: { products: true } },
      },
      orderBy: { title: "asc" },
    });

    try {
      await redis.set(cacheKey, categories, { ex: CACHE_TTL });
    } catch (error) {
      console.error("Redis set error:", error);
    }

    return categories;
  },

  /**
   * Get products in a category
   */
  async getProductsByCategory(
    categoryId: string,
    filters?: {
      limit?: number;
      offset?: number;
      sortBy?: "newest" | "popular" | "price_asc" | "price_desc";
    },
  ): Promise<any[]> {
    const { limit = 20, offset = 0, sortBy = "newest" } = filters || {};
    const cacheKey = `category:${categoryId}:products:${limit}:${offset}:${sortBy}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return cached as any[];
    } catch (error) {
      console.error("Redis get error:", error);
    }

    const orderByMap: Record<string, any> = {
      newest: { createdAt: "desc" },
      popular: { reviews: { _count: "desc" } },
      price_asc: { basePrice: "asc" },
      price_desc: { basePrice: "desc" },
    };

    const products = await prisma.product.findMany({
      where: { categoryId },
      include: { _count: { select: { reviews: true } } },
      orderBy: orderByMap[sortBy],
      skip: offset,
      take: limit,
    });

    try {
      await redis.set(cacheKey, products, { ex: CACHE_TTL });
    } catch (error) {
      console.error("Redis set error:", error);
    }

    return products;
  },
};
