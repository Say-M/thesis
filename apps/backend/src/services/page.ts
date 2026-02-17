import { HTTPException } from "hono/http-exception";
import { Page } from "@repo/common/models/page";
import { Seo } from "@repo/common/models/seo";
import type { ResponseType } from "@repo/common/schemas/response";
import type {
  PageSchemaType,
  ListPageQuerySchemaType,
} from "@repo/common/schemas/page";
import { QueryFilter } from "mongoose";
import { QueryOptions } from "mongoose";

export const createPageService = async (
  json: PageSchemaType,
): Promise<ResponseType> => {
  const existing = await Page.findOne({ slug: json.slug });
  if (existing)
    throw new HTTPException(400, { message: "Page slug already exists" });

  const page = (await Page.create(json))?.toObject();
  return {
    status: 201,
    message: "Page created",
    timestamp: new Date().toISOString(),
    data: { page },
  };
};

export const getPageByIdService = async (id: string): Promise<ResponseType> => {
  const page = await Page.findById(id).populate("seo").lean();
  if (!page) throw new HTTPException(404, { message: "Page not found" });

  return {
    status: 200,
    message: "OK",
    timestamp: new Date().toISOString(),
    data: { page },
  };
};

export const getPageBySlugService = async (
  slug: string,
): Promise<ResponseType> => {
  const page = await Page.findOne({ slug: slug.toLowerCase(), status: true })
    .populate("seo")
    .lean();
  if (!page) throw new HTTPException(404, { message: "Page not found" });

  return {
    status: 200,
    message: "OK",
    timestamp: new Date().toISOString(),
    data: { page },
  };
};

export const listPagesService = async (
  query: ListPageQuerySchemaType,
): Promise<ResponseType> => {
  const {
    limit = 10,
    cursor,
    status,
    search,
    showInHeader,
    showInFooter,
    all,
  } = query;
  const filter: QueryFilter<Page> = {};
  if (cursor) filter._id = { $gt: cursor };
  if (status?.length) filter.status = { $in: status };
  if (showInHeader === true) filter.showInHeader = true;
  if (showInFooter === true) filter.showInFooter = true;
  if (search)
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } },
    ];

  const options: QueryOptions<Page> = {
    sort: { _id: -1, order: 1 },
  };

  if (!all) options.limit = limit + 1;

  const items = await Page.find(filter, {}, options).lean();

  const hasMore = items.length > limit;
  const pages = hasMore ? items.slice(0, limit) : items;
  const nextCursor =
    hasMore && pages.length > 0
      ? pages?.[pages.length - 1]?._id.toString()
      : undefined;

  return {
    status: 200,
    message: "OK",
    timestamp: new Date().toISOString(),
    data: { pages },
    pagination: {
      limit,
      hasMore,
      nextCursor,
    },
  };
};

export const updatePageService = async (
  id: string,
  json: PageSchemaType,
): Promise<ResponseType> => {
  const page = await Page.findByIdAndUpdate(id, { $set: json }, { new: true })
    .populate("seo")
    .lean();
  if (!page) throw new HTTPException(404, { message: "Page not found" });

  return {
    status: 200,
    message: "Page updated",
    timestamp: new Date().toISOString(),
    data: { page },
  };
};

export const deletePageService = async (id: string): Promise<ResponseType> => {
  const deleted = await Page.findByIdAndDelete(id);
  if (!deleted) throw new HTTPException(404, { message: "Page not found" });

  if (deleted.seo) await Seo.findByIdAndDelete(deleted.seo);

  return {
    status: 200,
    message: "Page deleted",
    timestamp: new Date().toISOString(),
  };
};
