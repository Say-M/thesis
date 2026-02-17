"use client";

import { useEffect } from "react";
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
  updateUserSchema,
  type UpdateUserSchemaType,
} from "@repo/common/schemas/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, Resolver, useForm } from "react-hook-form";
import { useUpdateUser } from "@/hooks/api/users";
import type { UserListItem } from "@/hooks/api/users";
import { Role } from "@repo/common/enums/role";

const defaultValues: UpdateUserSchemaType = {
  name: "",
  role: Role.USER,
  status: true,
  password: "",
};

export default function EditUserDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserListItem | null;
}) {
  const form = useForm<UpdateUserSchemaType>({
    resolver: zodResolver(updateUserSchema) as Resolver<UpdateUserSchemaType>,
    defaultValues,
  });

  const { mutate: updateUser, isPending } = useUpdateUser();

  useEffect(() => {
    if (!open || !user) return;
    form.reset({
      name: user.name ?? "",
      role:
        user.role === Role.SUPER_ADMIN
          ? Role.ADMIN
          : (user.role as Role.ADMIN | Role.USER),
      status: user.status ?? true,
      password: "",
    });
  }, [open, user, form]);

  const onSubmit = (values: UpdateUserSchemaType) => {
    if (!user) return;
    const payload: UpdateUserSchemaType = {
      name: values.name,
      role: values.role,
      status: values.status,
    };
    const pwd =
      typeof values.password === "string" ? values.password.trim() : "";
    if (pwd.length >= 6) payload.password = pwd;
    updateUser(
      { id: user._id, payload },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset(defaultValues);
        },
      },
    );
  };

  if (!user) return null;

  const isSuperAdmin = user.role === Role.SUPER_ADMIN;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>
              Update name, role, status and optional password for this user.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="my-6">
            <FieldSet>
              <Controller
                name="name"
                control={form.control}
                render={({ field: { value, ...field }, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-user-name">Name</FieldLabel>
                    <Input
                      {...field}
                      value={value ?? ""}
                      placeholder="Full name"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="role"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Role</FieldLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                      disabled={isSuperAdmin}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                        <SelectItem value={Role.USER}>User</SelectItem>
                      </SelectContent>
                    </Select>
                    {isSuperAdmin && (
                      <p className="text-muted-foreground text-xs mt-1">
                        Super admin role cannot be changed here.
                      </p>
                    )}
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <Switch
                      id="edit-user-status"
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                      disabled={isSuperAdmin}
                    />
                    <FieldLabel
                      htmlFor="edit-user-status"
                      className="font-normal"
                    >
                      Active
                    </FieldLabel>
                  </Field>
                )}
              />

              <Controller
                name="password"
                control={form.control}
                render={({ field: { value, ...field }, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-user-password">
                      New password (optional)
                    </FieldLabel>
                    <Input
                      {...field}
                      id="edit-user-password"
                      type="password"
                      value={value ?? ""}
                      placeholder="Leave blank to keep current"
                      autoComplete="new-password"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldSet>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner className="size-4" />}
              Update
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
