import { getCurrencyData, getCountryData } from "country-currency-utils";

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

/**
 * Get all available currencies dynamically from country-currency-utils
 * Extracts unique currencies from all countries in the library
 * This ensures we support all currencies that the library knows about
 */
export function getAllAvailableCurrencies(): CurrencyOption[] {
  const currencyMap = new Map<string, CurrencyOption>();

  // Get all country codes from the library
  const countryCodes = [
    "AF", "AX", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM",
    "AW", "AU", "AT", "AZ", "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ",
    "BM", "BT", "BO", "BA", "BW", "BV", "BR", "BN", "BG", "BF", "BI", "KH",
    "CM", "CA", "CV", "KY", "CF", "TD", "CL", "CN", "CX", "CC", "CO", "KM",
    "CG", "CD", "CK", "CR", "CI", "HR", "CU", "CY", "CZ", "DK", "DJ", "DM",
    "DO", "EC", "EG", "SV", "GQ", "ER", "EE", "ET", "FK", "FO", "FJ", "FI",
    "FR", "GF", "PF", "TF", "GA", "GM", "GE", "DE", "GH", "GI", "GR", "GL",
    "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY", "HT", "HM", "VA", "HN",
    "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", "JM",
    "JP", "JE", "JO", "KZ", "KE", "KI", "KP", "KR", "KW", "KG", "LA", "LV",
    "LB", "LS", "LR", "LY", "LI", "LT", "LU", "MO", "MK", "MG", "MW", "MY",
    "MV", "ML", "MT", "MH", "MQ", "MR", "MU", "YT", "MX", "FM", "MD", "MC",
    "MN", "ME", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "AN", "NC", "NZ",
    "NI", "NE", "NG", "NU", "NF", "MP", "NO", "OM", "PK", "PW", "PS", "PA",
    "PG", "PY", "PE", "PH", "PN", "PL", "PT", "PR", "QA", "RE", "RO", "RU",
    "RW", "BL", "SH", "KN", "LC", "MF", "PM", "VC", "WS", "SM", "ST", "SA",
    "SN", "RS", "SC", "SL", "SG", "SK", "SI", "SB", "SO", "ZA", "GS", "SS",
    "ES", "LK", "SD", "SR", "SJ", "SZ", "SE", "CH", "SY", "TW", "TJ", "TZ",
    "TH", "TL", "TG", "TK", "TO", "TT", "TN", "TR", "TM", "TV", "UG", "UA",
    "AE", "GB", "US", "UM", "UY", "UZ", "VU", "VE", "VN", "VG", "VI", "WF",
    "EH", "YE", "ZM", "ZW",
  ];

  // Extract unique currency codes from all countries
  const currencyCodes = new Set<string>();

  for (const countryCode of countryCodes) {
    try {
      const countryData = getCountryData(countryCode);
      if (countryData?.currencyCode) {
        currencyCodes.add(countryData.currencyCode);
      }
    } catch (error) {
      // Silently skip if country not found
      continue;
    }
  }

  // Convert currency codes to CurrencyOption objects
  for (const code of currencyCodes) {
    try {
      const currencyData = getCurrencyData(code);
      if (currencyData) {
        currencyMap.set(code, {
          code,
          name: currencyData.name || code,
          symbol: currencyData.symbolPreferred || currencyData.symbol || code,
        });
      }
    } catch (error) {
      // Silently skip unsupported currencies
      continue;
    }
  }

  // Convert map to array and sort by code for consistency
  return Array.from(currencyMap.values()).sort((a, b) =>
    a.code.localeCompare(b.code),
  );
}
