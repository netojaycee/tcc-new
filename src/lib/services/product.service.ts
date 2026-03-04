import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { z } from "zod";
import { printfulService } from "@/lib/services/printful.service";
import { generateSlug } from "../utils";

const CACHE_TTL = 3600; // 1 hour

// Types
export type ProductResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

// Validation Schemas (categoryId and old type removed)
export const createProductSchema = z.object({
  name: z.string().min(1, "Product name required"),
  description: z.string().min(1, "Description required"),
  price: z.number().positive("Price must be positive"),
  availableQuantity: z.number().int().nonnegative(),
  images: z.array(z.string().url()).min(1, "At least one image required"),
  type: z.enum(["store", "catalog"]).default("store"),
  discountPercentage: z.number().nonnegative().optional(),
  discountExpiry: z.date().optional(),
  tags: z.array(z.string()).default([]),
  whatIncluded: z.array(z.string()).optional(),
  perfectFor: z.array(z.string()).optional(),
  whyChoose: z.array(z.string()).optional(),
  deliveryInfo: z
    .object({
      title: z.string().min(1, "Delivery title required"),
      details: z.array(z.string()).min(1, "At least one detail required"),
    })
    .optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// Helper: Invalidate product cache
async function invalidateProductCache(productId?: string) {
  try {
    if (productId) {
      await redis.del(`product:${productId}`);
    }
    // Invalidate all product list caches
    const keys = await redis.keys("products:*");
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error("Redis cache invalidation error:", error);
  }
}

export const productService = {
  // ============ READ OPERATIONS ============

  /**
   * Get all products with optional filters
   */
  async getProducts(filters?: {
    type?: "store" | "catalog";
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: "newest" | "popular" | "price_asc" | "price_desc" | "rating";
    minPrice?: number;
    maxPrice?: number;
    sizes?: string[];
    fits?: string[];
    materials?: string[];
    minRating?: number;
  }): Promise<{ products: any[]; total: number }> {
    const {
      type,
      search,
      limit = 12,
      offset = 0,
      sortBy = "newest",
      category,
      minPrice,
      maxPrice,
      sizes,
      fits,
      materials,
      minRating,
    } = filters || {};

    // Generate cache key based on filters (excluding ui-only filters like sizes, fits, materials for now)
    const cacheKey = `products:list:${JSON.stringify({ type, category, search, limit, offset, sortBy, minPrice, maxPrice, minRating })}`;
    const countCacheKey = `products:count:${JSON.stringify({ type, category, search, minPrice, maxPrice, minRating })}`;

    // Check cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const cachedCount = await redis.get(countCacheKey);
        const count = typeof cachedCount === 'string' ? parseInt(cachedCount, 10) : cachedCount || 0;
        return { products: cached as any[], total: Number(count) };
      }
    } catch (error) {
      console.error("Redis get error:", error);
    }

    // Build where clause for database filters
    const where: any = {};
    if (type) where.productType = type;

    // Price range filtering
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) where.basePrice.gte = minPrice;
      if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
    }

    // Rating filtering
    if (minRating !== undefined) {
      where.avgRating = { gte: minRating };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // If category slug is provided, find category and filter by categoryId
    if (category) {
      const foundCategory = await prisma.category.findFirst({
        where: { slug: category },
      });
      if (foundCategory) {
        where.categoryId = foundCategory.id;
      } else {
        // If category not found, return empty array
        return { products: [], total: 0 };
      }
    }

    // Build orderBy
    const orderByMap: Record<string, any> = {
      newest: { createdAt: "desc" },
      popular: { soldCount: "desc" },
      price_asc: { basePrice: "asc" },
      price_desc: { basePrice: "desc" },
      rating: { avgRating: "desc" },
    };

    // Fetch products with database filters applied
    const [allProducts, dbTotal] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { _count: { select: { reviews: true } } },
        orderBy: orderByMap[sortBy],
        // Don't limit/skip yet - we need to filter by variants first
      }),
      prisma.product.count({ where }),
    ]);

    // Apply variant-based filters (sizes, fits, materials) in-memory
    // These require checking the JSON variants array
    let filteredProducts = allProducts;

    if (
      (sizes && sizes.length > 0) ||
      (fits && fits.length > 0) ||
      (materials && materials.length > 0)
    ) {
      filteredProducts = allProducts.filter((product) => {
        const variants = (product.variants as any[]) || [];

        // Check size filter
        if (sizes && sizes.length > 0) {
          const hasSize = variants.some(
            (v) =>
              v.size &&
              sizes.some((s) => v.size.toLowerCase() === s.toLowerCase()),
          );
          if (!hasSize) return false;
        }

        // Check fit filter
        if (fits && fits.length > 0) {
          const hasFit = variants.some(
            (v) =>
              v.fit &&
              fits.some((f) => v.fit.toLowerCase() === f.toLowerCase()),
          );
          if (!hasFit) return false;
        }

        // Check material filter
        if (materials && materials.length > 0) {
          const hasMaterial = variants.some(
            (v) =>
              v.material &&
              materials.some(
                (m) => v.material.toLowerCase() === m.toLowerCase(),
              ),
          );
          if (!hasMaterial) return false;
        }

        return true;
      });
    }

    // Now apply pagination to the filtered results
    const total = filteredProducts.length;
    const products = filteredProducts.slice(offset, offset + limit);

    // Cache
    try {
      await redis.set(cacheKey, products, { ex: CACHE_TTL });
      await redis.set(countCacheKey, total, { ex: CACHE_TTL });
    } catch (error) {
      console.error("Redis set error:", error);
    }

    return { products, total };
  },

  async getRelatedProducts(filters?: {
    categoryId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ products: any[]; total: number }> {
    const { categoryId, limit = 4, offset = 0 } = filters || {};
    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (!categoryId) where.productType = "store";

    // Fetch products with database filters applied
    const [allProducts, dbTotal] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { _count: { select: { reviews: true } } },
        take: limit, // Limit to specified number of related products
        skip: offset, // Apply offset for pagination
      }),
      prisma.product.count({ where }),
    ]);

    return { products: allProducts, total: dbTotal };
  },

  /**
   * Get single product by ID or slug
   */
  async getProductByIdentifier(identifier: string): Promise<any | null> {
    const cacheKey = `product:${identifier}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return cached;
    } catch (error) {
      console.error("Redis get error:", error);
    }

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
      include: {
        category: true,
        reviews: {
          select: {
            id: true,
            rating: true,
            message: true,
            user: { select: { firstName: true, image: true } },
          },
        },
        _count: { select: { reviews: true } },
      },
    });

    if (product) {
      try {
        await redis.set(cacheKey, product, { ex: CACHE_TTL });
      } catch (error) {
        console.error("Redis set error:", error);
      }
    }

    return product;
  },

  // Removed getProductsByCategory and getRelatedProducts (category logic)

  /**
   * Search products
   */
  async searchProducts(query: string, limit = 20): Promise<any[]> {
    const result = await this.getProducts({ search: query, limit });
    return result.products;
  },

  // ============ ADMIN WRITE OPERATIONS ============

  /**
   * Create a new product
   */
  // async createProduct(data: CreateProductInput): Promise<ProductResult<any>> {
  //   try {
  //     // Validate input
  //     const validated = createProductSchema.parse(data);

  //     // Check if slug exists (auto-generated from name)
  //     const slug = validated.name.toLowerCase().replace(/\s+/g, "-");
  //     const existing = await prisma.product.findUnique({ where: { slug } });
  //     if (existing) {
  //       return {
  //         success: false,
  //         error: "Product with this name already exists",
  //         code: "PRODUCT_EXISTS",
  //       };
  //     }

  //     const product = await prisma.product.create({
  //       data: {
  //         ...validated,
  //         slug,
  //       },
  //     });

  //     // Invalidate caches
  //     await invalidateProductCache();

  //     return { success: true, data: product };
  //   } catch (error) {
  //     if (error instanceof z.ZodError) {
  //       return {
  //         success: false,
  //         error: error.issues[0].message,
  //         code: "VALIDATION_ERROR",
  //       };
  //     }
  //     console.error("Create product error:", error);
  //     return {
  //       success: false,
  //       error: "Failed to create product",
  //       code: "CREATE_ERROR",
  //     };
  //   }
  // },

  /**
   * Update an existing product
   */
  // async updateProduct(
  //   id: string,
  //   data: UpdateProductInput,
  // ): Promise<ProductResult<any>> {
  //   try {
  //     const validated = updateProductSchema.parse(data);

  //     const product = await prisma.product.update({
  //       where: { id },
  //       data: validated,
  //     });

  //     // Invalidate caches
  //     await invalidateProductCache(id);

  //     return { success: true, data: product };
  //   } catch (error) {
  //     if (error instanceof z.ZodError) {
  //       return {
  //         success: false,
  //         error: error.issues[0].message,
  //         code: "VALIDATION_ERROR",
  //       };
  //     }
  //     console.error("Update product error:", error);
  //     return {
  //       success: false,
  //       error: "Failed to update product",
  //       code: "UPDATE_ERROR",
  //     };
  //   }
  // },

  /**
   * Sync all Printful store products (no categories)
   * - Upsert product with mapped fields and type 'store'
   */
  async syncPrintfulStoreProducts() {
    try {
      // Fetch all Printful store products (summaries)
      const printfulProducts = await printfulService.getAllStoreProducts();
      if (!Array.isArray(printfulProducts)) {
        throw new Error("Printful products response is not an array");
      }

      const results = [];

      for (const pfProduct of printfulProducts) {
        // Fetch full product details by ID
        let detail;
        try {
          detail = await printfulService.getStoreProductById(pfProduct.id);
        } catch (err) {
          console.error(
            `Failed to fetch details for Printful product ${pfProduct.id}:`,
            err,
          );
          continue;
        }
        const d = detail;
        const productData = d.sync_product || d;
        const variants = d.sync_variants || [];
        // Use first variant's price as basePrice if available
        let basePrice = 0;
        if (variants.length > 0 && variants[0].retail_price) {
          basePrice = Number(variants[0].retail_price);
        }

        // Upsert product by printfulStoreProductId
        const upsertedProduct = await prisma.product.upsert({
          where: { printfulStoreProductId: String(pfProduct.id) },
          update: {
            printfulStoreProductId: String(pfProduct.id),
            name: productData.name ?? String(pfProduct.id),
            description: productData.description ?? null,
            slug: generateSlug(productData.name ?? String(pfProduct.id)),
            productType: "store",
            brand: productData.brand ?? null,
            mainImage: productData.thumbnail_url ?? null,
            gallery: productData.thumbnail_url
              ? [productData.thumbnail_url]
              : [],
            variants: variants as any,
            syncedAt: new Date(),
            active: !productData.is_ignored,
            basePrice,
          },
          create: {
            printfulStoreProductId: String(pfProduct.id),
            name: productData.name ?? String(pfProduct.id),
            description: productData.description ?? null,
            slug: generateSlug(productData.name ?? String(pfProduct.id)),
            productType: "store",
            brand: productData.brand ?? null,
            mainImage: productData.thumbnail_url ?? null,
            gallery: productData.thumbnail_url
              ? [productData.thumbnail_url]
              : [],
            variants: variants as any,
            syncedAt: new Date(),
            active: !productData.is_ignored,
            basePrice,
          },
        });
        results.push({ product: upsertedProduct });
      }

      return {
        success: true,
        data: {
          message: `Synced ${results.length} Printful store products (with details)`,
          results,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Sync Printful store products error:", errorMessage);
      return {
        success: false,
        error: errorMessage,
        code: "SYNC_PRINTFUL_STORE_PRODUCTS_ERROR",
      };
    }
  },

  /**
   * Sync all Printful categories
   */
  async syncPrintfulCategories() {
    try {
      const data = await printfulService.getAllCategories();
      const printfulCategories = (data as any).categories || [];

      if (!Array.isArray(printfulCategories)) {
        throw new Error("Printful categories response is not an array");
      }

      const results = [];

      for (const pfCategory of printfulCategories) {
        const slug = generateSlug(pfCategory.title);
        const upsertedCategory = await prisma.category.upsert({
          where: { printfulId: pfCategory.id },
          update: {
            title: pfCategory.title,
            parentId: pfCategory.parent_id,
            imageUrl: pfCategory.image_url,
            size: pfCategory.size,
            slug,
          },
          create: {
            printfulId: pfCategory.id,
            title: pfCategory.title,
            parentId: pfCategory.parent_id,
            imageUrl: pfCategory.image_url,
            size: pfCategory.size,
            slug,
          },
        });
        results.push({ category: upsertedCategory });
      }

      return {
        success: true,
        data: {
          message: `Synced ${results.length} Printful categories`,
          results,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Sync Printful categories error:", errorMessage);
      return {
        success: false,
        error: errorMessage,
        code: "SYNC_PRINTFUL_CATEGORIES_ERROR",
      };
    }
  },

  /**
   * Sync all Printful catalog products and link to categories
   */
  async syncPrintfulCatalogProducts() {
    try {
      // Fetch all Printful catalog products (summaries)
      const printfulProducts = await printfulService.getAllCatalogProducts();
      if (!Array.isArray(printfulProducts)) {
        throw new Error("Printful catalog products response is not an array");
      }

      const results = [];

      for (const pfProduct of printfulProducts) {
        // Fetch full product details by ID
        let detail;
        try {
          detail = await printfulService.getCatalogProductById(pfProduct.id);
        } catch (err) {
          console.error(
            `Failed to fetch details for Printful catalog product ${pfProduct.id}:`,
            err,
          );
          continue;
        }

        const productData = detail.product;
        const variants = detail.variants || [];

        // Use first variant's price as basePrice if available
        let basePrice = 0;
        if (variants.length > 0 && variants[0].price) {
          basePrice = Number(variants[0].price);
        }

        // Find or create category by Printful category ID
        let category = await prisma.category.findUnique({
          where: { printfulId: productData.main_category_id },
        });

        if (!category) {
          // Try to fetch category from Printful and create it
          try {
            const pfCategory = await printfulService.getCategoryById(
              productData.main_category_id,
            );
            category = await prisma.category.create({
              data: {
                printfulId: pfCategory.id,
                title: pfCategory.title,
                parentId: pfCategory.parent_id,
                imageUrl: pfCategory.image_url,
                size: pfCategory.size,
                slug: generateSlug(pfCategory.title),
              },
            });
          } catch (err) {
            console.warn(
              `Could not create category for product ${productData.id}:`,
              err,
            );
          }
        }

        // Upsert product by printfulCatalogId
        const upsertedProduct = await prisma.product.upsert({
          where: { printfulCatalogId: pfProduct.id },
          update: {
            printfulCatalogId: productData.id,
            name: productData.title,
            description: productData.description,
            slug: generateSlug(productData.title),
            productType: "catalog",
            type: productData.type,
            brand: productData.brand,
            mainImage: productData.image,
            gallery: productData.image ? [productData.image] : [],
            variants: variants as any,
            syncedAt: new Date(),
            active: !productData.is_discontinued,
            basePrice,
            categoryId: category?.id,
          },
          create: {
            printfulCatalogId: productData.id,
            name: productData.title,
            description: productData.description,
            slug: generateSlug(productData.title),
            productType: "catalog",
            type: productData.type,
            brand: productData.brand,
            mainImage: productData.image,
            gallery: productData.image ? [productData.image] : [],
            variants: variants as any,
            syncedAt: new Date(),
            active: !productData.is_discontinued,
            basePrice,
            categoryId: category?.id,
          },
        });
        results.push({ product: upsertedProduct, category });
      }

      return {
        success: true,
        data: {
          message: `Synced ${results.length} Printful catalog products (with categories)`,
          results,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Sync Printful catalog products error:", errorMessage);
      return {
        success: false,
        error: errorMessage,
        code: "SYNC_PRINTFUL_CATALOG_PRODUCTS_ERROR",
      };
    }
  },
};
