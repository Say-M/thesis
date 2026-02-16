"use client";

import { useGetProfile } from "@/hooks/api/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2Icon, Lock, Package, User } from "lucide-react";
import { ProfileTab } from "../../(root)/profile/components/profile-tab";
import { PasswordTab } from "../../(root)/profile/components/password-tab";

export default function DashboardProfilePage() {
  const { data: profileData, isLoading: profileLoading } = useGetProfile();
  const user = profileData?.data?.user;

  if (profileLoading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <Loader2Icon className="size-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <section className="p-4 max-w-3xl w-full mx-auto">
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
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileTab user={user} />
        </TabsContent>

        <TabsContent value="password" className="mt-6">
          <PasswordTab />
        </TabsContent>
      </Tabs>
    </section>
  );
}
