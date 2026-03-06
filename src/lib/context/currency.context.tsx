"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  detectUserCountryAction,
  getExchangeRateAction,
} from "@/lib/actions/currency.actions";
import { currencyService } from "@/lib/services/currency.service";

interface CurrencyContextType {
  currency: string;
  countryCode: string;
  exchangeRate: number;
  symbol: string;
  formatPrice: (amountInCAD: number, converted?: number) => string;
  convertAmount: (amountInCAD: number) => number;
  isLoading: boolean;
  changeCurrency: (currencyCode: string) => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "user-currency-code";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState("CAD");
  const [countryCode, setCountryCode] = useState("CA");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [symbol, setSymbol] = useState("$");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeCurrency = async () => {
      try {
        // Try to get saved currency from localStorage first
        let preferredCurrency = localStorage.getItem(STORAGE_KEY) || "";
        let detectedCountry = "";

        // If no saved currency, try server-side country detection
        if (!preferredCurrency) {
          try {
            console.log(
              "[Currency] Attempting server-side country detection...",
            );
            const result = await detectUserCountryAction();
            detectedCountry = result.countryCode;
            console.log("[Currency] Server detected country:", detectedCountry);
          } catch (error) {
            console.warn("[Currency] Server detection failed:", error);
          }

          // If server detection failed, default to CA
          if (!detectedCountry || detectedCountry === "unknown") {
            console.log("[Currency] Country detection failed, defaulting to CA");
            detectedCountry = "CA";
          }

          // Get currency for the detected country
          const currencyForCountry =
            currencyService.getCurrencyForCountry(detectedCountry);
          preferredCurrency = currencyForCountry;
          console.log(
            "[Currency] Currency for country",
            detectedCountry,
            ":",
            currencyForCountry,
          );

          setCountryCode(detectedCountry);
        }

        // Save preference to localStorage
        localStorage.setItem(STORAGE_KEY, preferredCurrency);

        // Get currency symbol
        try {
          const { getCurrencyData } = await import("country-currency-utils");
          const currencyData = getCurrencyData(preferredCurrency);
          const currencySymbol =
            currencyData?.symbolPreferred || currencyData?.symbol || "$";
          setSymbol(currencySymbol);
          console.log(
            `[Currency] Symbol for ${preferredCurrency}:`,
            currencySymbol,
          );
        } catch (error) {
          console.warn("[Currency] Failed to get symbol, using $:", error);
          setSymbol("$");
        }

        // Get exchange rate
        console.log(
          `[Currency] Attempting to get exchange rate for ${preferredCurrency}...`,
        );
        const rate = await getExchangeRateAction(preferredCurrency);

        // CRITICAL: If rate fetch fails, fall back to CAD with 1:1
        // This prevents showing wrong conversions (e.g., 50 CAD as 50 NGN)
        if (rate === null) {
          console.error(
            `[Currency] Exchange rate failed for ${preferredCurrency}, falling back to CAD 1:1`,
          );
          setCurrency("CAD");
          setCountryCode("CA");
          setExchangeRate(1);
          setSymbol("$");
          localStorage.setItem(STORAGE_KEY, "CAD");
        } else {
          setCurrency(preferredCurrency);
          setExchangeRate(rate);
          console.log(
            `[Currency] Successfully set rate for ${preferredCurrency}: ${rate}`,
          );
        }

        console.log(
          `[Currency] Initialization complete: Currency=${preferredCurrency}, Rate=${rate}`,
        );
      } catch (error) {
        console.error("[Currency] Unexpected initialization error:", error);
        // Keep defaults: CAD, CA, rate 1
      } finally {
        setIsLoading(false);
      }
    };

    initializeCurrency();
  }, []);

  const formatPrice = (amountInCAD: number, converted?: number) => {
    return currencyService.formatPrice(amountInCAD, currency, converted);
  };

  const convertAmount = (amountInCAD: number) => {
    return Math.round(amountInCAD * exchangeRate * 100) / 100;
  };

  const changeCurrency = async (currencyCode: string) => {
    try {
      setIsLoading(true);
      
      // Get symbol for the currency
      try {
        const { getCurrencyData } = await import("country-currency-utils");
        const currencyData = getCurrencyData(currencyCode);
        const currencySymbol =
          currencyData?.symbolPreferred || currencyData?.symbol || "$";
        setSymbol(currencySymbol);
      } catch (error) {
        console.warn("[Currency] Failed to get symbol:", error);
        setSymbol("$");
      }

      // Get exchange rate
      const rate = await getExchangeRateAction(currencyCode);
      if (rate === null) {
        console.error(`[Currency] Failed to get rate for ${currencyCode}`);
        setIsLoading(false);
        return;
      }

      // Update state
      setCurrency(currencyCode);
      setExchangeRate(rate);
      
      // Save to localStorage (use currency code as shorthand)
      localStorage.setItem(STORAGE_KEY, currencyCode);
      
      console.log(
        `[Currency] Changed to ${currencyCode} with rate: ${rate}`,
      );
    } catch (error) {
      console.error("[Currency] Error changing currency:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        countryCode,
        exchangeRate,
        symbol,
        formatPrice,
        convertAmount,
        isLoading,
        changeCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}
