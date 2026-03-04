import { redis } from "@/lib/redis";
import { getCountryData, getCurrencyData } from "country-currency-utils";

const EXCHANGE_RATE_CACHE_TTL = 86400; // 24 hours = 1 day
// With Redis caching at 24h TTL:
// If we have 150 currencies, that's max 150 API calls per day
// 150 calls/day << 1500 calls/month limit (free tier)
// This gives us safe margin + multiple fallbacks



/**
 * Fetch from Frankfurter API (supports ~30 currencies)
 * Returns null if currency not supported (404)
 */
async function fetchFromFrankfurter(
  targetCurrency: string
): Promise<number | null> {
  try {
    console.log(
      `[Currency] Trying frankfurter.dev for CAD-${targetCurrency}...`
    );
    const response = await fetch(
      `https://api.frankfurter.dev/v1/latest?base=CAD&symbols=${targetCurrency}`,
      {
        signal: AbortSignal.timeout(5000),
      }
    );

    // 404 means currency not supported in frankfurter
    if (response.status === 404) {
      console.log(
        `[Currency] Frankfurter does not support ${targetCurrency} (404)`
      );
      return null;
    }

    if (!response.ok) {
      console.warn(
        `[Currency] Frankfurter API error (${response.status}) for ${targetCurrency}`
      );
      return null;
    }

    const data = await response.json();
    const rate = data.rates?.[targetCurrency];

    if (!rate) {
      console.warn(
        `[Currency] Frankfurter did not return rate for ${targetCurrency}`
      );
      return null;
    }

    console.log(
      `[Currency] Frankfurter success: ${targetCurrency} = ${rate}`
    );
    return rate;
  } catch (error) {
    console.warn(
      `[Currency] Frankfurter fetch error for ${targetCurrency}:`,
      error
    );
    return null;
  }
}

/**
 * Fallback to exchangerate-api.com (supports 170+ currencies, 1500 req/month free)
 */
async function fetchFromExchangeRateAPI(
  targetCurrency: string
): Promise<number | null> {
  try {
    console.log(
      `[Currency] Trying exchangerate-api.com for CAD-${targetCurrency}...`
    );
    const response = await fetch(
      `https://open.er-api.com/v6/latest/CAD`,
      {
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      console.warn(`[Currency] ExchangeRateAPI error (${response.status})`);
      return null;
    }

    const data = await response.json();
    const rate = data.rates?.[targetCurrency];

    if (!rate) {
      console.warn(
        `[Currency] ExchangeRateAPI did not return rate for ${targetCurrency}`
      );
      return null;
    }

    console.log(
      `[Currency] ExchangeRateAPI success: ${targetCurrency} = ${rate}`
    );
    return rate;
  } catch (error) {
    console.warn(
      `[Currency] ExchangeRateAPI fetch error for ${targetCurrency}:`,
      error
    );
    return null;
  }
}

export const currencyService = {
  /**
   * Get currency code for a country using country-currency-utils
   */
  getCurrencyForCountry(countryCode: string): string {
    try {
      console.log("[Currency] Getting currency for country:", countryCode);
      const countryData = getCountryData(countryCode);
      console.log("[Currency] Country data:", countryData);
      return countryData?.currencyCode || "CAD";
    } catch {
      return "CAD"; // Default to CAD
    }
  },

  /**
   * Get exchange rate from CAD to target currency
   * Strategy:
   * 1. Check Redis cache (24h TTL)
   * 2. Try Frankfurter.dev (supports ~30 currencies, fast)
   * 3. Fallback to exchangerate-api.com (supports 170+, as backup)
   * 4. Return null if BOTH fail (caller should handle fallback to CAD)
   *
   * Both calls are cached in Redis to stay within free tier limits:
   * - 150 currencies × 1 call/day = 150 calls/day
   * - Well under 1500 calls/month limit
   */
  async getExchangeRate(targetCurrency: string): Promise<number | null> {
    try {
      // Default to CAD if no target or if target is CAD
      if (!targetCurrency || targetCurrency === "CAD") {
        return 1;
      }

      const cacheKey = `rates:CAD:${targetCurrency}`;

      // Check Redis cache first (avoid API calls)
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          const rate = parseFloat(cached as string);
          console.log(`[Currency] Cache hit for ${targetCurrency}: ${rate}`);
          return rate;
        }
      } catch (error) {
        console.warn("[Currency] Redis read error, continuing to API:", error);
      }

      // Try Frankfurter first (best for major currencies)
      let rate = await fetchFromFrankfurter(targetCurrency);

      // If Frankfurter fails/missing, try exchangerate-api.com
      if (rate === null) {
        console.log(
          `[Currency] Frankfurter failed, trying exchangerate-api.com...`
        );
        rate = await fetchFromExchangeRateAPI(targetCurrency);
      }

      // If BOTH APIs fail, return null (caller will handle fallback)
      if (rate === null) {
        console.error(
          `[Currency] Both APIs failed for ${targetCurrency}, returning null`
        );
        return null;
      }

      // Cache successful rate for 24 hours
      try {
        await redis.set(cacheKey, rate.toString(), {
          ex: EXCHANGE_RATE_CACHE_TTL,
        });
        console.log(`[Currency] Cached ${targetCurrency} rate: ${rate}`);
      } catch (error) {
        console.warn("[Currency] Redis write error:", error);
        // Continue even if redis fails
      }

      return rate;
    } catch (error) {
      console.error("[Currency] Unexpected error in getExchangeRate:", error);
      return null;
    }
  },

  /**
   * Format price with currency symbol using country-currency-utils
   * Intelligently handles symbol placement based on currency conventions
   */
  formatPrice(
    amountInCAD: number,
    currency: string,
    convertedAmount?: number
  ): string {
    try {
      const currencyData = getCurrencyData(currency);
      const symbol =
        currencyData?.symbolPreferred || currencyData?.symbol || currency;
      const amount =
        convertedAmount !== undefined ? convertedAmount : amountInCAD;

      // Currencies where symbol goes after the amount
      const symbolAfterCurrencies = ["JPY", "CNY", "KRW", "VND"];
      if (symbolAfterCurrencies.includes(currency)) {
        return `${Math.round(amount)}${symbol}`;
      }

      // Default: symbol before amount
      return `${symbol}${amount.toFixed(2)}`;
    } catch (error) {
      console.warn(`[Currency] Failed to format price for ${currency}:`, error);
      // Fallback formatting
      const amount =
        convertedAmount !== undefined ? convertedAmount : amountInCAD;
      return `${currency} ${amount.toFixed(2)}`;
    }
  },
};
