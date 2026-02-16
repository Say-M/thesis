import mongoose, { Types } from "mongoose";
import { Config } from "@/models/config";
import type { ResponseType } from "@repo/common/schemas/response";
import type { UpdateConfigSchemaType } from "@/schemas/config";

const defaultConfig = {
  currency: "BDT",
  taxAmount: 0,
  shippingAmount: 0,
  siteName: undefined,
  siteDescription: undefined,
  siteLogo: undefined,
  siteFavicon: undefined,
  siteEmail: undefined,
  sitePhone: undefined,
  siteAddress: undefined,
  siteUrl: undefined,
  socials: undefined,
};

/** Get the single config document. Creates one with defaults if none exists. */
export const getConfigService = async (): Promise<ResponseType> => {
  let config = await Config.findOne()
    .populate([{ path: "siteLogo" }, { path: "siteFavicon" }])
    .lean();

  if (!config) {
    const [created] = await Config.create([defaultConfig]);
    config = (created != null ? created.toObject() : null) as typeof config;
  }

  const data = config
    ? {
        ...config,
        socials:
          config.socials instanceof Map
            ? Object.fromEntries(config.socials.entries())
            : (config.socials ?? undefined),
      }
    : null;

  return {
    status: 200,
    message: "OK",
    timestamp: new Date().toISOString(),
    data: { config: data },
  };
};

/** Update the single config document (upsert). */
export const updateConfigService = async (
  payload: UpdateConfigSchemaType,
): Promise<ResponseType> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const update: Record<string, unknown> = {};
    const set = (key: string, value: unknown) => {
      if (value !== undefined) update[key] = value;
    };
    set("currency", payload.currency);
    set("taxAmount", payload.taxAmount);
    set("shippingAmount", payload.shippingAmount);
    set("codAmount", payload.codAmount);
    set("siteName", payload.siteName);
    set("siteDescription", payload.siteDescription);
    set("siteEmail", payload.siteEmail);
    set("sitePhone", payload.sitePhone);
    set("siteAddress", payload.siteAddress);
    set("siteUrl", payload.siteUrl);
    if (payload.socials && typeof payload.socials === "object") {
      update.socials = payload.socials;
    }
    if (payload.siteLogo === "" || payload.siteLogo === null) {
      update.siteLogo = null;
    } else if (payload.siteLogo) {
      update.siteLogo = new Types.ObjectId(payload.siteLogo);
    }
    if (payload.siteFavicon === "" || payload.siteFavicon === null) {
      update.siteFavicon = null;
    } else if (payload.siteFavicon) {
      update.siteFavicon = new Types.ObjectId(payload.siteFavicon);
    }

    const config = await Config.findOneAndUpdate(
      {},
      { $set: update },
      { new: true, upsert: true, runValidators: true, session },
    )
      .lean()
      .session(session);

    await session.commitTransaction();

    const data = config
      ? {
          ...config,
          _id: config._id?.toString?.() ?? config._id,
          siteLogo: config.siteLogo?.toString?.() ?? config.siteLogo ?? null,
          siteFavicon:
            config.siteFavicon?.toString?.() ?? config.siteFavicon ?? null,
          socials:
            config.socials instanceof Map
              ? Object.fromEntries(config.socials.entries())
              : (config.socials ?? undefined),
        }
      : null;

    return {
      status: 200,
      message: "Config updated",
      timestamp: new Date().toISOString(),
      data: { config: data },
    };
  } finally {
    await session.endSession();
  }
};
