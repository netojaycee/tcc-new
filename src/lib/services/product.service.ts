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
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: "newest" | "popular" | "price_asc" | "price_desc" | "rating";
  }): Promise<any[]> {
    const {
      type,
      search,
      limit = 20,
      offset = 0,
      sortBy = "newest",
    } = filters || {};

    // Generate cache key based on filters
    const cacheKey = `products:list:${JSON.stringify({ type, search, limit, offset, sortBy })}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return cached as any[];
    } catch (error) {
      console.error("Redis get error:", error);
    }

    // Build where clause
    const where: any = {};
    if (type) where.productType = type;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search] } },
      ];
    }

    // Build orderBy
    const orderByMap: Record<string, any> = {
      newest: { createdAt: "desc" },
      popular: { soldCount: "desc" },
      price_asc: { basePrice: "asc" },
      price_desc: { basePrice: "desc" },
      rating: { avgRating: "desc" },
    };

    const products = await prisma.product.findMany({
      where,
      include: { _count: { select: { reviews: true } } },
      orderBy: orderByMap[sortBy],
      take: limit,
      skip: offset,
    });

    // Cache
    try {
      await redis.set(cacheKey, products, { ex: CACHE_TTL });
    } catch (error) {
      console.error("Redis set error:", error);
    }

    return products;
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
    return this.getProducts({ search: query, limit });
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
        const upsertedCategory = await prisma.category.upsert({
          where: { printfulId: pfCategory.id },
          update: {
            title: pfCategory.title,
            parentId: pfCategory.parent_id,
            imageUrl: pfCategory.image_url,
            size: pfCategory.size,
          },
          create: {
            printfulId: pfCategory.id,
            title: pfCategory.title,
            parentId: pfCategory.parent_id,
            imageUrl: pfCategory.image_url,
            size: pfCategory.size,
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
