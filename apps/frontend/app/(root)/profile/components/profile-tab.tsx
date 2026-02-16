"use client";

import { useUpdateProfile } from "@/hooks/api/auth";
import type { UpdateProfilePayload } from "@/hooks/api/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";

type UserProfile = {
  name?: string | null;
  email?: string | null;
  mobile?: string | null;
  billingAddress?: {
    name?: string;
    email?: string | null;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  } | null;
  shippingAddress?: {
    name?: string;
    email?: string | null;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  } | null;
};

export function ProfileTab({ user }: { user: UserProfile }) {
  const updateProfile = useUpdateProfile();
  const [form, setForm] = useState<UpdateProfilePayload>({
    name: "",
    billingAddress: {},
    shippingAddress: {},
  });

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      name: user.name ?? "",
      billingAddress: user.billingAddress
        ? {
            name: user.billingAddress.name,
            email: user.billingAddress.email ?? undefined,
            phone: user.billingAddress.phone,
            address: user.billingAddress.address,
            city: user.billingAddress.city,
            state: user.billingAddress.state,
            postalCode: user.billingAddress.postalCode,
          }
        : {},
      shippingAddress: user.shippingAddress
        ? {
            name: user.shippingAddress.name,
            email: user.shippingAddress.email ?? undefined,
            phone: user.shippingAddress.phone,
            address: user.shippingAddress.address,
            city: user.shippingAddress.city,
            state: user.shippingAddress.state,
            postalCode: user.shippingAddress.postalCode,
          }
        : {},
    }));
  }, [user]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = (obj: Record<string, string | undefined> | undefined) => {
      if (!obj) return undefined;
      const entries = Object.entries(obj).filter(
        ([, v]) => v != null && String(v).trim() !== ""
      );
      return entries.length ? Object.fromEntries(entries) : undefined;
    };
    updateProfile.mutate({
      name: form.name.trim(),
      billingAddress: clean(form.billingAddress as Record<string, string | undefined>),
      shippingAddress: clean(form.shippingAddress as Record<string, string | undefined>),
    });
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-medium">Personal information</h2>
        <p className="text-sm text-muted-foreground">
          Update your name and addresses.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
              minLength={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={user?.email ?? ""}
              disabled
              className="bg-muted"
              readOnly
            />
          </div>
          <div className="space-y-2">
            <Label>Mobile</Label>
            <Input
              value={user?.mobile ?? ""}
              disabled
              className="bg-muted"
              readOnly
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Billing address (optional)</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="billing-name">Name</Label>
                <Input
                  id="billing-name"
                  value={form.billingAddress?.name ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      billingAddress: {
                        ...prev.billingAddress,
                        name: e.target.value,
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing-phone">Phone</Label>
                <Input
                  id="billing-phone"
                  value={form.billingAddress?.phone ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      billingAddress: {
                        ...prev.billingAddress,
                        phone: e.target.value,
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing-postalCode">Postal code</Label>
                <Input
                  id="billing-postalCode"
                  value={form.billingAddress?.postalCode ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      billingAddress: {
                        ...prev.billingAddress,
                        postalCode: e.target.value,
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="billing-address">Address</Label>
                <Input
                  id="billing-address"
                  value={form.billingAddress?.address ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      billingAddress: {
                        ...prev.billingAddress,
                        address: e.target.value,
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing-city">City</Label>
                <Input
                  id="billing-city"
                  value={form.billingAddress?.city ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      billingAddress: {
                        ...prev.billingAddress,
                        city: e.target.value,
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing-state">State</Label>
                <Input
                  id="billing-state"
                  value={form.billingAddress?.state ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      billingAddress: {
                        ...prev.billingAddress,
                        state: e.target.value,
                      },
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Shipping address (optional)</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="shipping-name">Name</Label>
                <Input
                  id="shipping-name"
                  value={form.shippingAddress?.name ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      shippingAddress: {
                        ...prev.shippingAddress,
                        name: e.target.value,
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipping-phone">Phone</Label>
                <Input
                  id="shipping-phone"
                  value={form.shippingAddress?.phone ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      shippingAddress: {
                        ...prev.shippingAddress,
                        phone: e.target.value,
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipping-postalCode">Postal code</Label>
                <Input
                  id="shipping-postalCode"
                  value={form.shippingAddress?.postalCode ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      shippingAddress: {
                        ...prev.shippingAddress,
                        postalCode: e.target.value,
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="shipping-address">Address</Label>
                <Input
                  id="shipping-address"
                  value={form.shippingAddress?.address ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      shippingAddress: {
                        ...prev.shippingAddress,
                        address: e.target.value,
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipping-city">City</Label>
                <Input
                  id="shipping-city"
                  value={form.shippingAddress?.city ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      shippingAddress: {
                        ...prev.shippingAddress,
                        city: e.target.value,
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipping-state">State</Label>
                <Input
                  id="shipping-state"
                  value={form.shippingAddress?.state ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      shippingAddress: {
                        ...prev.shippingAddress,
                        state: e.target.value,
                      },
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending && (
              <Loader2Icon className="mr-2 size-4 animate-spin" />
            )}
            Save profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
