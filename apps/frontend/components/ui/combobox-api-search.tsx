"use client";

import * as React from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxApiSearchOption {
  label: string;
  value: string;
  [key: string]: unknown;
}

export interface ComboboxApiSearchProps<T = ComboboxApiSearchOption> {
  /** Fetch options from API. Receives current query string. */
  searchFn: (query: string) => Promise<T[]>;
  /** Map option to display label */
  getOptionLabel: (option: T) => string;
  /** Map option to value (e.g. id). Defaults to getOptionLabel */
  getOptionValue?: (option: T) => string;
  /** Controlled value (option or value string depending on valueIsItem) */
  value?: T | string | null;
  /** Called when selection changes. Receives the selected option or null. */
  onChange?: (option: T | null) => void;
  /** Debounce delay for search in ms */
  debounceMs?: number;
  /** Minimum query length before calling searchFn (default 0) */
  minQueryLength?: number;
  /** Placeholder for the input */
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Show clear button when value is set */
  clearable?: boolean;
  /** If true, value/onChange work with the full option object; if false, with getOptionValue(option) */
  valueIsItem?: boolean;
  /** Custom render for each option in the dropdown list. Receives the option object. */
  renderOption?: (option: T) => React.ReactNode;
}

function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debouncedValue;
}

export function ComboboxApiSearch<T extends ComboboxApiSearchOption>({
  searchFn,
  getOptionLabel,
  getOptionValue = (o) =>
    (o as ComboboxApiSearchOption).value ?? getOptionLabel(o),
  value,
  onChange,
  debounceMs = 300,
  minQueryLength = 0,
  placeholder = "Search…",
  disabled = false,
  className,
  clearable = true,
  valueIsItem = false,
  renderOption,
}: ComboboxApiSearchProps<T>) {
  const [inputValue, setInputValue] = React.useState("");
  const [options, setOptions] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(false);

  const debouncedQuery = useDebounce(
    inputValue.trim().toLowerCase(),
    debounceMs,
  );

  const selectedOption = React.useMemo((): T | null => {
    if (value == null) return null;
    if (valueIsItem && typeof value === "object") return value as T;
    const v = typeof value === "string" ? value : getOptionValue(value as T);
    return (options.find((o) => getOptionValue(o) === v) ?? null) as T | null;
  }, [value, valueIsItem, options, getOptionValue]);

  React.useEffect(() => {
    if (debouncedQuery.length < minQueryLength) {
      setOptions(selectedOption ? [selectedOption] : []);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    searchFn(debouncedQuery)
      .then((results) => {
        if (cancelled) return;
        const merged = selectedOption
          ? [
              selectedOption,
              ...results.filter(
                (r) => getOptionValue(r) !== getOptionValue(selectedOption),
              ),
            ]
          : results;
        setOptions(merged);
      })
      .catch(() => {
        if (!cancelled) setOptions(selectedOption ? [selectedOption] : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    debouncedQuery,
    minQueryLength,
    searchFn,
    selectedOption,
    getOptionValue,
  ]);

  const items = React.useMemo(
    () =>
      options.map((opt) => ({
        label: getOptionLabel(opt),
        value: getOptionValue(opt),
        __option: opt,
      })),
    [options, getOptionLabel, getOptionValue],
  );

  const handleValueChange = React.useCallback(
    (val: { label: string; value: string; __option?: T } | null) => {
      if (!onChange) return;
      if (val == null || !("__option" in val)) {
        onChange(null);
        return;
      }
      onChange((val as { __option: T }).__option);
    },
    [onChange],
  );

  const comboboxValue = selectedOption
    ? {
        label: getOptionLabel(selectedOption),
        value: getOptionValue(selectedOption),
        __option: selectedOption,
      }
    : null;

  const displayLabel = (item: (typeof items)[number]) =>
    renderOption && item.__option != null
      ? renderOption(item.__option)
      : item.label;

  return (
    <Combobox
      items={items}
      filteredItems={items}
      value={comboboxValue}
      onValueChange={handleValueChange}
      inputValue={inputValue}
      onInputValueChange={(q) => setInputValue(q)}
      disabled={disabled}
      itemToStringLabel={(item) =>
        item && typeof item === "object" && "label" in item
          ? String((item as { label: string }).label)
          : ""
      }
      itemToStringValue={(item) =>
        item && typeof item === "object" && "value" in item
          ? String((item as { value: string }).value)
          : ""
      }
      isItemEqualToValue={(a, b) =>
        a != null &&
        b != null &&
        typeof a === "object" &&
        typeof b === "object" &&
        "value" in a &&
        "value" in b &&
        (a as { value: string }).value === (b as { value: string }).value
      }
    >
      <ComboboxInput
        placeholder={placeholder}
        disabled={disabled}
        showClear={clearable && !!selectedOption}
        className={cn("w-full", className)}
      />
      <ComboboxContent>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Searching…
          </div>
        ) : (
          <>
            <ComboboxEmpty>No results found.</ComboboxEmpty>
            <ComboboxList>
              {items.map((item) => (
                <ComboboxItem key={item.value} value={item}>
                  {displayLabel(item)}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </>
        )}
      </ComboboxContent>
    </Combobox>
  );
}
