"use client";

import { useUpdateProfile, useLogout } from "@/hooks/api/auth";
import type { UpdateProfilePayload } from "@/hooks/api/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2Icon, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useCartWishlist } from "@/contexts/cart-wishlist";
import { Separator } from "@/components/ui/separator";

type UserProfile = {
  name?: string | null;
  email?: string | null;
  mobile?: string | null;
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
  const logout = useLogout();
  const { clearCart, clearWishlist } = useCartWishlist();
  const [form, setForm] = useState<UpdateProfilePayload>({
    name: "",
    shippingAddress: {},
  });

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      name: user.name ?? "",
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
      shippingAddress: clean(form.shippingAddress as Record<string, string | undefined>),
    });
  };

  const handleLogout = () => {
    clearCart();
    clearWishlist();
    logout.mutate();
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

        <Separator className="my-6" />

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-destructive">Danger zone</h3>
          <p className="text-sm text-muted-foreground">
            Log out of your account. You will need to sign in again to access your
            profile.
          </p>
          <Button
            type="button"
            variant="destructive"
            onClick={handleLogout}
            disabled={logout.isPending}
            className="w-full sm:w-auto"
          >
            {logout.isPending ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut className="mr-2 size-4" />
                Log out
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
