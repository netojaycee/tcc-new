// filepath: src/lib/actions/location.actions.ts
"use server";

import { printfulLocationService, type PrintfulCountry, type PrintfulState } from "@/lib/services/printful-location.service";

/**
 * Get all countries from Printful
 */
export async function getCountriesAction(): Promise<{
  success: boolean;
  data?: PrintfulCountry[];
  error?: string;
}> {
  try {
    const countries = await printfulLocationService.getCountries();
    return {
      success: true,
      data: countries,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch countries";
    console.error("[getCountriesAction]", message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Get states for a specific country
 */
export async function getStatesByCountryAction(
  countryCode: string,
): Promise<{
  success: boolean;
  data?: PrintfulState[];
  error?: string;
}> {
  try {
    if (!countryCode) {
      return {
        success: false,
        error: "Country code is required",
      };
    }

    const states = await printfulLocationService.getStatesByCountry(countryCode);
    return {
      success: true,
      data: states,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch states";
    console.error("[getStatesByCountryAction]", message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Get specific country by code
 */
export async function getCountryByCodeAction(
  countryCode: string,
): Promise<{
  success: boolean;
  data?: PrintfulCountry;
  error?: string;
}> {
  try {
    if (!countryCode) {
      return {
        success: false,
        error: "Country code is required",
      };
    }

    const country = await printfulLocationService.getCountryByCode(countryCode);
    if (!country) {
      return {
        success: false,
        error: `Country not found: ${countryCode}`,
      };
    }

    return {
      success: true,
      data: country,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch country";
    console.error("[getCountryByCodeAction]", message);
    return {
      success: false,
      error: message,
    };
  }
}
