// filepath: src/lib/hooks/use-countries.ts
"use client";

import { useEffect, useState } from "react";
import {
  getCountriesAction,
  getStatesByCountryAction,
} from "@/lib/actions/location.actions";
import type {
  PrintfulCountry,
  PrintfulState,
} from "@/lib/services/printful-location.service";

export function useCountries() {
  const [countries, setCountries] = useState<PrintfulCountry[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [countriesError, setCountriesError] = useState<string | null>(null);

  // Fetch all countries on mount
  useEffect(() => {
    async function fetchCountries() {
      setIsLoadingCountries(true);
      try {
        const result = await getCountriesAction();
        if (result.success && result.data) {
          // Sort by name for better UX
          const sorted = [...result.data].sort((a, b) =>
            a.name.localeCompare(b.name),
          );
          setCountries(sorted);
        } else {
          setCountriesError(result.error || "Failed to load countries");
        }
      } catch (error) {
        setCountriesError(
          error instanceof Error ? error.message : "Unknown error",
        );
      } finally {
        setIsLoadingCountries(false);
      }
    }

    fetchCountries();
  }, []);

  return {
    countries,
    isLoadingCountries,
    countriesError,
  };
}

export function useStatesByCountry(countryCode: string | null) {
  const [states, setStates] = useState<PrintfulState[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [statesError, setStatesError] = useState<string | null>(null);

  useEffect(() => {
    if (!countryCode) {
      setStates([]);
      setStatesError(null);
      return;
    }

    async function fetchStates() {
      setIsLoadingStates(true);
      try {
        const result = await getStatesByCountryAction(countryCode as string);
        if (result.success && result.data) {
          // Sort by name for better UX
          const sorted = [...result.data].sort((a, b) =>
            a.name.localeCompare(b.name),
          );
          setStates(sorted);
          setStatesError(null);
        } else {
          setStates([]);
          setStatesError(result.error || "Failed to load states");
        }
      } catch (error) {
        setStates([]);
        setStatesError(
          error instanceof Error ? error.message : "Unknown error",
        );
      } finally {
        setIsLoadingStates(false);
      }
    }

    fetchStates();
  }, [countryCode]);

  return {
    states,
    isLoadingStates,
    statesError,
  };
}
