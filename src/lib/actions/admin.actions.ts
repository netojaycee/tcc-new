"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// ============ ADMIN CHECKS ============

async function isAdmin() {
  const session = await getSession();
  if (!session || !("userId" in session)) {
    throw new Error("Unauthorized");
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  
  if (user?.role !== "admin") {
    throw new Error("Forbidden - Admin access required");
  }
  
  return true;
}

// ============ ORDERS ADMIN ACTIONS ============

export async function getAdminOrdersAction(
  page: number = 1,
  limit: number = 10,
  search?: string,
  status?: string
) {
  try {
    await isAdmin();

    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }
    
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          total: true,
          createdAt: true,
          user: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      success: true,
      data: orders,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Get admin orders error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch orders",
      code: "ADMIN_ORDERS_ERROR",
    };
  }
}

// ============ PRODUCTS ADMIN ACTIONS ============

export async function getAdminProductsAction(
  page: number = 1,
  limit: number = 10,
  search?: string,
  type?: "store" | "catalog"
) {
  try {
    await isAdmin();

    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }
    
    if (type) {
      where.productType = type;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          baseCost: true,
          productType: true,
          mainImage: true,
          active: true,
          soldCount: true,
          reviewCount: true,
          avgRating: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      success: true,
      data: products,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Get admin products error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch products",
      code: "ADMIN_PRODUCTS_ERROR",
    };
  }
}

// ============ CUSTOMERS ADMIN ACTIONS ============

export async function getAdminCustomersAction(
  page: number = 1,
  limit: number = 10,
  search?: string
) {
  try {
    await isAdmin();

    const skip = (page - 1) * limit;
    
    const where: any = {
      role: "user",
    };
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          verified: true,
          image: true,
          createdAt: true,
          _count: {
            select: { orders: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Calculate spending for each customer
    const customersWithSpending = await Promise.all(
      customers.map(async (customer) => {
        const totalSpent = await prisma.order.aggregate({
          where: { userId: customer.id },
          _sum: { total: true },
        });

        return {
          ...customer,
          totalSpent: totalSpent._sum.total || 0,
        };
      })
    );

    return {
      success: true,
      data: customersWithSpending,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Get admin customers error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch customers",
      code: "ADMIN_CUSTOMERS_ERROR",
    };
  }
}

// ============ PROMO CODES ADMIN ACTIONS ============

export async function getAdminPromoCodesAction(
  page: number = 1,
  limit: number = 10
) {
  try {
    await isAdmin();

    const skip = (page - 1) * limit;

    const [promoCodes, total] = await Promise.all([
      prisma.promoCode.findMany({
        select: {
          id: true,
          code: true,
          type: true,
          value: true,
          minOrder: true,
          maxUses: true,
          usedCount: true,
          active: true,
          expiry: true,
          createdAt: true,
          _count: {
            select: { orders: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.promoCode.count(),
    ]);

    return {
      success: true,
      data: promoCodes,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Get admin promo codes error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch promo codes",
      code: "ADMIN_PROMO_ERROR",
    };
  }
}

// ============ RETURNS ADMIN ACTIONS ============

export async function getAdminReturnsAction(
  page: number = 1,
  limit: number = 10,
  status?: string
) {
  try {
    await isAdmin();

    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [returns, total] = await Promise.all([
      prisma.return.findMany({
        where,
        select: {
          id: true,
        //   returnNumber: true,
          order: {
            select: {
              orderNumber: true,
              email: true,
            },
          },
          status: true,
          reason: true,
          refundAmount: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.return.count({ where }),
    ]);

    return {
      success: true,
      data: returns,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Get admin returns error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch returns",
      code: "ADMIN_RETURNS_ERROR",
    };
  }
}

// ============ CATEGORIES ADMIN ACTIONS ============

export async function getAdminCategoriesAction(
  page: number = 1,
  limit: number = 10
) {
  try {
    await isAdmin();

    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          imageUrl: true,
          createdAt: true,
          _count: {
            select: { products: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.category.count(),
    ]);

    return {
      success: true,
      data: categories,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Get admin categories error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch categories",
      code: "ADMIN_CATEGORIES_ERROR",
    };
  }
}
