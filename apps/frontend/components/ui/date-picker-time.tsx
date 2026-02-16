"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { InputGroup, InputGroupAddon } from "./input-group";

/** Builds an ISO string for the given date and time string (HH:mm or HH:mm:ss). */
function toISOWithTime(date: Date, timeStr: string): string {
  const [h = 0, m = 0, s = 0] = timeStr.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, s, 0);
  return d.toISOString();
}

/** Returns time part as HH:mm:ss from a Date or ISO string. */
function getTimePart(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const h = d.getHours();
  const m = d.getMinutes();
  const s = d.getSeconds();
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export interface DatePickerTimeProps {
  /** Current value as ISO datetime string, or undefined when empty/clearable. */
  value?: string | null;
  /** Called with ISO datetime string when date or time changes; undefined when cleared (if clearable). */
  onChange: (value: string | undefined | null) => void;
  /** If true, the field can be cleared and shows a clear action. */
  clearable?: boolean;
  /** Placeholder when no date selected. */
  placeholder?: string;
  /** Label for the date picker and time input. */
  label?: string;
  /** Id for the date trigger (time input will use id + "-time"). */
  id?: string;
  /** Default time when user selects only a date (e.g. "00:00:00"). */
  defaultTime?: string;
  disabled?: boolean;
  /** Pass through for form validation. */
  "aria-invalid"?: boolean;
  className?: string;
}

export function DatePickerTime({
  value,
  onChange,
  clearable = false,
  placeholder = "Select date",
  label,
  id,
  defaultTime = "00:00:00",
  disabled = false,
  "aria-invalid": ariaInvalid,
  className,
}: DatePickerTimeProps) {
  const [open, setOpen] = React.useState(false);

  const date = React.useMemo(() => {
    if (!value) return undefined;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }, [value]);

  const timeStr = React.useMemo(() => {
    if (value) return getTimePart(value);
    return defaultTime;
  }, [value, defaultTime]);

  const handleDateSelect = React.useCallback(
    (d: Date | undefined) => {
      if (!d) {
        if (clearable) onChange(undefined);
        return;
      }
      onChange(toISOWithTime(d, timeStr));
      setOpen(false);
    },
    [onChange, clearable, timeStr],
  );

  const handleTimeChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const t = e.target.value;
      if (!t) {
        if (clearable) onChange(undefined);
        return;
      }
      const normalized = t.length <= 5 ? `${t}:00` : t;
      const base = date ?? new Date();
      onChange(toISOWithTime(base, normalized));
    },
    [date, onChange, clearable],
  );

  return (
    <FieldGroup className={cn("flex-row flex-wrap gap-4", className)}>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <Field>
        <InputGroup className="justify-between">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                id={id}
                disabled={disabled}
                aria-invalid={ariaInvalid}
                className="w-full min-w-40 justify-between font-normal sm:w-40 border-y rounded-r-none"
              >
                {date ? format(date, "PPP") : placeholder}
                <ChevronDownIcon className="size-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="start"
            >
              <Calendar
                mode="single"
                selected={date}
                captionLayout="dropdown"
                onSelect={handleDateSelect}
                disabled={disabled}
              />
              {clearable && date && (
                <div className="border-t p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      onChange(null);
                      setOpen(false);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
          <InputGroupAddon align="inline-end" className="p-0">
            <Input
              type="time"
              id={id ? `${id}-time` : undefined}
              step="1"
              value={timeStr.slice(0, 8)}
              onChange={handleTimeChange}
              disabled={disabled}
              aria-invalid={ariaInvalid}
              className="[&::-webkit-calendar-picker-indicator]:hidden text-foreground font-normal [&::-webkit-calendar-picker-indicator]:appearance-none border-none ring-0!"
            />
          </InputGroupAddon>
        </InputGroup>
      </Field>
    </FieldGroup>
  );
}
