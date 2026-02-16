"use client";

import { useUpdatePassword } from "@/hooks/api/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";

export function PasswordTab() {
  const updatePassword = useUpdatePassword();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmNewPassword) return;
    updatePassword.mutate(
      {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmNewPassword: form.confirmNewPassword,
      },
      {
        onSuccess: () => {
          setForm({
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
          });
        },
      }
    );
  };

  const passwordsMatch =
    !form.newPassword || form.newPassword === form.confirmNewPassword;
  const canSubmit =
    form.currentPassword &&
    form.newPassword &&
    passwordsMatch &&
    !updatePassword.isPending;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-medium">Change password</h2>
        <p className="text-sm text-muted-foreground">
          Enter your current password and choose a new one.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={form.currentPassword}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, currentPassword: e.target.value }))
              }
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              value={form.newPassword}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, newPassword: e.target.value }))
              }
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">Confirm new password</Label>
            <Input
              id="confirmNewPassword"
              type="password"
              value={form.confirmNewPassword}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  confirmNewPassword: e.target.value,
                }))
              }
              required
              minLength={6}
            />
            {!passwordsMatch && (
              <p className="text-sm text-destructive">Passwords do not match</p>
            )}
          </div>
          <Button type="submit" disabled={!canSubmit}>
            {updatePassword.isPending && (
              <Loader2Icon className="mr-2 size-4 animate-spin" />
            )}
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
