import axios, { AxiosInstance } from "axios";

// Types for Printful API responses
export interface PrintfulProduct {
  id: number;
  external_id: string | null;
  name: string;
  description: string | null;
  type: string | null;
  brand: string | null;
  thumbnail_url: string | null;
  is_ignored: boolean;
  synced: number;
  variants: number;
}

export interface PrintfulVariant {
  id: number;
  product_id: number;
  external_id: string | null;
  name: string;
  sku: string | null;
  retail_price: string | number;
  cost: string | number;
}

export interface PrintfulProductDetail {
  sync_product: PrintfulProduct;
  sync_variants: PrintfulVariant[];
}

export interface PrintfulCatalogProduct {
  id: number;
  main_category_id: number;
  type: string;
  type_name: string;
  title: string;
  brand: string;
  model: string;
  image: string;
  variant_count: number;
  currency: string;
  is_discontinued: boolean;
  avg_fulfillment_time: number;
  description: string;
  origin_country: string;
}

export interface PrintfulCatalogVariant {
  id: number;
  product_id: number;
  name: string;
  size: string;
  color: string;
  color_code: string;
  image: string;
  price: string;
  in_stock: boolean;
}

export interface PrintfulCatalogProductDetail {
  product: PrintfulCatalogProduct;
  variants: PrintfulCatalogVariant[];
}

export interface PrintfulCategory {
  id: number;
  parent_id: number | null;
  image_url: string;
  size: string;
  title: string;
}

export interface PrintfulApiResponse<T> {
  code: number;
  result: T;
}

class PrintfulService {
  private client: AxiosInstance;
  private baseURL: string;
  private apiKey: string;

  constructor() {
    const apiKey = process.env.PRINTFUL_API_KEY;
    const baseURL = process.env.PRINTFUL_API_BASE_URL || "https://api.printful.com";

    if (!apiKey) {
      throw new Error("Missing PRINTFUL_API_KEY environment variable");
    }

    if (!baseURL) {
      throw new Error("Missing PRINTFUL_API_BASE_URL environment variable");
    }

    this.apiKey = apiKey;
    this.baseURL = baseURL;

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });
  }

  /**
   * Fetch all store products from Printful
   */
  async getAllStoreProducts(): Promise<PrintfulProduct[]> {
    try {
      const { data } =
        await this.client.get<PrintfulApiResponse<PrintfulProduct[]>>(
          "/store/products",
        );
        // console.log("Printful API - getAllStoreProducts response:", data);
      return data.result;
    } catch (error) {
      throw this.handleError(
        error,
        "Failed to fetch store products from Printful",
      );
    }
  }

  /**
   * Fetch a single store product by ID from Printful
   */
  async getStoreProductById(
    productId: string | number,
  ): Promise<PrintfulProductDetail> {
    try {
      const { data } = await this.client.get<
        PrintfulApiResponse<PrintfulProductDetail>
      >(`/store/products/${productId}`);
      return data.result;
    } catch (error) {
      throw this.handleError(
        error,
        `Failed to fetch store product ${productId} from Printful`,
      );
    }
  }

  /**
   * Fetch all catalog products from Printful
   */
  async getAllCatalogProducts(): Promise<PrintfulCatalogProduct[]> {
    try {
      const { data } =
        await this.client.get<PrintfulApiResponse<PrintfulCatalogProduct[]>>(
          "/products",
        );
      return data.result;
    } catch (error) {
      throw this.handleError(
        error,
        "Failed to fetch catalog products from Printful",
      );
    }
  }

  /**
   * Fetch a single catalog product by ID from Printful
   */
  async getCatalogProductById(
    productId: string | number,
  ): Promise<PrintfulCatalogProductDetail> {
    try {
      const { data } = await this.client.get<
        PrintfulApiResponse<PrintfulCatalogProductDetail>
      >(`/products/${productId}`);
      return data.result;
    } catch (error) {
      throw this.handleError(
        error,
        `Failed to fetch catalog product ${productId} from Printful`,
      );
    }
  }

  /**
   * Fetch all categories from Printful
   */
  async getAllCategories(): Promise<PrintfulCategory[]> {
    try {
      const { data } =
        await this.client.get<PrintfulApiResponse<PrintfulCategory[]>>(
          "/categories",
        );
      return data.result;
    } catch (error) {
      throw this.handleError(
        error,
        "Failed to fetch categories from Printful",
      );
    }
  }

  /**
   * Fetch a single category by ID from Printful
   */
  async getCategoryById(
    categoryId: string | number,
  ): Promise<PrintfulCategory> {
    try {
      const { data } = await this.client.get<
        PrintfulApiResponse<PrintfulCategory>
      >(`/categories/${categoryId}`);
      return data.result;
    } catch (error) {
      throw this.handleError(
        error,
        `Failed to fetch category ${categoryId} from Printful`,
      );
    }
  }

  /**
   * Handle and standardize errors
   */
  private handleError(error: unknown, defaultMessage: string): never {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message || error.message || defaultMessage;
      const status = error.response?.status || 500;
      throw new Error(`[Printful API Error - ${status}] ${message}`);
    }

    if (error instanceof Error) {
      throw new Error(`${defaultMessage}: ${error.message}`);
    }

    throw new Error(defaultMessage);
  }
}

// Export singleton instance
export const printfulService = new PrintfulService();
