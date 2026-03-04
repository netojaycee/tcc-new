import axios, { AxiosInstance } from "axios";
import { redis } from "../redis";

// Interfaces
export interface PrintfulState {
  code: string;
  name: string;
}

export interface PrintfulCountry {
  code: string;
  name: string;
  states: PrintfulState[] | null;
  region?: string;
}

export interface PrintfulCountriesResponse {
  code: number;
  result: PrintfulCountry[];
}

export interface ShippingRateItem {
  variant_id: string | number;
  quantity: number;
}

export interface ShippingRateAddress {
  country_code: string;
  state_code?: string;
  city?: string;
  zip?: string;
  address1?: string;
  address2?: string;
  phone?: string;
}

export interface PrintfulShippingRate {
  id: string;
  name: string;
  rate: string | number;
  currency: string;
  minDeliveryDays?: number;
  maxDeliveryDays?: number;
}

class PrintfulLocationService {
  private client: AxiosInstance;
  private cacheKey = "printful_countries_cache";
  private cacheDurationMs = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor() {
    const apiKey = process.env.PRINTFUL_API_KEY;
    const baseURL =
      process.env.PRINTFUL_API_BASE_URL || "https://api.printful.com";

    if (!apiKey) {
      throw new Error("Missing PRINTFUL_API_KEY environment variable");
    }

    this.client = axios.create({
      baseURL: baseURL,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }

  /**
   * Get all countries and their states
   * Uses in-memory cache to avoid repeated API calls
   */
  async getCountries(): Promise<PrintfulCountry[]> {
    // Try to get from cache first
    const cached = await this.getFromCache(this.cacheKey);
    if (cached) {
      console.log("[Printful Location] Using cached countries");
      return cached;
    }

    try {
      const { data } =
        await this.client.get<PrintfulCountriesResponse>("/countries");
      const countries = data.result;

      // Cache the result
      await this.saveToCache(this.cacheKey, countries);

      console.log(
        `[Printful Location] Fetched ${countries.length} countries from API`,
      );
      return countries;
    } catch (error) {
      console.error("[Printful Location] Error fetching countries:", error);
      throw error;
    }
  }

  /**
   * Get states for a specific country
   */
  async getStatesByCountry(countryCode: string): Promise<PrintfulState[]> {
    const countries = await this.getCountries();
    const country = countries.find(
      (c) => c.code.toUpperCase() === countryCode.toUpperCase(),
    );

    if (!country) {
      console.warn(`[Printful Location] Country not found: ${countryCode}`);
      return [];
    }

    return country.states || [];
  }

  /**
   * Get a specific country by code
   */
  async getCountryByCode(countryCode: string): Promise<PrintfulCountry | null> {
    const countries = await this.getCountries();
    return (
      countries.find(
        (c) => c.code.toUpperCase() === countryCode.toUpperCase(),
      ) || null
    );
  }

  /**
   * Calculate shipping rates for an order
   */
  async getShippingRates(
    items: ShippingRateItem[],
    recipient: ShippingRateAddress,
  ): Promise<PrintfulShippingRate[]> {
    try {
      const payload = {
        items,
        recipient: {
          country_code: recipient.country_code,
          state_code: recipient.state_code || null,
          city: recipient.city || null,
          zip: recipient.zip || null,
          address1: recipient.address1 || null,
          address2: recipient.address2 || null,
        },
      };

      const { data } = await this.client.post<{
        code: number;
        result: PrintfulShippingRate[];
      }>("/shipping/rates", payload);

      console.log(
        "[Printful Location] Shipping rates fetched:",
        JSON.stringify(data.result, null, 2),
      );

      return data.result;
    } catch (error) {
      console.error(
        "[Printful Location] Error calculating shipping rates:",
        error,
      );
      throw error;
    }
  }

  /**
   * Cache operations using Redis
   */
  private async getFromCache(key: string): Promise<PrintfulCountry[] | null> {
    try {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached as any);
      }
    } catch (error) {
      console.warn(
        `[Printful Location] Cache retrieval failed for key ${key}:`,
        error,
      );
    }
    return null;
  }

  private async saveToCache(
    key: string,
    data: PrintfulCountry[],
  ): Promise<void> {
    try {
      const expirySeconds = Math.floor(this.cacheDurationMs / 1000);
      await redis.set(key, JSON.stringify(data), { ex: expirySeconds });
      console.log(`[Printful Location] Cached data with key ${key}`);
    } catch (error) {
      console.warn(
        `[Printful Location] Cache save failed for key ${key}:`,
        error,
      );
    }
  }

  /**
   * Handle errors consistently
   */
  private handleError(error: unknown, defaultMessage: string): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message =
        error.response?.data?.message || error.message || defaultMessage;
      throw new Error(`[Printful API Error - ${status}] ${message}`);
    }

    if (error instanceof Error) {
      throw new Error(`${defaultMessage}: ${error.message}`);
    }

    throw new Error(defaultMessage);
  }
}

// Export singleton instance
export const printfulLocationService = new PrintfulLocationService();
