import { HTTPException } from "hono/http-exception";
import { User } from "@repo/common/models/user";
import type { ResponseType } from "@repo/common/schemas/response";
import type {
  ListUserQuerySchemaType,
  UpdateUserSchemaType,
} from "@repo/common/schemas/user";
import type { QueryFilter } from "mongoose";
import type { User as UserType } from "@repo/common/models/user";
import { Role } from "@repo/common/enums/role";

const userProjection = { hashedPassword: 0 };

export const listUsersService = async (
  query: ListUserQuerySchemaType,
): Promise<ResponseType> => {
  const { limit = 10, cursor, status, search, role, ...rest } = query;
  const filter: QueryFilter<UserType> = { ...rest };
  if (cursor) filter._id = { $gt: cursor };
  if (status?.length) filter.status = { $in: status };
  if (role?.length) filter.role = { $in: role };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
    ];
  }

  const items = await User.find(filter)
    .select(userProjection)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = items.length > limit;
  const users = hasMore ? items.slice(0, limit) : items;
  const nextCursor =
    hasMore && users.length > 0
      ? (users[users.length - 1] as { _id: unknown })?._id?.toString()
      : undefined;

  return {
    status: 200,
    message: "OK",
    timestamp: new Date().toISOString(),
    data: { users },
    pagination: {
      limit,
      hasMore,
      nextCursor,
    },
  };
};

export const getUserByIdService = async (id: string): Promise<ResponseType> => {
  const user = await User.findById(id).select(userProjection).lean();
  if (!user) throw new HTTPException(404, { message: "User not found" });

  return {
    status: 200,
    message: "OK",
    timestamp: new Date().toISOString(),
    data: { user },
  };
};

export const updateUserService = async (
  user: User | null | undefined,
  id: string,
  payload: UpdateUserSchemaType,
): Promise<ResponseType> => {
  const dbUser = await User.findById(id);
  if (!dbUser) throw new HTTPException(404, { message: "dbUser not found" });

  if (dbUser.role === Role.SUPER_ADMIN && user?.role !== Role.SUPER_ADMIN) {
    throw new HTTPException(403, {
      message: "You are not authorized to update this user",
    });
  }
  if (
    dbUser.role === Role.ADMIN &&
    ![Role.SUPER_ADMIN, Role.ADMIN].includes(user?.role || Role.USER)
  ) {
    throw new HTTPException(403, {
      message: "You are not authorized to update this user",
    });
  }

  if (dbUser.role === Role.SUPER_ADMIN) {
    delete payload.role;
    delete payload.status;
    delete payload.permissions;
  }

  let hashedPassword;
  if (payload.password) {
    hashedPassword = await Bun.password.hash(payload.password, {
      algorithm: "bcrypt",
      cost: 10,
    });
  }

  const safeUser = await User.findByIdAndUpdate(
    id,
    { ...payload, ...(hashedPassword && { hashedPassword }) },
    { new: true },
  )
    .select(userProjection)
    .lean();

  return {
    status: 200,
    message: "User updated",
    timestamp: new Date().toISOString(),
    data: { user: safeUser },
  };
};

export const deleteUserService = async (
  user: User | null | undefined,
  id: string,
): Promise<ResponseType> => {
  const dbUser = await User.findById(id);
  if (!dbUser) throw new HTTPException(404, { message: "User not found" });

  if (dbUser.role === Role.SUPER_ADMIN) {
    throw new HTTPException(403, {
      message: "You are not authorized to delete this user",
    });
  }

  if (dbUser._id.equals(user?._id)) {
    throw new HTTPException(403, {
      message: "You are not authorized to delete yourself",
    });
  }

  await User.findByIdAndDelete(id);

  return {
    status: 200,
    message: "User deleted",
    timestamp: new Date().toISOString(),
  };
};
