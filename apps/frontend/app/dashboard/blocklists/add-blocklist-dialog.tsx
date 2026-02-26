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
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { createBlocklistSchema } from "@repo/common/schemas/blocklist";
import type { CreateBlocklistSchemaType } from "@repo/common/schemas/blocklist";
import { useCreateBlocklist } from "@/hooks/api/blocklists";

const defaultValues: CreateBlocklistSchemaType = {
  mobile: "",
  reason: null,
};

export default function AddBlocklistDialog({
  open,
  onOpenChange,
  button,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  button: React.ReactNode;
}) {
  const form = useForm<CreateBlocklistSchemaType>({
    resolver: zodResolver(createBlocklistSchema),
    defaultValues,
  });

  const { mutate: createBlocklist, isPending: isCreating } =
    useCreateBlocklist();
  const isPending = isCreating;

  const onSubmit = (values: CreateBlocklistSchemaType) => {
    createBlocklist(values, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset(defaultValues);
      },
    });
  };

  return (
    <>
      {button}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Add Blocklist</DialogTitle>
              <DialogDescription>
                Add a mobile number to the blocklist.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(100svh-20rem)] -mx-4 px-4 overflow-y-auto">
              <FieldGroup className="mt-6">
                <FieldSet>
                  <FieldGroup>
                    <Controller
                      name="mobile"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="mobile">
                            Mobile Number
                          </FieldLabel>
                          <Input
                            {...field}
                            id="mobile"
                            placeholder="e.g., +8801XXXXXXXXX"
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name="reason"
                      control={form.control}
                      render={({ field: { value, ...field }, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="reason">
                            Reason (optional)
                          </FieldLabel>
                          <Textarea
                            {...field}
                            id="reason"
                            value={value ?? ""}
                            placeholder="Why is this number blocklisted?"
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
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
                Add
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
