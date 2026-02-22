import { HTTPException } from "hono/http-exception";
import { Category } from "@repo/common/models/category";
import type { ResponseType } from "@repo/common/schemas/response";
import type {
  CreateCategorySchemaType,
  ListCategoryQuerySchemaType,
  UpdateCategorySchemaType,
} from "@repo/common/schemas/category";
import { QueryFilter, QueryOptions } from "mongoose";

export const createCategoryService = async (
  payload: CreateCategorySchemaType,
): Promise<ResponseType> => {
  const existing = await Category.findOne({ name: payload.name });
  if (existing)
    throw new HTTPException(400, { message: "Category name already exists" });

  const filteredPayload = {
    ...payload,
    featured: payload.featured ?? false,
  };

  if (!filteredPayload.parentCategory) delete filteredPayload.parentCategory;

  const category = (
    await (
      await Category.create(filteredPayload)
    ).populate([
      { path: "thumbnail", select: "name path" },
      { path: "parentCategory", select: "name" },
    ])
  ).toObject();

  return {
    status: 201,
    message: "Category created",
    timestamp: new Date().toISOString(),
    data: { category },
  };
};

export const getCategoryByIdService = async (
  id: string,
): Promise<ResponseType> => {
  const category = await Category.findById(id)
    .populate([
      {
        path: "thumbnail",
        select: "name path",
      },
      {
        path: "parentCategory",
        select: "name",
      },
    ])
    .lean();
  if (!category)
    throw new HTTPException(404, { message: "Category not found" });

  return {
    status: 200,
    message: "OK",
    timestamp: new Date().toISOString(),
    data: { category },
  };
};

export const listCategoriesService = async (
  query: ListCategoryQuerySchemaType,
): Promise<ResponseType> => {
  const {
    limit = 24,
    cursor,
    type,
    status,
    featured,
    search,
    parentCategories,
    all,
    ...rest
  } = query;
  const filter: QueryFilter<Category> = { ...rest };
  if (cursor) filter._id = { $lt: cursor };
  if (status?.length) filter.status = { $in: status };
  if (featured != null) filter.featured = featured;
  if (type?.length === 1) {
    if (type[0] === "parent") filter.parentCategory = { $exists: false };
    else if (type[0] === "child") filter.parentCategory = { $exists: true };
  }
  if (parentCategories?.length)
    filter.parentCategory = { $in: parentCategories };
  if (search) filter.$or = [{ name: { $regex: search, $options: "i" } }];

  const options: QueryOptions<Category> = { sort: { _id: -1 } };
  if (!all) options.limit = limit + 1;

  const items = await Category.find(filter, {}, options)
    .populate([
      {
        path: "thumbnail",
        select: "name path",
      },
      {
        path: "parentCategory",
        select: "name",
      },
    ])
    .lean();

  const hasMore = !all && items.length > limit;
  const categories = hasMore ? items.slice(0, -1) : items;
  const nextCursor =
    !all && hasMore && categories.length > 0
      ? categories?.[categories.length - 1]?._id.toString()
      : undefined;

  return {
    status: 200,
    message: "OK",
    timestamp: new Date().toISOString(),
    data: { categories },
    pagination: {
      limit: all ? undefined : limit,
      hasMore,
      nextCursor,
    },
  };
};

export const updateCategoryService = async (
  id: string,
  payload: UpdateCategorySchemaType,
): Promise<ResponseType> => {
  const category = await Category.findById(id);
  if (!category)
    throw new HTTPException(404, { message: "Category not found" });

  if (payload.isDeleteThumbnail) payload.thumbnail = null;

  const updated = await Category.findByIdAndUpdate(id, payload, {
    new: true,
  })
    .populate([
      { path: "thumbnail", select: "name path" },
      { path: "parentCategory", select: "name" },
    ])
    .lean();

  return {
    status: 200,
    message: "Category updated",
    timestamp: new Date().toISOString(),
    data: { category: updated },
  };
};

export const deleteCategoryService = async (
  id: string,
): Promise<ResponseType> => {
  const deleted = await Category.findByIdAndDelete(id);
  if (!deleted) throw new HTTPException(404, { message: "Category not found" });

  return {
    status: 200,
    message: "Category deleted",
    timestamp: new Date().toISOString(),
  };
};
