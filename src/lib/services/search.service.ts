import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { z } from "zod";

// ============ TYPES ============

export type SearchServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

export interface SearchFilters {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "price_asc" | "price_desc" | "newest" | "popular";
  limit?: number;
  offset?: number;
  productType?: "store" | "catalog";
}

export interface SearchResult {
  products: any[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ============ VALIDATION SCHEMAS ============

const searchFiltersSchema = z.object({
  categoryId: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().positive().optional(),
  sortBy: z
    .enum(["price_asc", "price_desc", "newest", "popular"])
    .optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  productType: z.enum(["store", "catalog"]).optional(),
});

// ============ SEARCH OPERATIONS ============

/**
 * Search products by name
 */
export async function searchProducts(
  query: string,
  filters?: SearchFilters
): Promise<SearchServiceResult<SearchResult>> {
  try {
    const validated = searchFiltersSchema.parse(filters || {});

    // Build where clause
    const where: any = {
      active: true,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    };

    if (validated.categoryId) {
      where.categoryId = validated.categoryId;
    }
    if (validated.minPrice !== undefined) {
      where.basePrice = { gte: validated.minPrice };
    }
    if (validated.maxPrice !== undefined) {
      if (where.basePrice) {
        where.basePrice.lte = validated.maxPrice;
      } else {
        where.basePrice = { lte: validated.maxPrice };
      }
    }
    // if (validated.type) {
    //   where.productType = validated.type;
    // }

    // Determine sort order
    let orderBy: any = { createdAt: "desc" };
    if (validated.sortBy === "price_asc") {
      orderBy = { basePrice: "asc" };
    } else if (validated.sortBy === "price_desc") {
      orderBy = { basePrice: "desc" };
    } else if (validated.sortBy === "popular") {
      orderBy = { createdAt: "desc" }; // fallback to newest
    }

    // Get total count
    const total = await prisma.product.count({ where });

    // Get paginated products
    const products = await prisma.product.findMany({
      where,
      orderBy,
      take: validated.limit,
      skip: validated.offset,
      include: {
        category: true,
        reviews: { take: 1, select: { rating: true } },
      },
    });

    return {
      success: true,
      data: {
        products,
        total,
        limit: validated.limit,
        offset: validated.offset,
        hasMore: validated.offset + validated.limit < total,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
        code: "VALIDATION_ERROR",
      };
    }
    console.error("Search products error:", error);
    return {
      success: false,
      error: "Failed to search products",
      code: "SEARCH_ERROR",
    };
  }
}

/**
 * Get products by category with filters
 */
export async function getProductsByCategory(
  categoryId: string,
  filters?: Omit<SearchFilters, "categoryId">
): Promise<SearchServiceResult<SearchResult>> {
  try {
    const validated = searchFiltersSchema.parse({ categoryId, ...filters });

    const where: any = {
      active: true,
      categoryId,
    };

    if (validated.minPrice !== undefined) {
      where.basePrice = { gte: validated.minPrice };
    }
    if (validated.maxPrice !== undefined) {
      if (where.basePrice) {
        where.basePrice.lte = validated.maxPrice;
      } else {
        where.basePrice = { lte: validated.maxPrice };
      }
    }
    // if (validated.type) {
    //   where.productType = validated.type;
    // }

    let orderBy: any = { createdAt: "desc" };
    if (validated.sortBy === "price_asc") {
      orderBy = { basePrice: "asc" };
    } else if (validated.sortBy === "price_desc") {
      orderBy = { basePrice: "desc" };
    } else if (validated.sortBy === "popular") {
      orderBy = { createdAt: "desc" }; // fallback to newest
    }

    const total = await prisma.product.count({ where });

    const products = await prisma.product.findMany({
      where,
      orderBy,
      take: validated.limit,
      skip: validated.offset,
      include: {
        category: true,
        reviews: { take: 1, select: { rating: true } },
      },
    });

    return {
      success: true,
      data: {
        products,
        total,
        limit: validated.limit,
        offset: validated.offset,
        hasMore: validated.offset + validated.limit < total,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
        code: "VALIDATION_ERROR",
      };
    }
    console.error("Get products by category error:", error);
    return {
      success: false,
      error: "Failed to fetch products",
      code: "FETCH_ERROR",
    };
  }
}

/**
 * Get price range for filtering
 */
export async function getPriceRange(): Promise<
  SearchServiceResult<{ min: number; max: number }>
> {
  try {
    const cacheKey = "price_range";
    const cached = await redis.get(cacheKey);
    if (cached && typeof cached === "string") {
      return { success: true, data: JSON.parse(cached) };
    }

    const [minProduct, maxProduct] = await Promise.all([
      prisma.product.findFirst({
        // where: { availableQuantity: { gt: 0 } },
        orderBy: { basePrice: "asc" },
        select: { basePrice: true },
      }),
      prisma.product.findFirst({
        // where: { availableQuantity: { gt: 0 } },
        orderBy: { basePrice: "desc" },
        select: { basePrice: true },
      }),
    ]);

    const priceRange = {
      min: minProduct?.basePrice || 0,
      max: maxProduct?.basePrice || 999999,
    };

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(priceRange));

    return { success: true, data: priceRange };
  } catch (error) {
    console.error("Get price range error:", error);
    return {
      success: false,
      error: "Failed to fetch price range",
      code: "FETCH_ERROR",
    };
  }
}

/**
 * Get all categories for filtering
 */
export async function getFilterCategories(): Promise<
  SearchServiceResult<any[]>
> {
  try {
    const cacheKey = "filter_categories";
    const cached = await redis.get(cacheKey);
    if (cached && typeof cached === "string") {
      return { success: true, data: JSON.parse(cached) };
    }

    const categories = await prisma.category.findMany({
      where: { parentId: null }, // Only top-level categories
      include: {
        _count: { select: { products: true } },
      },
    });

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(categories));

    return { success: true, data: categories };
  } catch (error) {
    console.error("Get filter categories error:", error);
    return {
      success: false,
      error: "Failed to fetch categories",
      code: "FETCH_ERROR",
    };
  }
}
