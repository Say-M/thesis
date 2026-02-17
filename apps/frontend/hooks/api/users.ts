import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import useApi from "../use-api";
import type { ResponseType } from "@repo/common/schemas/response";
import type { User } from "@repo/common/models/user";
import type {
  ListUserQuerySchemaType,
  UpdateUserSchemaType,
} from "@repo/common/schemas/user";

const USERS_QUERY_KEY = ["users"] as const;

export type UserListItem = Omit<User, "hashedPassword"> & {
  _id: string;
};

export type ListUsersResponseType = Omit<ResponseType, "data"> & {
  data: { users: UserListItem[] };
  pagination?: {
    limit: number;
    hasMore: boolean;
    nextCursor?: string;
  };
};

export type GetUserResponseType = Omit<ResponseType, "data"> & {
  data: { user: UserListItem };
};

export const useListUsers = (
  params: Partial<
    Omit<ListUserQuerySchemaType, "status"> & { status?: string }
  > = {},
) => {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: [...USERS_QUERY_KEY, "list", params],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get(`/users`, {
        params: {
          ...params,
          cursor: pageParam,
        },
      });
      return {
        users: data?.data?.users as UserListItem[],
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

export const useGetUser = (id: string | null) => {
  const api = useApi();
  return useQuery<GetUserResponseType>({
    queryKey: [...USERS_QUERY_KEY, id],
    queryFn: async () => {
      const { data } = await api.get(`/users/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useUpdateUser = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateUserSchemaType;
    }) => {
      const { data } = await api.patch(`/users/${id}`, payload);
      return data as ResponseType;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "User updated");
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to update user");
    },
  });
};

export const useDeleteUser = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/users/${id}`);
      return data as ResponseType;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "User deleted");
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to delete user");
    },
  });
};
