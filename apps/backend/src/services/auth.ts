import { User } from "@repo/common/models/user";
import {
  LoginSchemaType,
  RegisterSchemaType,
  UpdatePasswordSchemaType,
  UpdateProfileSchemaType,
} from "@repo/common/schemas/auth";
import { generateToken } from "@repo/common/utils/token";
import { HTTPException } from "hono/http-exception";
import { ResponseType } from "@repo/common/schemas/response";
import { deleteCookie, setCookie } from "hono/cookie";
import { Context } from "hono";
import { AppBindings } from "@/app";
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from "@repo/common/constants/token";
import { Role } from "@repo/common/enums/role";

export const registerService = async (
  c: Context<AppBindings>,
  json: RegisterSchemaType,
): Promise<ResponseType> => {
  const { email, mobile, password, name } = json;

  const isUserExists = await User.exists({ email });

  if (isUserExists) {
    throw new HTTPException(400, { message: "User already exists" });
  }

  const hashedPassword = await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });
  const isAnyUser = await User.findOne().lean();
  const role = isAnyUser ? Role.USER : Role.SUPER_ADMIN;
  const user = await User.create({ email, mobile, name, hashedPassword, role });

  const accessToken = await generateToken({
    payload: {
      userId: user._id,
    },
    algorithm: "EdDSA",
    expiresIn: ACCESS_TOKEN_MAX_AGE,
  });
  const refreshToken = await generateToken({
    payload: {
      userId: user._id,
    },
    algorithm: "EdDSA",
    expiresIn: REFRESH_TOKEN_MAX_AGE,
  });

  setCookie(c, "accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: ACCESS_TOKEN_MAX_AGE,
    sameSite: "strict",
    path: "/",
  });
  setCookie(c, "refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: REFRESH_TOKEN_MAX_AGE,
    sameSite: "strict",
    path: "/",
  });
  const { hashedPassword: _hashedPassword, ...userData } = user.toObject();
  return {
    status: 201,
    message: "User registered successfully",
    timestamp: new Date().toISOString(),
    data: {
      accessToken,
      refreshToken,
      user: userData,
    },
  };
};

export const loginService = async (
  c: Context<AppBindings>,
  json: LoginSchemaType,
): Promise<ResponseType> => {
  const { emailOrMobile, password } = json;
  const user = await User.findOne({
    $or: [{ email: emailOrMobile }, { mobile: emailOrMobile }],
  });

  if (!user) {
    throw new HTTPException(401, { message: "Invalid credentials" });
  }

  const isPasswordValid = await Bun.password.verify(
    password,
    user.hashedPassword,
    "bcrypt",
  );

  if (!isPasswordValid) {
    throw new HTTPException(401, { message: "Invalid credentials" });
  }

  const accessToken = await generateToken({
    payload: {
      userId: user._id,
    },
    algorithm: "EdDSA",
    expiresIn: ACCESS_TOKEN_MAX_AGE,
  });
  const refreshToken = await generateToken({
    payload: {
      userId: user._id,
    },
    algorithm: "EdDSA",
    expiresIn: REFRESH_TOKEN_MAX_AGE,
  });

  setCookie(c, "accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: ACCESS_TOKEN_MAX_AGE,
    sameSite: "strict",
    path: "/",
  });
  setCookie(c, "refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: REFRESH_TOKEN_MAX_AGE,
    sameSite: "strict",
    path: "/",
  });

  const { hashedPassword, ...userData } = user.toObject();
  return {
    status: 200,
    message: "Login successful",
    timestamp: new Date().toISOString(),
    data: {
      accessToken,
      refreshToken,
      user: userData,
    },
  };
};

export const profileUserService = async (
  c: Context<AppBindings>,
): Promise<ResponseType> => {
  const user = c.var.user;

  return {
    status: 200,
    message: "User verified successfully",
    timestamp: new Date().toISOString(),
    data: { user },
  };
};

export const updateProfileService = async (
  user: User | null | undefined,
  json: UpdateProfileSchemaType,
): Promise<ResponseType> => {
  const updatedUser = await User.findByIdAndUpdate(user?._id, json, {
    new: true,
  }).lean();

  if (!updatedUser) {
    throw new HTTPException(404, { message: "User not found" });
  }
  return {
    status: 200,
    message: "Profile updated successfully",
    timestamp: new Date().toISOString(),
    data: { user: updatedUser },
  };
};

export const updatePasswordService = async (
  user: User | null | undefined,
  json: UpdatePasswordSchemaType,
): Promise<ResponseType> => {
  const dbUser = await User.findById(user?._id);
  if (!dbUser) throw new HTTPException(404, { message: "User not found" });

  const isPasswordValid = await Bun.password.verify(
    json.currentPassword,
    dbUser.hashedPassword,
    "bcrypt",
  );

  if (!isPasswordValid) {
    throw new HTTPException(401, { message: "Invalid current password" });
  }

  const hashedNewPassword = await Bun.password.hash(json.newPassword, {
    algorithm: "bcrypt",
    cost: 10,
  });

  dbUser.hashedPassword = hashedNewPassword;
  await dbUser.save();

  const { hashedPassword, ...userData } = dbUser.toObject();

  return {
    status: 200,
    message: "Password updated successfully",
    timestamp: new Date().toISOString(),
    data: { user: userData },
  };
};

export const refreshTokenService = async (
  c: Context<AppBindings>,
): Promise<ResponseType> => {
  const user = c.var.user!;

  const accessToken = await generateToken({
    payload: {
      userId: user._id,
    },
    algorithm: "EdDSA",
    expiresIn: ACCESS_TOKEN_MAX_AGE,
  });
  const refreshToken = await generateToken({
    payload: {
      userId: user._id,
    },
    algorithm: "EdDSA",
    expiresIn: REFRESH_TOKEN_MAX_AGE,
  });

  setCookie(c, "accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: ACCESS_TOKEN_MAX_AGE,
    sameSite: "strict",
    path: "/",
  });
  setCookie(c, "refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: REFRESH_TOKEN_MAX_AGE,
    sameSite: "strict",
    path: "/",
  });
  return {
    status: 200,
    message: "Token refreshed successfully",
    timestamp: new Date().toISOString(),
    data: { accessToken, refreshToken },
  };
};

export const logoutService = async (
  c: Context<AppBindings>,
): Promise<ResponseType> => {
  deleteCookie(c, "accessToken");
  deleteCookie(c, "refreshToken");
  return {
    status: 200,
    message: "Logout successful",
    timestamp: new Date().toISOString(),
  };
};

export const heavyOperationService = async (
  c: Context<AppBindings>,
): Promise<ResponseType> => {
  for (let i = 0; i < 1e10; i++) {}
  return {
    status: 200,
    message: "Heavy operation completed",
    timestamp: new Date().toISOString(),
  };
};

export const publicService = async (
  c: Context<AppBindings>,
): Promise<ResponseType> => {
  return {
    status: 200,
    message: "Public service",
    timestamp: new Date().toISOString(),
  };
};
