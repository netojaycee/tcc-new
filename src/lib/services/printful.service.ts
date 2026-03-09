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
  // Stock & availability (added for filtering)
  in_stock?: boolean;
  availability_regions?: Record<string, string>;
  availability_status?: Array<{ region: string; status: string }>;
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

export interface PrintfulAddress {
  address1: string;
  address2?: string;
  city: string;
  state_code?: string;
  state_name?: string;
  country_code: string;
  country_name?: string;
  zip: string;
}

export interface PrintfulShippingEstimate {
  id: string;
  name: string;
  rate: number;
  currency: string;
  transit_time: string;
  carrier: string;
}

export interface PrintfulCarrier {
  id: string;
  name: string;
  min_delivery_days: number;
  max_delivery_days: number;
}

export interface SizeTableMeasurement {
  type_label: string;
  values: Array<{
    size: string;
    value?: string;
    min_value?: string;
    max_value?: string;
  }>;
}

export interface SizeTable {
  type: "measure_yourself" | "product_measure" | "international";
  unit: "inches" | "cm" | "none";
  description?: string;
  image_url?: string;
  image_description?: string;
  measurements: SizeTableMeasurement[];
}

export interface SizeGuideData {
  product_id: number;
  available_sizes: string[];
  size_tables: SizeTable[];
}

export interface PrintfulOrderItem {
  variant_id: string | number;
  quantity: number;
  price?: number;
  files?: Array<{
    type?: string;
    url: string;
  }>;
}

export interface PrintfulOrderData {
  recipient: {
    name?: string;
    email?: string;
    address1: string;
    address2?: string;
    city: string;
    state_code?: string;
    state_name?: string;
    country_code: string;
    zip: string;
  };
  items: PrintfulOrderItem[];
  external_id?: string;
  shipping?: string;
}

export interface PrintfulOrderResponse {
  id: string;
  external_id?: string;
  status: string;
  created: number;
  updated: number;
  recipient: {
    name?: string;
    email?: string;
    address1: string;
    city: string;
    state_code: string;
    country_code: string;
    zip: string;
  };
  items: PrintfulOrderItem[];
  shipping: string;
  costs: {
    currency: string;
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  };
}

export interface PrintfulApiResponse<T> {
  code: number;
  result: T;
}

// Webhook types
export interface WebhookParams {
  stock_updated?: {
    product_ids: number[];
  };
}

export interface WebhookInfo {
  url: string;
  types: string[];
  params?: WebhookParams;
}

export interface PrintfulWebhookResponse {
  url: string;
  types: string[];
  params?: WebhookParams;
}

// Event payload types for documentation
export interface PackageShippedData {
  shipment: {
    id: number;
    address_to: PrintfulAddress;
    carrier: string;
    service: string;
    tracking_number: string;
    tracking_url: string;
    estimated_delivery_date: string;
    items: Array<{
      item_id: number;
      quantity: number;
    }>;
  };
  order: {
    id: number;
    external_id: string | null;
    status: string;
  };
}

export interface StockUpdatedData {
  product_id: number;
  variant_stock: {
    out: number[];
    discontinued: number[];
  };
}

export interface OrderEventData {
  order: {
    id: number;
    external_id: string | null;
    status: string;
    created: number;
    updated: number;
    recipient: PrintfulAddress;
    items: PrintfulOrderItem[];
    shipping: string;
    costs?: {
      currency: string;
      subtotal: number;
      shipping: number;
      tax: number;
      total: number;
    };
  };
  reason?: string;
}

class PrintfulService {
  private client: AxiosInstance;
  private baseURL: string;
  private apiKey: string;

