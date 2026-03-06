"use client";

import { useMemo } from "react";
import { useCurrency } from "@/lib/context/currency.context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";
import { getAllAvailableCurrencies } from "@/lib/utils/currency-list";

export function CurrencySelector() {
  const { currency, changeCurrency, isLoading } = useCurrency();

  // Memoize currency list to avoid regenerating on every render
  const currencies = useMemo(() => getAllAvailableCurrencies(), []);

  const handleCurrencyChange = async (newCurrency: string) => {
    if (newCurrency !== currency) {
      await changeCurrency(newCurrency);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={currency} onValueChange={handleCurrencyChange} disabled={isLoading}>
        <SelectTrigger className="w-32.5 border-0 bg-transparent focus:ring-0 hover:bg-gray-50 p-2 rounded cursor-pointer truncate">
          <div className="flex items-center gap-1.5">
            <Globe className="w-4 h-4 shrink-0" />
            <SelectValue placeholder="Select currency" />
          </div>
        </SelectTrigger>
        <SelectContent align="end">
          {currencies.map((curr) => (
            <SelectItem key={curr.code} value={curr.code}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{curr.code}</span>
                <span className="text-sm text-gray-500">{curr.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
