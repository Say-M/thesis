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
  CreateProductSchemaType,
  UpdateProductSchemaType,
  ListProductQuerySchemaType,
} from "@app/backend/schemas/product";
import type { Product } from "@app/backend/models/product";
import { ResponseType } from "@repo/common/schemas/response";
import { DiscountType } from "@app/backend/enums/discount";

const PRODUCTS_QUERY_KEY = ["products"] as const;

export type ProductListVariant = {
  _id: string;
  name?: string;
  sellingPrice?: number;
  discountValue?: number;
  discountType?: string;
  stock?: number;
};

export type ProductDetail = Omit<
  Product,
  | "_id"
  | "category"
  | "subcategory"
  | "thumbnail"
  | "images"
  | "variants"
  | "seo"
> & {
  _id: string;
  category?: { _id: string; name: string };
  subcategory?: { _id: string; name: string };
  thumbnail?: { _id: string; name: string; path: string };
  images?: { _id: string; name: string; path: string }[];
  variants?: (Omit<Product["variants"][number], "_id" | "images"> & {
    _id: string;
    images?: { _id: string; name: string; path: string }[];
  })[];
  seo?: string | null;
};

export type ListProductsResponseType = Omit<ResponseType, "data"> & {
  data: { products: ProductDetail[] };
  pagination?: { limit: number; hasMore: boolean; nextCursor?: string };
};

/** Resolve price, oldPrice, and stock from product or first variant. */
export function productListItemToCardProps(p: ProductDetail): {
  price: number;
  oldPrice: number | null;
  stock: number;
  variantId?: string;
} {
  const useFirstVariant = p.hasVariants && p.variants && p.variants.length > 0;
  const v = useFirstVariant ? p.variants![0] : null;

  const sellingPrice = v ? (v.sellingPrice ?? 0) : (p.sellingPrice ?? 0);
  const discountValue = v ? (v.discountValue ?? 0) : (p.discountValue ?? 0);
  const discountType = v ? v.discountType : p.discountType;
  const stock = v ? (v.stock ?? 0) : (p.stock ?? 0);

  const price = sellingPrice;
  const oldPrice =
    discountValue > 0 && discountType === DiscountType.PERCENTAGE
      ? Math.round(price / (1 - discountValue / 100))
      : discountValue > 0 && discountType === DiscountType.FIXED
        ? price + discountValue
        : null;

  return { price, oldPrice, stock, variantId: v?._id };
}

/** Get unit price and stock for a product line, optionally for a specific variant. */
export function productListItemUnitPriceAndStock(
  p: ProductDetail,
  variantId?: string,
): { unitPrice: number; stock: number } {
  if (variantId && p.variants?.length) {
    const v = p.variants.find((x) => x._id === variantId);
    if (v) {
      const price = v.sellingPrice ?? 0;
      const discountValue = v.discountValue ?? 0;
      const discountType = v.discountType;
      const unitPrice = price;
      const stock = v.stock ?? 0;
      return { unitPrice, stock };
    }
  }
  const { price, stock } = productListItemToCardProps(p);
  return { unitPrice: price, stock };
}

export type UseListProductsQuery = Partial<
  Omit<
    ListProductQuerySchemaType,
    "status" | "featured" | "categories" | "subcategories"
  >
> & {
  limit?: number;
  cursor?: string;
  /** When false, the query is disabled (e.g. when dependent IDs are empty). */
  enabled?: boolean;
  status?: string;
  featured?: string;
  categories?: string;
  subcategories?: string;
  /** Comma-separated product IDs or array; fetches only these products. */
  productIds?: string | string[];
};

export const useListProducts = (params: UseListProductsQuery = {}) => {
  const api = useApi();
  const { enabled = true, ...rest } = params;

  return useInfiniteQuery({
    queryKey: [...PRODUCTS_QUERY_KEY, "list", params],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get(`/products`, {
        params: {
          ...params,
          cursor: pageParam,
        },
      });
      return {
        products: data?.data?.products as ProductDetail[],
        nextPage: data?.pagination?.hasMore
          ? data?.pagination?.nextCursor
          : undefined,
      };
    },
    enabled,
    initialPageParam: undefined,
    getNextPageParam: ({ nextPage }) => {
      return nextPage;
    },
  });
};

export const useGetProduct = (id: string | null) => {
  const api = useApi();
  return useQuery<ResponseType & { data: { product: ProductDetail } }>({
    queryKey: [...PRODUCTS_QUERY_KEY, id],
    queryFn: async () => {
      const { data } = await api.get(`/products/${id}`);
      return data;
    },
    enabled: !!id && id !== "create",
  });
};

export const useGetProductBySlug = (slug: string | null) => {
  const api = useApi();
  return useQuery<ResponseType & { data: { product: ProductDetail } }>({
    queryKey: [...PRODUCTS_QUERY_KEY, "slug", slug],
    queryFn: async () => {
      const { data } = await api.get(
        `/products/slug/${encodeURIComponent(slug!)}`,
      );
      return data;
    },
    enabled: !!slug && slug !== "create",
  });
};

export const useCreateProduct = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateProductSchemaType) => {
      const { data } = await api.post("/products", payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "Product created");
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to create product");
    },
  });
};

export const useUpdateProduct = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateProductSchemaType;
    }) => {
      const { data } = await api.patch(`/products/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? "Product updated");
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Failed to update product");
    },
  });
};