  constructor() {
    const apiKey = process.env.PRINTFUL_API_KEY;
    const baseURL =
      process.env.PRINTFUL_API_BASE_URL || "https://api.printful.com";

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
   * Fetch size guide for a catalog product
   */
  async getSizeGuide(
    productId: string | number,
  ): Promise<SizeGuideData | null> {
    try {
      const { data } = await this.client.get<
        PrintfulApiResponse<SizeGuideData>
      >(`/products/${productId}/sizes`);
      return data.result;
    } catch (error) {
      // Size guide not found is not a critical error, just warn
      console.warn(
        `[Printful] Size guide not found for product ${productId}`,
        error instanceof Error ? error.message : "Unknown error",
      );
      return null;
    }
  }

  /**
   * Get current webhook configuration
   */
  async getWebhook(): Promise<PrintfulWebhookResponse | null> {
    try {
      const { data } =
        await this.client.get<PrintfulApiResponse<PrintfulWebhookResponse>>(
          "/webhooks",
        );
      return data.result;
    } catch (error) {
      // No webhook configured yet is not an error
      const err = error as any;
      if (err.response?.status === 404) {
        return null;
      }
      throw this.handleError(
        error,
        "Failed to fetch webhook configuration from Printful",
      );
    }
  }

  /**
   * Create or update webhook configuration
   * Note: Only 1 webhook per store - new POST replaces the old one
   */
  async createWebhook(
    url: string,
    types: string[],
    params?: WebhookParams,
  ): Promise<PrintfulWebhookResponse> {
    try {
      const payload: WebhookInfo = {
        url,
        types,
        params,
      };

      const { data } = await this.client.post<
        PrintfulApiResponse<PrintfulWebhookResponse>
      >("/webhooks", payload);

      console.log("[Printful] Webhook created:", data.result.url);
      return data.result;
    } catch (error) {
      throw this.handleError(
        error,
        "Failed to create/update webhook in Printful",
      );
    }
  }

  /**
   * Delete webhook configuration
   */
  async deleteWebhook(): Promise<void> {
    try {
      await this.client.delete("/webhooks");
      console.log("[Printful] Webhook deleted");
    } catch (error) {
      throw this.handleError(error, "Failed to delete webhook from Printful");
    }
  }

  /**
   * Get all products to monitor for stock updates
   * This returns product IDs that should be sent in the stock_updated webhook params
   */
  async getProductIdsForStockMonitoring(): Promise<number[]> {
    try {
      // Get all store products (these are user's synced products)
      const storeProducts = await this.getAllStoreProducts();
      return storeProducts.map((p) => p.id);
    } catch (error) {
      throw this.handleError(
        error,
        "Failed to get product IDs for stock monitoring",
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
      throw this.handleError(error, "Failed to fetch categories from Printful");
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
   * Get available carriers for shipping
   */
  async getCarriers(): Promise<PrintfulCarrier[]> {
    try {
      const { data } =
        await this.client.get<PrintfulApiResponse<PrintfulCarrier[]>>(
          "/shipping/carriers",
        );
      return data.result;
    } catch (error) {
      throw this.handleError(error, "Failed to fetch carriers from Printful");
    }
  }

  /**
   * Get shipping estimates for an order
   * This is typically called after creating a draft order
   */
  async getShippingEstimates(
    orderId: string | number,
  ): Promise<PrintfulShippingEstimate[]> {
    try {
      const { data } = await this.client.get<
        PrintfulApiResponse<PrintfulShippingEstimate[]>
      >(`/orders/${orderId}/shipping-estimates`);
      return data.result;
    } catch (error) {
      throw this.handleError(
        error,
        `Failed to get shipping estimates for order ${orderId}`,
      );
    }
  }

  /**
   * Create a new order in Printful (after payment confirmed)
   * Can create as draft first if external_id is provided
   */
  async createOrder(
    orderData: PrintfulOrderData,
  ): Promise<PrintfulOrderResponse> {
    try {
      const { data } = await this.client.post<
        PrintfulApiResponse<PrintfulOrderResponse>
      >("/orders", orderData);
      return data.result;
    } catch (error) {
      throw this.handleError(error, "Failed to create order in Printful");
    }
  }

  /**
   * Get order details from Printful
   */
  async getOrder(orderId: string | number): Promise<PrintfulOrderResponse> {
    try {
      const { data } = await this.client.get<
        PrintfulApiResponse<PrintfulOrderResponse>
      >(`/orders/${orderId}`);
      return data.result;
    } catch (error) {
      throw this.handleError(
        error,
        `Failed to fetch order ${orderId} from Printful`,
      );
    }
  }

  /**
   * Get order cost estimate before creating the order
   * This calculates shipping and tax for the given items and address
   */
  async estimateOrderCosts(
    items: Array<{ variant_id: string | number; quantity: number }>,
    recipient: PrintfulAddress,
  ): Promise<{
    shipping: number;
    tax: number;
    subtotal?: number;
    total?: number;
    discount?: number;
    shipping_time?: string;
  }> {
    try {
      const payload = {
        items,
        recipient,
      };

      const { data } = await this.client.post<PrintfulApiResponse<any>>(
        "/orders/estimate-costs",
        payload,
      );

      const result = data.result;
      const costs = result.costs || {};

      console.log("[Printful] Order cost estimate:", costs);

      console.log(
        "[Printful] Full estimate response:",
        JSON.stringify(result, null, 2),
      );

      // Try to get shipping time from result (if available in the response)
      const shippingTime =
        result.estimated_delivery?.days ||
        result.shipping_time ||
        `${result.min_delivery_days || 5}-${result.max_delivery_days || 10} business days`;
      console.log("[Printful] Estimated shipping time:", shippingTime);
      return {
        shipping: costs.shipping || 0,
        tax: costs.tax || 0,
        subtotal: costs.subtotal || 0,
        discount: costs.discount || 0,
        total: costs.total || 0,
        shipping_time: shippingTime,
      };
    } catch (error) {
      throw this.handleError(
        error,
        "Failed to estimate order costs from Printful",
      );
    }
  }

  /**
   * Handle and standardize errors
   */
  private handleError(error: unknown, defaultMessage: string): never {
    if (axios.isAxiosError(error)) {
      // Get detailed error info from Printful API response
      const responseData = error.response?.data;
      let message =
        error.response?.data?.message || error.message || defaultMessage;

      // Include full error details if available
      if (responseData?.errors) {
        message += ` | Details: ${JSON.stringify(responseData.errors)}`;
      }

      const status = error.response?.status || 500;

      // Log full response for debugging
      if (status === 400) {
        console.error(
          "Printful 400 Response:",
          JSON.stringify(responseData, null, 2),
        );
      }

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
