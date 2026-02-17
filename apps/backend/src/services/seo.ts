import { HTTPException } from "hono/http-exception";
import { Seo } from "@repo/common/models/seo";
import type { ResponseType } from "@repo/common/schemas/response";
import type { CreateOrUpdateSeoSchemaType } from "@repo/common/schemas/seo";
import { Category } from "@repo/common/models/category";
import { Product } from "@repo/common/models/product";
import { Page } from "@repo/common/models/page";
import mongoose from "mongoose";

export const createOrUpdateSeoService = async (
  json: CreateOrUpdateSeoSchemaType,
): Promise<ResponseType> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { type, id, ...rest } = json;

    let category: InstanceType<typeof Category> | null = null;
    let product: InstanceType<typeof Product> | null = null;
    let page: InstanceType<typeof Page> | null = null;
    let seoId;

    if (type === "category" && id) {
      category = await Category.findById(id).select("seo").session(session);
      if (!category)
        throw new HTTPException(404, { message: "Category not found" });
      seoId = category.seo;
    } else if (type === "product" && id) {
      product = await Product.findById(id).select("seo").session(session);
      if (!product)
        throw new HTTPException(404, { message: "Product not found" });
      seoId = product.seo;
    } else if (type === "page" && id) {
      page = await Page.findById(id).select("seo").session(session);
      if (!page) throw new HTTPException(404, { message: "Page not found" });
      seoId = page.seo;
    }
    let seo;

    if (rest.deleteOgImage) rest.ogImage = null;
    if (rest.deleteTwitterImage) rest.twitterImage = null;

    if (seoId) {
      seo = await Seo.findByIdAndUpdate(seoId, rest, {
        new: true,
        upsert: true,
        session,
      }).populate([
        { path: "ogImage", select: "name path" },
        { path: "twitterImage", select: "name path" },
      ]);
    } else {
      const filteredRest = Object.fromEntries(
        Object.entries(rest).filter(([_, value]) => value !== null),
      );
      seo = await (
        await Seo.create([filteredRest], { session })
      )?.[0]?.populate([
        { path: "ogImage", select: "name path" },
        { path: "twitterImage", select: "name path" },
      ]);
    }

    if (!seo)
      throw new HTTPException(500, {
        message: "Failed to create or update seo",
      });

    if (type === "category" && category) {
      category.seo = seo?._id;
      await category.save({ session });
    } else if (type === "product" && product) {
      product.seo = seo._id;
      await product.save({ session });
    } else if (type === "page" && page) {
      page.seo = seo._id;
      await page.save({ session });
    }

    await session.commitTransaction();
    return {
      status: 200,
      message: "Seo saved",
      timestamp: new Date().toISOString(),
      data: { seo },
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export const getSeoByTypeIdService = async (
  id: string,
  type?: string,
): Promise<ResponseType> => {
  let seoId;
  if (type === "category") {
    const category = await Category.findById(id).select("seo").lean();
    if (!category)
      throw new HTTPException(404, { message: "Category not found" });
    seoId = category.seo;
  } else if (type === "product") {
    const product = await Product.findById(id).select("seo").lean();
    if (!product)
      throw new HTTPException(404, { message: "Product not found" });
    seoId = product.seo;
  } else if (type === "page") {
    const page = await Page.findById(id).select("seo").lean();
    if (!page) throw new HTTPException(404, { message: "Page not found" });
    seoId = page.seo;
  }

  let seo;

  if (seoId)
    await Seo.findById(seoId)
      .populate([
        { path: "ogImage", select: "name path" },
        { path: "twitterImage", select: "name path" },
      ])
      .lean();

  return {
    status: 200,
    message: "OK",
    timestamp: new Date().toISOString(),
    data: { seo },
  };
};

export const deleteSeoService = async (id: string): Promise<ResponseType> => {
  const deleted = await Seo.findByIdAndDelete(id);
  if (!deleted) throw new HTTPException(404, { message: "Seo not found" });

  return {
    status: 200,
    message: "Seo deleted",
    timestamp: new Date().toISOString(),
  };
};
