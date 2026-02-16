"use client";

import { useGetProfile } from "@/hooks/api/auth";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Loader2Icon, Package, User, Lock } from "lucide-react";
import { OrdersTab } from "./components/orders-tab";
import { PasswordTab } from "./components/password-tab";
import { ProfileTab } from "./components/profile-tab";

export default function ProfilePage() {
  const { data: profileData, isLoading: profileLoading } = useGetProfile();
  const user = profileData?.data?.user;

  if (profileLoading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2Icon className="size-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 my-8">
      <Tabs defaultValue="profile">
        <TabsList className="w-full">
          <TabsTrigger value="profile" className="gap-2">
            <User className="size-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="password" className="gap-2">
            <Lock className="size-4" />
            Password
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <Package className="size-4" />
            Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileTab user={user} />
        </TabsContent>

        <TabsContent value="password" className="mt-6">
          <PasswordTab />
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <OrdersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
