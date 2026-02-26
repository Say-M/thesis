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
} from "@repo/common/schemas/product";
import type { Product } from "@repo/common/models/product";
import { ResponseType } from "@repo/common/schemas/response";
import { DiscountType } from "@repo/common/enums/discount";
import { roundTo2 } from "@repo/common/utils/round-to-2";

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
  discountAmount: number;
  stock: number;
  variantId?: string;
} {
  const useFirstVariant = p.hasVariants && p.variants && p.variants.length > 0;
  const v = useFirstVariant ? p.variants![0] : null;

  const sellingPrice = v ? (v.sellingPrice ?? 0) : (p.sellingPrice ?? 0);
  const discountValue = v ? (v.discountValue ?? 0) : (p.discountValue ?? 0);
  const discountType = v ? v.discountType : p.discountType;
  let discountAmount = 0;
  if (discountValue > 0) {
    if (discountType === DiscountType.PERCENTAGE) {
      discountAmount = (sellingPrice * discountValue) / 100;
    } else {
      discountAmount = discountValue;
    }
  }
  discountAmount = roundTo2(discountAmount);

  const stock = v ? (v.stock ?? 0) : (p.stock ?? 0);

  const oldPrice = discountAmount ? roundTo2(sellingPrice) : null;
  const price = roundTo2(sellingPrice - discountAmount);

  return { price, oldPrice, discountAmount, stock, variantId: v?._id };
}

/** Get unit price and stock for a product line, optionally for a specific variant. */
export function productListItemUnitPriceAndStock(
  p: ProductDetail,
  variantId?: string,
): { unitPrice: number; unitOldPrice: number | null; stock: number } {
  if (variantId && p.variants?.length) {
    const v = p.variants.find((x) => x._id === variantId);
    if (v) {
      const { price, stock, oldPrice } = productListItemToCardProps({
        ...p,
        variants: [v],
      });

      return { unitPrice: price, unitOldPrice: oldPrice, stock };
    }
  }
  const { price, stock, oldPrice } = productListItemToCardProps(p);
  return { unitPrice: price, unitOldPrice: oldPrice, stock };
}

export type UseListProductsQuery = Partial<
  Omit<
    ListProductQuerySchemaType,
    | "status"
    | "isFreeShipping"
    | "featured"
    | "categories"
    | "subcategories"
    | "productIds"
  >
> & {
  limit?: number;
  cursor?: string;
  /** When false, the query is disabled (e.g. when dependent IDs are empty). */
  enabled?: boolean;
  status?: string;
  isFreeShipping?: string;
  featured?: string;
  categories?: string;
  subcategories?: string;
  productIds?: string;
};

export const useListProducts = (params: UseListProductsQuery = {}) => {
  const api = useApi();
  const { enabled = true, ...rest } = params;

  return useInfiniteQuery({
    queryKey: [...PRODUCTS_QUERY_KEY, "list", params],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get(`/products`, {
        params: {
          ...rest,
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
