import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { endpoints, queryKeys } from "@/lib/endpoints";

// Types

export type ProductType = "store" | "catalog";

export interface VariantAvailabilityStatus {
  region: string;
  status: "in_stock" | "out_of_stock" | "discontinued";
}

export interface ProductVariant {
  id: number;
  name: string;
  size: string;
  color: string;
  image: string;
  price: string;
  in_stock: boolean;
  material: string[];
  color_code: string;
  product_id: number;
  color_code2?: string | null;
  availability_status: VariantAvailabilityStatus[];
  availability_regions: Record<string, string>;
}

export interface Product {
  // IDs & Relations
  id: string;
  categoryId?: string | null;
  category?: any;

  // Basic Info
  name: string;
  slug: string;
  description?: string | null;
  brand?: string | null;

  // Pricing
  basePrice: number;
  baseCost?: number | null;

  // Printful Links
  printfulStoreProductId?: string | null;
  printfulCatalogId?: number | null;

  // Product Classification
  productType: ProductType;
  type?: string | null; // Printful type (only for catalog)

  // Visuals
  mainImage?: string | null;
  mockups?: any; // JSON
  gallery: string[];

  // Variants & Customization
  variants: ProductVariant[];
  printAreas?: any | null; // JSON
  allowCustomization: boolean;

  // Status
  active: boolean;
  syncedAt?: Date | null;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  avgRating: number;
  soldCount: number;
  _count?: {
    reviews: number;
  };
}



// Get all products
export function useProducts(filters?: {
  productType?: ProductType;
  categoryId?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: "newest" | "popular" | "price_asc" | "price_desc" | "rating";
}) {
  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: () => apiClient.get<Product[]>(endpoints.products.list.path, filters as any),
  });
}

// Get product by ID or slug
export function useProduct(identifier: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(identifier),
    queryFn: () => apiClient.get<Product>(endpoints.products.byId(identifier).path),
    enabled: !!identifier,
  });
}

// Create product
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Product>) =>
      apiClient.post<Product>(endpoints.products.create.path, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

// Update product
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      apiClient.patch<Product>(endpoints.products.update(id).path, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

// Delete product
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(endpoints.products.delete(id).path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}
