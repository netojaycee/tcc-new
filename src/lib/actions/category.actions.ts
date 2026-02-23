"use server";

import {
  categoryService,
} from "@/lib/services/category.service";

// ============ PUBLIC READ ACTIONS ============

/**
 * Get all categories
 */
export async function getCategoriesAction(filters?: {
  limit?: number;
  offset?: number;
}) {
  try {
    const categories = await categoryService.getAllCategories(filters);
    return { success: true, data: categories };
  } catch (error) {
    console.error("Get categories error:", error);
    return { success: false, error: "Failed to fetch categories" };
  }
}

/**
 * Get single category
 */
export async function getCategoryAction(identifier: string) {
  try {
    if (!identifier || identifier.trim() === "") {
      return { success: false, error: "Category identifier required" };
    }

    const category = await categoryService.getCategoryByIdentifier(identifier);
    if (!category) {
      return { success: false, error: "Category not found" };
    }

    return { success: true, data: category };
  } catch (error) {
    console.error("Get category error:", error);
    return { success: false, error: "Failed to fetch category" };
  }
}

