"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  TransactionType,
  TransactionStatus,
  PaymentMethod,
} from "@app/backend/enums/invoice";
import { useCreateTransaction } from "@/hooks/api/transactions";
import { useFormatCurrency } from "@/lib/format-currency";
import {
  createTransactionSchema,
  CreateTransactionSchemaType,
} from "@app/backend/schemas/transaction";

export default function AddTransactionDialog({
  open,
  onOpenChange,
  invoiceId,
  type,
  remainingBalance,
  currency = "BDT",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  type: typeof TransactionType.PAYMENT | typeof TransactionType.REFUND;
  remainingBalance: number;
  currency?: string;
}) {
  const formatCurrency = useFormatCurrency();
  const { mutate: createTransaction, isPending } =
    useCreateTransaction(invoiceId);

  const form = useForm<CreateTransactionSchemaType>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      amount: 0,
      status: TransactionStatus.SUCCESS,
      paymentMethod: PaymentMethod.CASH,
      reference: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        amount: 0,
        status: TransactionStatus.SUCCESS,
        paymentMethod: PaymentMethod.CASH,
        reference: "",
        type,
      });
    }
  }, [open, form]);

  const onSubmit = (values: CreateTransactionSchemaType) => {
    if (type === TransactionType.REFUND && values.amount > remainingBalance) {
      form.setError("amount", {
        message: `Refund cannot exceed remaining balance (${remainingBalance})`,
      });
      return;
    }
    createTransaction(values, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  const title =
    type === TransactionType.PAYMENT ? "Record Payment" : "Record Refund";
  const description =
    type === TransactionType.PAYMENT
      ? "Add a payment against this invoice."
      : "Record a refund for this invoice.";
  const maxAmount =
    type === TransactionType.REFUND ? remainingBalance : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <FieldGroup className="grid grid-cols-1 md:grid-cols-3">
              <Controller
                name="amount"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldGroup>
                      <FieldLabel>Amount ({currency})</FieldLabel>
                      <Input
                        type="number"
                        step="0.01"
                        min={0.01}
                        placeholder="0.00"
                        value={field.value === 0 ? "" : field.value}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : 0,
                          )
                        }
                        onBlur={field.onBlur}
                        aria-invalid={fieldState.invalid}
                      />
                      {maxAmount != null && (
                        <p className="text-xs text-muted-foreground">
                          Max refund: {formatCurrency(maxAmount)}
                        </p>
                      )}
                      <FieldError
                        errors={
                          fieldState.error ? [fieldState.error] : undefined
                        }
                      />
                    </FieldGroup>
                  </Field>
                )}
              />
              <Controller
                name="paymentMethod"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldGroup>
                      <FieldLabel>Payment method</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(PaymentMethod).map((method) => (
                            <SelectItem key={method} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError
                        errors={
                          fieldState.error ? [fieldState.error] : undefined
                        }
                      />
                    </FieldGroup>
                  </Field>
                )}
              />
              <Controller
                name="status"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldGroup>
                      <FieldLabel>Status</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(TransactionStatus).map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError
                        errors={
                          fieldState.error ? [fieldState.error] : undefined
                        }
                      />
                    </FieldGroup>
                  </Field>
                )}
              />
            </FieldGroup>
            <Controller
              name="reference"
              control={form.control}
              render={({ field: { value, ...field }, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldGroup>
                    <FieldLabel>Reference</FieldLabel>
                    <Input
                      placeholder="e.g. TXN-001, cheque number"
                      {...field}
                      value={value ?? ""}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError
                      errors={fieldState.error ? [fieldState.error] : undefined}
                    />
                  </FieldGroup>
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter className="gap-2 pt-4 sm:pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Saving…
                </>
              ) : type === TransactionType.PAYMENT ? (
                "Record Payment"
              ) : (
                "Record Refund"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
