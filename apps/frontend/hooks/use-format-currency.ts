"use client";

import { useCallback } from "react";
import { useConfigContext } from "@/contexts/config";
import { formatCurrency as formatCurrencyBase } from "@/lib/format-currency-base";

export function useFormatCurrency(): (
  value: number,
  options?: Intl.NumberFormatOptions,
) => string {
  const { config } = useConfigContext();
  const currency = config?.currency ?? undefined;

  return useCallback(
    (value: number, options: Intl.NumberFormatOptions = {}) => {
      return formatCurrencyBase(value, {
        ...options,
        ...(currency ? { currency } : {}),
      });
    },
    [currency],
  );
}
