import { HTTPException } from "hono/http-exception";
import { Banner } from "@repo/common/models/banner";
import type { ResponseType } from "@repo/common/schemas/response";
import type {
  CreateBannerSchemaType,
  UpdateBannerSchemaType,
  ListBannerQuerySchemaType,
} from "@repo/common/schemas/banner";
import { QueryFilter, QueryOptions } from "mongoose";

export const createBannerService = async (
  json: CreateBannerSchemaType,
): Promise<ResponseType> => {
  const banner = (
    await (await Banner.create(json)).populate("image")
  ).toObject();
  return {
    status: 201,
    message: "Banner created",
    timestamp: new Date().toISOString(),
    data: { banner },
  };
};

export const getBannerByIdService = async (
  id: string,
): Promise<ResponseType> => {
  const banner = await Banner.findById(id).populate("image").lean();
  if (!banner) throw new HTTPException(404, { message: "Banner not found" });

  return {
    status: 200,
    message: "OK",
    timestamp: new Date().toISOString(),
    data: { banner },
  };
};

export const listBannersService = async (
  query: ListBannerQuerySchemaType,
): Promise<ResponseType> => {
  const { limit = 24, cursor, search, all, status, ...rest } = query;
  const filter: QueryFilter<Banner> = { ...rest };
  if (cursor) filter._id = { $gt: cursor };
  if (status?.length) filter.status = { $in: status };
  if (search)
    filter.$or = [
      {
        title: { $regex: search, $options: "i" },
        description: { $regex: search, $options: "i" },
        link: { $regex: search, $options: "i" },
      },
    ];

  const options: QueryOptions<Banner> = {};

  if (all) {
    options.sort = { serial: 1 };
  } else {
    options.sort = { _id: -1 };
    options.limit = limit + 1;
  }

  const items = await Banner.find(filter, {}, options).populate("image").lean();

  const hasMore = !all && items.length > limit;
  const banners = hasMore ? items.slice(0, limit) : items;
  const nextCursor =
    !all && hasMore && banners.length > 0
      ? banners?.[banners.length - 1]?._id.toString()
      : undefined;

  return {
    status: 200,
    message: "OK",
    timestamp: new Date().toISOString(),
    data: { banners },
    pagination: {
      limit: all ? undefined : limit,
      hasMore,
      nextCursor,
    },
  };
};

export const updateBannerService = async (
  id: string,
  json: UpdateBannerSchemaType,
): Promise<ResponseType> => {
  const banner = await Banner.findByIdAndUpdate(
    id,
    { $set: json },
    { new: true },
  )
    .populate("image")
    .lean();
  if (!banner) throw new HTTPException(404, { message: "Banner not found" });

  return {
    status: 200,
    message: "Banner updated",
    timestamp: new Date().toISOString(),
    data: { banner },
  };
};

export const deleteBannerService = async (
  id: string,
): Promise<ResponseType> => {
  const deleted = await Banner.findByIdAndDelete(id);
  if (!deleted) throw new HTTPException(404, { message: "Banner not found" });

  return {
    status: 200,
    message: "Banner deleted",
    timestamp: new Date().toISOString(),
  };
};
