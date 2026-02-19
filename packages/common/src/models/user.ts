import { Schema, model, InferSchemaType, Types } from "mongoose";
import { Role } from "../enums/role";

export const addressSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const schema = new Schema(
  {
    email: {
      type: String,
      required: function (this: { email: string; mobile: string }) {
        return !this.email && !this.mobile;
      },
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    mobile: {
      type: String,
      required: function (this: { email: string; mobile: string }) {
        return !this.email && !this.mobile;
      },
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Role,
      default: Role.USER,
    },
    permissions: {
      type: Map,
      of: new Schema(
        {
          create: { type: Boolean, default: false },
          read: { type: Boolean, default: false },
          update: { type: Boolean, default: false },
          delete: { type: Boolean, default: false },
        },
        { _id: false },
      ),
    },
    status: {
      type: Boolean,
      default: true,
      index: true,
    },
    shippingAddress: { type: addressSchema },
    lastLogin: {
      type: Date,
      default: null,
    },
    lastPasswordChange: {
      type: Date,
      default: null,
    },
    lastPasswordReset: {
      type: Date,
      default: null,
    },
    lastPasswordResetRequest: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export const User = model("User", schema);
export type User = InferSchemaType<typeof schema> & {
  _id: Types.ObjectId;
};
