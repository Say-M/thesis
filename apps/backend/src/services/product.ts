import { HTTPException } from "hono/http-exception";
import { Product } from "@repo/common/models/product";
import type { ResponseType } from "@repo/common/schemas/response";
import type {
  CreateProductSchemaType,
  ListProductQuerySchemaType,
  UpdateProductSchemaType,
} from "@repo/common/schemas/product";
import { QueryFilter, ProjectionType, QueryOptions } from "mongoose";
import { User } from "@repo/common/models/user";
import { Role } from "@repo/common/enums/role";

export const createProductService = async (
  payload: CreateProductSchemaType,
): Promise<ResponseType> => {
  console.log({ payload });

  const existing = await Product.findOne({ slug: payload.slug });
  if (existing)
    throw new HTTPException(400, { message: "Product slug already exists" });

  const createPayload: Partial<CreateProductSchemaType> = { ...payload };

  if (createPayload.hasVariants) {
    delete createPayload.stock;
    delete createPayload.buyingPrice;
    delete createPayload.sellingPrice;
    delete createPayload.discountType;
    delete createPayload.discountValue;
    delete createPayload.sku;
  } else {
    delete createPayload.variants;
  }

  const product = (
    await Product.create(createPayload as unknown as Product)
  )?.toObject();
  return {
    status: 201,
    message: "Product created",
    timestamp: new Date().toISOString(),
    data: { product },
  };
};

export const getProductByIdService = async (
  user: User | null | undefined,
  id: string,
): Promise<ResponseType> => {
  const select: ProjectionType<Product> = {};
  if (user?.role === Role.USER) {
    select.buyingPrice = 0;
    select["variants.buyingPrice"] = 0;
  }
  const product = await Product.findById(id, select).populate([
    { path: "seo" },
    { path: "thumbnail", select: "name path" },
    { path: "images", select: "name path" },
    { path: "variants.images", select: "name path" },
    { path: "category", select: "name" },
    { path: "subcategory", select: "name" },
  ]);

  if (!product) throw new HTTPException(404, { message: "Product not found" });

  return {
    status: 200,
    message: "OK",
    timestamp: new Date().toISOString(),
    data: { product },
  };
};

export const getProductBySlugService = async (
  user: User | null | undefined,
  slug: string,
): Promise<ResponseType> => {
  const select: ProjectionType<Product> = {};
  if (user?.role === Role.USER) {
    select.buyingPrice = 0;
    select["variants.buyingPrice"] = 0;
  }

  const product = await Product.findOne(
    { slug: slug.toLowerCase() },
    select,
  ).populate([
    { path: "seo" },
    { path: "thumbnail", select: "name path" },
    { path: "images", select: "name path" },
    { path: "variants.images", select: "name path" },
    { path: "category", select: "name" },
    { path: "subcategory", select: "name" },
  ]);
  if (!product) throw new HTTPException(404, { message: "Product not found" });

  return {
    status: 200,
    message: "OK",
    timestamp: new Date().toISOString(),
    data: { product },
  };
};

export const listProductsService = async (
  user: User | null | undefined,
  query: ListProductQuerySchemaType,
): Promise<ResponseType> => {
  const {
    limit = 10,
    cursor,
    status,
    featured,
    hasVariants,
    categories,
    subcategories,
    search,
    productIds,
    ...rest
  } = query;
  const filter: QueryFilter<Product> = { ...rest };
  if (cursor) filter._id = { $gt: cursor };
  if (status && status?.length) filter.status = { $in: status };
  if (featured != null) filter.featured = featured;
  if (hasVariants && hasVariants?.length) filter.hasVariants = { $in: hasVariants };
  if (categories && categories?.length) filter.category = { $in: categories };
  if (subcategories && subcategories?.length) filter.subcategory = { $in: subcategories };
  if (productIds && productIds?.length) filter._id = { $in: productIds };
  if (search)
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { "variants.name": { $regex: search, $options: "i" } },
    ];

  const select: ProjectionType<Product> = {};

  if (user?.role === Role.USER) {
    select.buyingPrice = 0;
    select["variants.buyingPrice"] = 0;
  }

  const options: QueryOptions<Product> = { sort: { _id: -1 } };

  if (!productIds?.length) options.limit = limit + 1;

  const items = await Product.find(filter, select, options)
    .populate([
      { path: "thumbnail", select: "name path" },
      { path: "images", select: "name path" },
      { path: "category", select: "name" },
      { path: "subcategory", select: "name" },
    ])
    .lean();

  const hasMore = items.length > limit;
  const products = hasMore ? items.slice(0, limit) : items;
  const nextCursor =
    !productIds?.length && hasMore && products.length > 0
      ? products?.[products.length - 1]?._id.toString()
      : undefined;

  return {
    status: 200,
    message: "OK",
    timestamp: new Date().toISOString(),
    data: { products },
    pagination: {
      limit: productIds?.length ? undefined : limit,
      hasMore,
      nextCursor,
    },
  };
};

export const updateProductService = async (
  id: string,
  payload: UpdateProductSchemaType,
): Promise<ResponseType> => {
  const product = await Product.findById(id);
  if (!product) throw new HTTPException(404, { message: "Product not found" });

  const { isDeleteThumbnail, deleteImages, variants } = payload;

  if (isDeleteThumbnail) payload.thumbnail = null;

  const images = new Set(product?.images?.map((image) => image?.toString()));

  for (const image of deleteImages || []) {
    images.delete(image);
  }

  if (payload?.images?.length) {
    for (const image of payload.images) {
      images.add(image);
    }
  }

  if (!payload.variants?.length) payload.variants = [];

  let i = 0;
  for (const variant of variants || []) {
    const images = new Set(
      product?.variants?.[i]?.images?.map((image) => image?.toString()),
    );

    for (const image of variant.deleteImages || []) {
      images.delete(image);
    }

    if (variant.images?.length) {
      for (const image of variant.images) {
        images.add(image);
      }
    }

    payload.variants![i]!.images = Array.from(images);
    i++;
  }

  if (payload.hasVariants) {
    payload.stock = null;
    payload.buyingPrice = null;
    payload.sellingPrice = null;
    payload.discountType = null;
    payload.discountValue = null;
    payload.sku = null;
  }
  if (payload?.hasVariants === false) {
    payload.variants = [];
  }

  payload.images = Array.from(images);

  const updated = await Product.findByIdAndUpdate(id, payload, { new: true })
    .populate([
      { path: "seo" },
      { path: "thumbnail", select: "name path" },
      { path: "images", select: "name path" },
      { path: "category", select: "name" },
      { path: "subcategory", select: "name" },
    ])
    .lean();

  return {
    status: 200,
    message: "Product updated",
    timestamp: new Date().toISOString(),
    data: { product: updated },
  };
};

export const deleteProductService = async (
  id: string,
): Promise<ResponseType> => {
  const deleted = await Product.findByIdAndDelete(id);
  if (!deleted) throw new HTTPException(404, { message: "Product not found" });

  return {
    status: 200,
    message: "Product deleted",
    timestamp: new Date().toISOString(),
  };
};
