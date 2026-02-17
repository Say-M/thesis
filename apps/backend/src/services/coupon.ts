import { HTTPException } from "hono/http-exception";
import { Coupon } from "@repo/common/models/coupon";
import type { ResponseType } from "@repo/common/schemas/response";
import type {
  CreateCouponSchemaType,
  UpdateCouponSchemaType,
  ListCouponQuerySchemaType,
} from "@repo/common/schemas/coupon";
import { QueryFilter } from "mongoose";
import { User } from "@repo/common/models/user";
import { Invoice } from "@repo/common/models/invoice";

export const createCouponService = async (
  json: CreateCouponSchemaType,
): Promise<ResponseType> => {
  const existing = await Coupon.findOne({ code: json.code });
  if (existing)
    throw new HTTPException(400, { message: "Coupon code already exists" });

  const coupon = (await Coupon.create(json as unknown as Coupon))?.toObject();
  return {
    status: 201,
    message: "Coupon created",
    timestamp: new Date().toISOString(),
    data: { coupon },
  };
};

export const getCouponByIdService = async (
  id: string,
): Promise<ResponseType> => {
  const coupon = await Coupon.findById(id).lean();
  if (!coupon) throw new HTTPException(404, { message: "Coupon not found" });

  return {
    status: 200,
    message: "OK",
    timestamp: new Date().toISOString(),
    data: { coupon },
  };
};

export const getCouponByCodeService = async (
  code: string,
  user: User | null | undefined,
  cartTotal: number | null | undefined,
): Promise<ResponseType> => {
  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    status: true,
  }).lean();
  if (!coupon) throw new HTTPException(404, { message: "Coupon not found" });

  let isValid = true;
  let isFreeShipping = false;

  if (!cartTotal) cartTotal = 0;

  // Check per-user limit
  if (!user && coupon.perUserLimit !== -1) {
    isValid = false;
    return {
      status: 400,
      message: "User authentication required for this coupon",
      timestamp: new Date().toISOString(),
      data: { isValid },
    };
  }

  const currentDate = new Date();
  if (coupon.validFrom && coupon.validFrom > currentDate) {
    isValid = false;
    return {
      status: 400,
      message: "Coupon is not valid yet",
      timestamp: new Date().toISOString(),
      data: { isValid },
    };
  }
  if (coupon.validTo && coupon.validTo < currentDate) {
    isValid = false;
    return {
      status: 400,
      message: "Coupon is expired",
      timestamp: new Date().toISOString(),
      data: { isValid },
    };
  }

  // Check minimum purchase requirement
  if (
    cartTotal !== undefined &&
    coupon.minPurchase > 0 &&
    cartTotal < coupon.minPurchase
  ) {
    isValid = false;
    return {
      status: 400,
      message: `Minimum purchase of ${coupon.minPurchase} required for this coupon`,
      timestamp: new Date().toISOString(),
      data: { isValid },
    };
  }

  if (user) {
    const userUsedCount = await Invoice.countDocuments({
      "customer.user": user._id,
      coupon: coupon._id,
    });
    if (coupon.perUserLimit !== -1 && userUsedCount >= coupon.perUserLimit) {
      isValid = false;
      return {
        status: 400,
        message: "You have reached the usage limit for this coupon",
        timestamp: new Date().toISOString(),
        data: { isValid },
      };
    }
  }

  // Check global usage limit
  if (coupon.usageLimit !== -1 && coupon.usedCount >= coupon.usageLimit) {
    isValid = false;
    return {
      status: 400,
      message: "This coupon has reached its usage limit",
      timestamp: new Date().toISOString(),
      data: { isValid },
    };
  }

  if (coupon.freeShipping) isFreeShipping = true;

  return {
    status: 200,
    message: "OK",
    timestamp: new Date().toISOString(),
    data: {
      isValid,
      coupon: {
        _id: coupon._id,
        isFreeShipping,
        code: coupon.code,
        discountType: coupon.discountType,
        value: coupon.value,
        minPurchase: coupon.minPurchase,
        maxDiscount: coupon.maxDiscount,
        description: coupon.description,
      },
    },
  };
};

export const listCouponsService = async (
  query: ListCouponQuerySchemaType,
): Promise<ResponseType> => {
  const { limit = 24, cursor, status, search, ...rest } = query;
  const filter: QueryFilter<Coupon> = { ...rest };
  if (cursor) filter._id = { $gt: cursor };
  if (status?.length) filter.status = { $in: status };
  if (search)
    filter.$or = [
      { code: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];

  const items = await Coupon.find(filter)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = items.length > limit;
  const coupons = hasMore ? items.slice(0, limit) : items;
  const nextCursor =
    hasMore && coupons.length > 0
      ? coupons?.[coupons.length - 1]?._id.toString()
      : undefined;

  return {
    status: 200,
    message: "OK",
    timestamp: new Date().toISOString(),
    data: { coupons },
    pagination: {
      limit,
      hasMore,
      nextCursor,
    },
  };
};

export const updateCouponService = async (
  id: string,
  json: UpdateCouponSchemaType,
): Promise<ResponseType> => {
  console.log({ json });

  const coupon = await Coupon.findByIdAndUpdate(
    id,
    { $set: json },
    { new: true },
  ).lean();
  if (!coupon) throw new HTTPException(404, { message: "Coupon not found" });

  return {
    status: 200,
    message: "Coupon updated",
    timestamp: new Date().toISOString(),
    data: { coupon },
  };
};

export const deleteCouponService = async (
  id: string,
): Promise<ResponseType> => {
  const deleted = await Coupon.findByIdAndDelete(id);
  if (!deleted) throw new HTTPException(404, { message: "Coupon not found" });

  return {
    status: 200,
    message: "Coupon deleted",
    timestamp: new Date().toISOString(),
  };
};
