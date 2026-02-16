import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import useApi from "../use-api";
import type {
  CreateCouponSchemaType,
  UpdateCouponSchemaType,
  ListCouponQuerySchemaType,
} from "@app/backend/schemas/coupon";
import type { Coupon } from "@app/backend/models/coupon";
import type { ResponseType } from "@repo/common/schemas/response";

const COUPONS_QUERY_KEY = ["coupons"] as const;

export type CouponListItem = Coupon & {
  _id: string;
};

export type ListCouponsResponseType = Omit<ResponseType, "data"> & {
  data: {
    coupons: CouponListItem[];
  };
};

export const useListCoupons = (
  params: Partial<ListCouponQuerySchemaType> & {
    limit?: number;
    cursor?: string;
  } = {},
) => {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: [...COUPONS_QUERY_KEY, "list", params],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get(`/coupons`, {
        params: {
          ...params,
          cursor: pageParam,
        },
      });
      return {
        coupons: data?.data?.coupons as CouponListItem[],
        nextPage: data?.pagination?.hasMore
          ? data?.pagination?.nextCursor
          : undefined,
      };
    },
    initialPageParam: undefined,
    getNextPageParam: ({ nextPage }) => {
      return nextPage;
    },
  });
};

export const useGetCoupon = (id: string | null) => {
  const api = useApi();
  return useQuery({
    queryKey: [...COUPONS_QUERY_KEY, id],
    queryFn: async () => {
      const { data } = await api.get(`/coupons/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export type ValidateCouponResponse = {
  data?: {
    isValid: boolean;
    coupon?: {
      _id: string;
      code: string;
      discountType: string;
      value: number;
      minPurchase?: number;
      maxDiscount?: number;
      isFreeShipping?: boolean;
      description?: string;
    };
  };
  status?: number;
  message?: string;
};

export const useValidateCoupon = () => {
  const api = useApi();
  return useMutation({
    mutationFn: async ({
      code,
      cartTotal,
    }: {
      code: string;
      cartTotal: number;
    }) => {
      const { data } = await api.post(
        `/coupons/code/${encodeURIComponent(code.trim())}`,
        { data: { cartTotal } },
      );
      return data as ValidateCouponResponse;
    },
  });
};

export const useCreateCoupon = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateCouponSchemaType) => {
      const { data } = await api.post("/coupons", payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "Coupon created");
      queryClient.invalidateQueries({ queryKey: COUPONS_QUERY_KEY });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to create coupon");
    },
  });
};

export const useUpdateCoupon = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCouponSchemaType;
    }) => {
      const { data } = await api.patch(`/coupons/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "Coupon updated");
      queryClient.invalidateQueries({ queryKey: COUPONS_QUERY_KEY });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to update coupon");
    },
  });
};

export const useDeleteCoupon = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/coupons/${id}`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "Coupon deleted");
      queryClient.invalidateQueries({ queryKey: COUPONS_QUERY_KEY });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to delete coupon");
    },
  });
};
