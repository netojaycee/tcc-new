"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { detectUserCountryAction } from "@/lib/actions/currency.actions";
import { currencyService } from "@/lib/services/currency.service";

interface CurrencyContextType {
  currency: string;
  countryCode: string;
  exchangeRate: number;
  symbol: string;
  formatPrice: (amountInCAD: number, converted?: number) => string;
  convertAmount: (amountInCAD: number) => number;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "user-country-code";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState("CAD");
  const [countryCode, setCountryCode] = useState("CA");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [symbol, setSymbol] = useState("$");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeCurrency = async () => {
      try {
        // Try to get saved country from localStorage first
        let detectedCountry = localStorage.getItem(STORAGE_KEY) || "";

        // If no saved country, try server-side detection (x-vercel-ip-country header)
        if (!detectedCountry) {
          try {
            console.log(
              "[Currency] Attempting server-side country detection...",
            );
            const result = await detectUserCountryAction();
            detectedCountry = result.countryCode;
            // detectedCountry = 'AT'
            console.log("[Currency] Server detected country:", detectedCountry);
          } catch (error) {
            console.warn("[Currency] Server detection failed:", error);
            // detectedCountry remains empty, will fall back below
          }
        }

        // If server detection failed, default to CA
        if (!detectedCountry || detectedCountry === "unknown") {
          console.log("[Currency] Country detection failed, defaulting to CA");
          detectedCountry = "CA";
        }

        console.log("[Currency] Final detected country:", detectedCountry);
        setCountryCode(detectedCountry);
        localStorage.setItem(STORAGE_KEY, detectedCountry);

        // Get currency for country
        const currencyForCountry =
          currencyService.getCurrencyForCountry(detectedCountry);
        console.log(
          "[Currency] Currency for country",
          detectedCountry,
          ":",
          currencyForCountry,
        );
        setCurrency(currencyForCountry);

        // Get currency symbol from country-currency-utils
        try {
          const { getCurrencyData } = await import("country-currency-utils");
          const currencyData = getCurrencyData(currencyForCountry);
          const currencySymbol =
            currencyData?.symbolPreferred || currencyData?.symbol || "$";
          setSymbol(currencySymbol);
          console.log(
            `[Currency] Symbol for ${currencyForCountry}:`,
            currencySymbol,
          );
        } catch (error) {
          console.warn("[Currency] Failed to get symbol, using $:", error);
          setSymbol("$");
        }

        // Get exchange rate
        console.log(
          `[Currency] Attempting to get exchange rate for ${currencyForCountry}...`,
        );
        const rate = await currencyService.getExchangeRate(currencyForCountry);

        // CRITICAL: If rate fetch fails, fall back to CAD with 1:1
        // This prevents showing wrong conversions (e.g., 50 CAD as 50 NGN)
        if (rate === null) {
          console.error(
            `[Currency] Exchange rate failed for ${currencyForCountry}, falling back to CAD 1:1`,
          );
          setCurrency("CAD");
          setCountryCode("CA");
          setExchangeRate(1);
          setSymbol("$");
          localStorage.setItem(STORAGE_KEY, "CA");
        } else {
          setExchangeRate(rate);
          console.log(
            `[Currency] Successfully set rate for ${currencyForCountry}: ${rate}`,
          );
        }

        console.log(
          `[Currency] Initialization complete: Country=${detectedCountry}, Currency=${currencyForCountry}, Rate=${rate}`,
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
