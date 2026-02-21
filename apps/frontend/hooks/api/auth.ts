import { useContext } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useApi from "../use-api";
import {
  LoginSchemaType,
  RegisterSchemaType,
  UpdatePasswordSchemaType,
} from "@repo/common/schemas/auth";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { AuthContext } from "@/contexts/auth";
import { useRouter } from "next/navigation";

export const useLogin = () => {
  const api = useApi();
  const { setUser } = useContext(AuthContext);
  const router = useRouter();
  return useMutation({
    mutationFn: async (payload: LoginSchemaType) => {
      const { data } = await api.post("/auth/login", payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      setUser(data?.data?.user ?? null);
      router.push("/");
    },
    onError: (error: AxiosError) => {
      toast.error((error.response?.data as { message: string }).message);
    },
  });
};

export const useRegister = () => {
  const api = useApi();
  const { setUser } = useContext(AuthContext);
  const router = useRouter();
  return useMutation({
    mutationFn: async (payload: RegisterSchemaType) => {
      const { data } = await api.post("/auth/register", payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      setUser(data?.data?.user ?? null);
      router.push("/");
    },
    onError: (error: AxiosError) => {
      toast.error((error.response?.data as { message: string }).message);
    },
  });
};

export const useLogout = () => {
  const api = useApi();
  const { setUser } = useContext(AuthContext);
  const router = useRouter();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/auth/logout");
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      setUser(null);
      setTimeout(() => {
        router.push("/auth/login");
      }, 50);
    },
    onError: (error: AxiosError) => {
      toast.error((error.response?.data as { message: string }).message);
    },
  });
};

export const useGetProfile = () => {
  const api = useApi();
  return useQuery({
    queryKey: ["profile"],
    retry: 1,
    queryFn: async () => {
      const { data } = await api.get("/auth/profile");
      return data;
    },
  });
};

export type UpdateProfilePayload = {
  name: string;
  shippingAddress?: Partial<{
    name: string;
    email: string | null;
    phone: string;
    address: string;
    city: string;
  }>;
};

export const useUpdateProfile = () => {
  const api = useApi();
  const { setUser } = useContext(AuthContext);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const { data } = await api.patch("/auth/profile", payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Profile updated successfully");
      if (data?.data?.user) {
        setUser(data?.data?.user ?? null);
      }
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });
};

export const useUpdatePassword = () => {
  const api = useApi();
  return useMutation({
    mutationFn: async (payload: UpdatePasswordSchemaType) => {
      const { data } = await api.patch("/auth/password", payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "Password updated successfully");
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(
        error.response?.data?.message ?? "Failed to update password"
      );
    },
  });
};
