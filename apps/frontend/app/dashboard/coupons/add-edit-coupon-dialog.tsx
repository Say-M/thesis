"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createCouponSchema,
  CreateCouponSchemaType,
  updateCouponSchema,
} from "@repo/common/schemas/coupon";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, Resolver, useForm } from "react-hook-form";
import { useCreateCoupon, useUpdateCoupon } from "@/hooks/api/coupons";
import type { CouponListItem } from "@/hooks/api/coupons";
import { useEffect } from "react";
import { DiscountType } from "@repo/common/enums/discount";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DatePickerTime } from "@/components/ui/date-picker-time";

type CouponFormValues = Omit<CreateCouponSchemaType, "status"> & {
  status: boolean;
};

const defaultValues: CouponFormValues = {
  code: "",
  description: "",
  discountType: DiscountType.PERCENTAGE,
  value: 0,
  minPurchase: 0,
  maxDiscount: undefined,
  usageLimit: -1,
  perUserLimit: -1,
  freeShipping: false,
  validFrom: new Date().toISOString(),
  validTo: undefined,
  status: true,
};

export default function AddEditCouponDialog({
  open,
  onOpenChange,
  coupon,
  button,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: CouponListItem | null;
  button: React.ReactNode;
}) {
  const form = useForm<CouponFormValues>({
    resolver: zodResolver(
      coupon ? updateCouponSchema : createCouponSchema,
    ) as Resolver<CouponFormValues>,
    defaultValues,
  });

  const { mutate: createCoupon, isPending: isCreating } = useCreateCoupon();
  const { mutate: updateCoupon, isPending: isUpdating } = useUpdateCoupon();
  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (!open) return;
    if (coupon) {
      form.reset({
        code: coupon.code ?? "",
        description: coupon.description ?? "",
        discountType:
          (coupon.discountType as DiscountType) ?? DiscountType.PERCENTAGE,
        value: coupon.value ?? 0,
        minPurchase: coupon.minPurchase ?? 0,
        maxDiscount: coupon.maxDiscount ?? undefined,
        usageLimit: coupon.usageLimit ?? -1,
        perUserLimit: coupon.perUserLimit ?? -1,
        freeShipping: coupon.freeShipping ?? false,
        validFrom: coupon.validFrom
          ? new Date(coupon.validFrom).toISOString()
          : new Date().toISOString(),
        validTo: coupon.validTo
          ? new Date(coupon.validTo).toISOString()
          : undefined,
        status: coupon.status ?? true,
      });
    } else {
      form.reset(defaultValues);
    }
  }, [open, coupon, form]);

  const onSubmit = (values: CouponFormValues) => {
    if (coupon) {
      updateCoupon(
        {
          id: coupon._id,
          payload: values,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            form.reset(defaultValues);
          },
        },
      );
    } else {
      createCoupon(values, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset(defaultValues);
        },
      });
    }
  };

  return (
    <>
      {button}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl!">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>{coupon ? "Edit" : "Add"} Coupon</DialogTitle>
              <DialogDescription>
                {coupon ? "Edit" : "Create"} a discount coupon code.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(100svh-20rem)] -mx-4 px-4 overflow-y-auto">
              <FieldGroup className="my-6">
                <FieldSet>
                  <FieldGroup>
                    <Controller
                      name="code"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="code">Code</FieldLabel>
                          <FieldDescription>
                            Unique coupon code. Will be automatically converted
                            to uppercase.
                          </FieldDescription>
                          <Input
                            {...field}
                            id="code"
                            placeholder="COUPON123"
                            className="font-mono"
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </FieldGroup>
                  <FieldGroup>
                    <Controller
                      name="description"
                      control={form.control}
                      render={({ field: { value, ...field }, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="description">
                            Description (optional)
                          </FieldLabel>
                          <FieldDescription>
                            Optional description or terms for this coupon.
                          </FieldDescription>
                          <Textarea
                            {...field}
                            id="description"
                            value={value ?? ""}
                            placeholder="Coupon description"
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </FieldGroup>
                  <FieldGroup className="grid grid-cols-2 gap-4">
                    <Controller
                      name="value"
                      control={form.control}
                      render={({
                        field: valueField,
                        fieldState: valueState,
                      }) => (
                        <Field data-invalid={valueState.invalid}>
                          <FieldLabel htmlFor="value">Discount</FieldLabel>
                          <FieldDescription>
                            {form.watch("discountType") ===
                            DiscountType.PERCENTAGE
                              ? "Percentage applies discount as a percentage of the total (e.g., 10 for 10% off)."
                              : "Fixed applies a fixed amount discount in the selected currency."}
                          </FieldDescription>
                          <InputGroup>
                            <InputGroupInput
                              id="value"
                              type="number"
                              min={0}
                              value={valueField.value ?? 0}
                              onChange={(e) =>
                                valueField.onChange(Number(e.target.value) || 0)
                              }
                              aria-invalid={valueState.invalid}
                            />
                            <InputGroupAddon align="inline-end">
                              <Controller
                                name="discountType"
                                control={form.control}
                                render={({ field: typeField }) => (
                                  <Select
                                    value={typeField.value ?? undefined}
                                    onValueChange={typeField.onChange}
                                  >
                                    <SelectTrigger
                                      className="border-none ring-0! px-0"
                                      size="sm"
                                    >
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem
                                        value={DiscountType.PERCENTAGE}
                                      >
                                        Percentage
                                      </SelectItem>
                                      <SelectItem value={DiscountType.FIXED}>
                                        Fixed
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </InputGroupAddon>
                          </InputGroup>
                          {valueState.invalid && (
                            <FieldError errors={[valueState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name="minPurchase"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="minPurchase">
                            Min Purchase (optional)
                          </FieldLabel>
                          <FieldDescription>
                            Minimum cart total required to use this coupon. Set
                            to 0 for no minimum.
                          </FieldDescription>
                          <Input
                            {...field}
                            id="minPurchase"
                            type="number"
                            min={0}
                            value={field.value ?? 0}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value) || 0)
                            }
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name="maxDiscount"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="maxDiscount">
                            Max Discount (optional)
                          </FieldLabel>
                          <FieldDescription>
                            Maximum discount amount cap (useful for percentage
                            discounts). Leave empty for no limit.
                          </FieldDescription>
                          <Input
                            {...field}
                            id="maxDiscount"
                            type="number"
                            min={0}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              )
                            }
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name="usageLimit"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="usageLimit">
                            Usage Limit
                          </FieldLabel>
                          <FieldDescription>
                            Total number of times this coupon can be used. Set
                            to -1 for unlimited usage.
                          </FieldDescription>
                          <Input
                            {...field}
                            id="usageLimit"
                            type="number"
                            value={field.value ?? 0}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value) || 0)
                            }
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name="perUserLimit"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="perUserLimit">
                            Per User Limit
                          </FieldLabel>
                          <FieldDescription>
                            Maximum number of times a single user can use this
                            coupon. Set to -1 for unlimited per user.
                          </FieldDescription>
                          <Input
                            {...field}
                            id="perUserLimit"
                            type="number"
                            value={field.value ?? 0}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </FieldGroup>
                  <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Controller
                      name="validFrom"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Valid From</FieldLabel>
                          <FieldDescription>
                            Date and time when the coupon becomes valid.
                            Defaults to current time.
                          </FieldDescription>
                          <DatePickerTime
                            id="validFrom"
                            value={field.value || null}
                            onChange={(v) =>
                              field.onChange(v ?? new Date().toISOString())
                            }
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name="validTo"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Valid To (optional)</FieldLabel>
                          <FieldDescription>
                            Date and time when the coupon expires. Leave empty
                            for no expiration date.
                          </FieldDescription>
                          <DatePickerTime
                            id="validTo"
                            value={field.value || null}
                            onChange={field.onChange}
                            clearable
                            placeholder="No expiration"
                            defaultTime="23:59:59"
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </FieldGroup>
                  <FieldGroup>
                    <Controller
                      name="freeShipping"
                      control={form.control}
                      render={({ field }) => (
                        <Field orientation="horizontal">
                          <Switch
                            id="freeShipping"
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                          />
                          <div className="flex flex-col gap-1">
                            <FieldLabel
                              htmlFor="freeShipping"
                              className="font-normal"
                            >
                              Free Shipping
                            </FieldLabel>
                            <FieldDescription>
                              When enabled, this coupon will also provide free
                              shipping on the order.
                            </FieldDescription>
                          </div>
                        </Field>
                      )}
                    />
                  </FieldGroup>
                  <FieldGroup>
                    <Controller
                      name="status"
                      control={form.control}
                      render={({ field }) => (
                        <Field orientation="horizontal">
                          <Switch
                            id="status"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <div className="flex flex-col gap-1">
                            <FieldLabel
                              htmlFor="status"
                              className="font-normal"
                            >
                              Status
                            </FieldLabel>
                            <FieldDescription>
                              Active coupons can be used by customers. Inactive
                              coupons are disabled.
                            </FieldDescription>
                          </div>
                        </Field>
                      )}
                    />
                  </FieldGroup>
                </FieldSet>
              </FieldGroup>
            </ScrollArea>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending && <Spinner />}
                {coupon ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
