import { HTTPException } from "hono/http-exception";
import { Asset, AssetProvider } from "@repo/common/models/asset";
import type { ResponseType } from "@repo/common/schemas/response";
import type {
  CreateAssetSchemaType,
  CreateBulkAssetSchemaType,
  ListAssetQuerySchemaType,
} from "@repo/common/schemas/asset";
import mongoose, { QueryFilter } from "mongoose";
import { User } from "@repo/common/models/user";
import { imagekit } from "@repo/common/utils/imagekit";

export const createAssetService = async (
  user: User,
  payload: CreateAssetSchemaType,
): Promise<ResponseType> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { file, name, tags } = payload;
    const uploadedFile = await imagekit.files.upload({
      file: file,
      fileName: file.name,
      folder: `/${process.env.IMAGEKIT_FOLDER_NAME}/assets`,
      tags: tags ?? [],
    });
    const asset = (
      await Asset.create(
        [
          {
            name: name ?? file.name,
            path: uploadedFile.url!,
            mimetype: file.type,
            size: file.size,
            tags: tags ?? [],
            provider: AssetProvider.IMAGEKIT,
            providedId: uploadedFile.fileId!,
            user: user._id,
          },
        ],
        { session },
      )
    )?.[0]?.toObject();

    await session.commitTransaction();
    return {
      status: 201,
      message: "Asset created",
      timestamp: new Date().toISOString(),
      data: { asset },
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export const createBulkAssetsService = async (
  user: User,
  payload: CreateBulkAssetSchemaType,
): Promise<ResponseType> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { files } = payload;

    let assets: (Omit<Asset, "_id" | "createdAt" | "updatedAt"> & {
      providedId: string;
    })[] = [];
    for (const file of Array.isArray(files) ? files : [files]) {
      const uploadedFile = await imagekit.files.upload({
        file: file,
        fileName: file.name,
        folder: `/${process.env.IMAGEKIT_FOLDER_NAME}/assets`,
      });
      if (!uploadedFile) continue;
      assets.push({
        name: file.name,
        mimetype: file.type,
        size: file.size,
        provider: AssetProvider.IMAGEKIT,
        path: uploadedFile.url!,
        user: user._id,
        providedId: uploadedFile.fileId!,
      });
    }

    const createdAssets = await Asset.create(assets, {
      session,
      ordered: true,
    });
    await session.commitTransaction();
    return {
      status: 201,
      message: "Assets created",
      timestamp: new Date().toISOString(),
      data: { assets: createdAssets },
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export const getAssetByIdService = async (
  id: string,
): Promise<ResponseType> => {
  const asset = await Asset.findById(id).lean();
  if (!asset) throw new HTTPException(404, { message: "Asset not found" });

  return {
    status: 200,
    message: "OK",
    timestamp: new Date().toISOString(),
    data: asset,
  };
};

export const listAssetsService = async (
  query: ListAssetQuerySchemaType,
): Promise<ResponseType> => {
  const { limit = 24, cursor, search, ...rest } = query;
  const filter: QueryFilter<Asset> = { ...rest };
  if (cursor) filter._id = { $lt: cursor };
  if (search) {
    filter.$or = [{ name: { $regex: search, $options: "i" } }];
  }

  const items = await Asset.find(filter)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();

  console.log({ items: (await Asset.find(filter))?.length, limit });

  const hasMore = items.length > limit;
  const assets = hasMore ? items.slice(0, -1) : items;
  const nextCursor =
    hasMore && assets.length > 0
      ? assets?.[assets.length - 1]?._id.toString()
      : undefined;

  return {
    status: 200,
    message: "OK",
    timestamp: new Date().toISOString(),
    data: { assets },
    pagination: {
      limit,
      hasMore,
      nextCursor,
    },
  };
};

export const deleteAssetService = async (id: string): Promise<ResponseType> => {
  const asset = await Asset.findById(id);
  if (!asset) throw new HTTPException(404, { message: "Asset not found" });

  if (asset.provider === AssetProvider.IMAGEKIT)
    imagekit.files.delete(asset.providedId!).catch((error) => {
      console.error(error);
    });

  await asset.deleteOne();

  return {
    status: 200,
    message: "Asset deleted",
    timestamp: new Date().toISOString(),
  };
};
