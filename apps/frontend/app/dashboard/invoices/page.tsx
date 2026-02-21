"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import InvoicesTable from "./table";
import {
  InvoiceStatus,
  InvoiceType,
  PaymentType,
} from "@repo/common/enums/invoice";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { useDeleteInvoice, type InvoiceListItem } from "@/hooks/api/invoices";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  processSteadfastInvoicesSchema,
  ProcessSteadfastInvoicesSchemaType,
  DeliveryType,
} from "@repo/common/schemas/steadfast";
import { useProcessSteadfast } from "@/hooks/api/steadfast";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

const SEARCH_DEBOUNCE_MS = 300;

export type InvoiceStatusFilter = "all" | InvoiceStatus;
export type InvoiceTypeFilter = "all" | InvoiceType;

export default function InvoicesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<InvoiceTypeFilter>("all");

  const form = useForm<ProcessSteadfastInvoicesSchemaType>({
    resolver: zodResolver(processSteadfastInvoicesSchema),
    defaultValues: {},
  });

  const [invoiceToProcess, setInvoiceToProcess] =
    useState<InvoiceListItem | null>(null);
  useEffect(() => {
    if (invoiceToProcess) {
      form.reset({
        invoice: invoiceToProcess.invoiceNumber,
        cod_amount:
          invoiceToProcess.paymentType === PaymentType.COD
            ? invoiceToProcess.total
            : 0,
        delivery_type: DeliveryType.HOME_DELIVERY,
        item_description: invoiceToProcess.items
          .map((item) => item.name)
          .join(", "),
        note: invoiceToProcess.notes,
      });
    } else {
      form.reset({
        invoice: "",
        cod_amount: 0,
        delivery_type: DeliveryType.HOME_DELIVERY,
        item_description: "",
        note: "",
      });
    }
  }, [invoiceToProcess, form]);
  const { mutate: processSteadfast, isPending: isProcessing } =
    useProcessSteadfast();

  const onSubmit = (values: ProcessSteadfastInvoicesSchemaType) => {
    processSteadfast(values, {
      onSettled: () => {
        setInvoiceToProcess(null);
        form.reset();
      },
    });
  };

  const [invoiceToDelete, setInvoiceToDelete] =
    useState<InvoiceListItem | null>(null);
  const { mutate: deleteInvoice, isPending: isDeleting } = useDeleteInvoice();
  const handleConfirmDelete = () => {
    if (invoiceToDelete) {
      deleteInvoice(invoiceToDelete._id, {
        onSettled: () => setInvoiceToDelete(null),
      });
    }
  };

  useEffect(() => {
    const id = setTimeout(
      () => setSearchQuery(searchInput.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(id);
  }, [searchInput]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between gap-4 flex-wrap">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <Input
            type="text"
            placeholder="Search invoices"
            className="w-full min-w-2xs max-w-sm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search invoices"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as InvoiceStatusFilter)}
          >
            <SelectTrigger size="default">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              {Object.values(InvoiceStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as InvoiceTypeFilter)}
          >
            <SelectTrigger className="w-[130px]" size="default">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {Object.values(InvoiceType).map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Dialog
        open={invoiceToProcess !== null}
        onOpenChange={(open) => !open && setInvoiceToProcess(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process invoice with Steadfast</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="cod_amount"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>COD amount</FieldLabel>
                    <Input type="number" {...field} />
                  </Field>
                )}
              />
              <Controller
                name="note"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Note</FieldLabel>
                    <Textarea {...field} value={field.value || ""} />
                  </Field>
                )}
              />
              <Controller
                name="item_description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Item description</FieldLabel>
                    <Textarea {...field} value={field.value || ""} />
                  </Field>
                )}
              />
              <Controller
                name="delivery_type"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Delivery type</FieldLabel>
                    <Select
                      value={
                        Number.isNaN(field.value)
                          ? undefined
                          : field.value.toString()
                      }
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select delivery type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value={DeliveryType.HOME_DELIVERY.toString()}
                        >
                          Home delivery
                        </SelectItem>
                        <SelectItem
                          value={DeliveryType.POINT_DELIVERY.toString()}
                        >
                          Point delivery
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" disabled={isProcessing}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isProcessing}>
                  {isProcessing && <Spinner className="size-4" />}
                  Process
                </Button>
              </DialogFooter>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={invoiceToDelete !== null}
        onOpenChange={(open) => !open && setInvoiceToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete invoice</AlertDialogTitle>
            {invoiceToDelete?.status === InvoiceStatus.CANCELLED ? (
              <AlertDialogDescription>
                Are you sure you want to delete &quot;
                {invoiceToDelete?.invoiceNumber}&quot;? This action cannot be
                undone.
              </AlertDialogDescription>
            ) : (
              <AlertDialogDescription>
                The invoice is not cancelled. Please cancel the invoice first.
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {invoiceToDelete?.status === InvoiceStatus.CANCELLED
                ? "Cancel"
                : "Close"}
            </AlertDialogCancel>
            {invoiceToDelete?.status === InvoiceStatus.CANCELLED && (
              <AlertDialogAction asChild>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting && <Spinner className="size-4" />}
                  Delete
                </Button>
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <InvoicesTable
        search={searchQuery || undefined}
        status={
          statusFilter === "all" ? undefined : [statusFilter as InvoiceStatus]
        }
        type={typeFilter === "all" ? undefined : [typeFilter as InvoiceType]}
        onDelete={setInvoiceToDelete}
        onProcess={setInvoiceToProcess}
      />
    </div>
  );
}
