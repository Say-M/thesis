import { Blocklist } from "@repo/common/models/blocklist";
import { ResponseType } from "@repo/common/schemas/response";
import {
  CreateBlocklistSchemaType,
  ListBlocklistQuerySchemaType,
} from "@repo/common/schemas/blocklist";
import { QueryFilter } from "mongoose";

export const createBlocklistService = async (
  payload: CreateBlocklistSchemaType,
): Promise<ResponseType> => {
  const blocklist = await Blocklist.create(payload);
  return {
    message: "Blocklist created",
    status: 201,
    timestamp: new Date().toISOString(),
    data: { blocklist },
  };
};

export const getBlocklistByMobileService = async (
  mobile: string,
): Promise<ResponseType> => {
  const blocklist = await Blocklist.findOne({ mobile }).lean();
  if (!blocklist) {
    return {
      message: "Blocklist not found",
      status: 404,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    message: "Blocklist found",
    status: 200,
    timestamp: new Date().toISOString(),
    data: { blocklist },
  };
};

export const listBlocklistsService = async (
  query: ListBlocklistQuerySchemaType,
): Promise<ResponseType> => {
  const { limit = 24, cursor, search, ...rest } = query;
  const filter: QueryFilter<Blocklist> = { ...rest };
  if (cursor) filter._id = { $lt: cursor };
  if (search) {
    filter.$or = [{ mobile: { $regex: search, $options: "i" } }];
  }

  const items = await Blocklist.find(filter)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = items.length > limit;
  const blocklists = hasMore ? items.slice(0, -1) : items;
  const nextCursor =
    hasMore && blocklists.length > 0
      ? blocklists?.[blocklists.length - 1]?._id.toString()
      : undefined;

  return {
    status: 200,
    message: "OK",
    timestamp: new Date().toISOString(),
    data: { blocklists },
    pagination: {
      limit,
      hasMore,
      nextCursor,
    },
  };
};

export const deleteBlocklistService = async (
  id: string,
): Promise<ResponseType> => {
  const blocklist = await Blocklist.findByIdAndDelete(id).lean();
  if (!blocklist) {
    return {
      message: "Blocklist not found",
      status: 404,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    message: "Blocklist deleted",
    status: 200,
    timestamp: new Date().toISOString(),
    data: { blocklist },
  };
};
