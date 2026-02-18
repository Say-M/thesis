"use client";

import { Loader2Icon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useEffect, useState } from "react";
import { useGetProfile } from "@/hooks/api/auth";
import { User } from "@repo/common/models/user";
import { Role } from "@repo/common/enums/role";

type UserDetail = Omit<User, "_id" | "hashedPassword"> & {
  _id: string;
};

interface AuthContextType {
  user: UserDetail | null;
  setUser: React.Dispatch<React.SetStateAction<UserDetail | null>>;
  isFetching: boolean;
  refetch: () => Promise<unknown>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  isFetching: true,
  refetch: async () => {},
});

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [isFetching, setFetching] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { refetch: getProfile } = useGetProfile();

  const privateRoutes = ["dashboard", "profile"];

  useEffect(() => {
    if (!user)
      getProfile()
        .then(({ data }) => {
          setUser(data?.data?.user ?? null);
        })
        .finally(() => setFetching(false));
  }, [user, pathname]);

  useEffect(() => {
    if (isFetching) return;

    if (pathname.includes("/profile") && !user) router.push("/auth/login");

    if (pathname.includes("/auth") && user) router.push("/");
    if (
      pathname.includes("/dashboard") &&
      ![Role.SUPER_ADMIN, Role.ADMIN].includes(user?.role || Role.USER)
    )
      router.push("/auth/login");
  }, [isFetching, user, pathname]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isFetching,
        refetch: getProfile,
      }}
    >
      {isFetching && privateRoutes.includes(pathname?.split("/")[1] ?? "") ? (
        <div className="flex h-screen w-full items-center justify-center">
          <div className="flex items-center justify-center gap-2">
            <Loader2Icon className="size-12 animate-spin" />
            <div>
              <h3 className="text-2xl font-medium">Authentication</h3>
              <p className="text-sm text-gray-500">
                Please wait while we authenticate your account
              </p>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
