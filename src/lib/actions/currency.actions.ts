"use server";

import { headers } from "next/headers";
import { currencyService } from "@/lib/services/currency.service";

/**
 * Get country code from Vercel headers
 * Vercel's X-Vercel-IP-Country header provides 2-letter country code directly
 * No need for IP detection or geolocation APIs
 */
async function getCountryFromHeaders(headersList: any): Promise<string> {
  // Vercel provides country code directly - this is the preferred method
  const vercelCountry = headersList.get("x-vercel-ip-country");
  if (vercelCountry) {
    console.log("[Currency] Country from x-vercel-ip-country:", vercelCountry);
    return vercelCountry;
  }

  console.log("[Currency] No x-vercel-ip-country header (localhost or non-Vercel environment)");
  return "unknown";
}

/**
 * Server action to detect user's country code from Vercel headers
 * Falls back to browser locale detection on client-side
 */
export async function detectUserCountryAction(): Promise<{
  countryCode: string;
  currency: string;
}> {
  try {
    const headersList = await headers();
    const countryCode = await getCountryFromHeaders(headersList);

    console.log("[Currency] Server-detected country HH:", countryCode);

    // Get currency for country (service handles fallback if not found)
    const currency = currencyService.getCurrencyForCountry(countryCode);

    console.log("[Currency] Currency for detected country:", currency);

    return {
      countryCode: countryCode === "unknown" ? "CA" : countryCode,
      currency,
    };
  } catch (error) {
    console.error("[Currency] Detection error:", error);
    return {
      countryCode: "CA",
      currency: "CAD",
    };
  }
}
