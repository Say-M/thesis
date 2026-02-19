import { z } from "zod";

export const addressSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .nonempty({ error: "Name is required" }),
  email: z.email({ error: "Invalid email address" }).trim().nullish(),
  phone: z
    .string({ error: "Phone is required" })
    .trim()
    .nonempty({ error: "Phone is required" }),
  address: z
    .string({ error: "Address is required" })
    .trim()
    .nonempty({ error: "Address is required" }),
  city: z
    .string({ error: "City is required" })
    .trim()
    .nonempty({ error: "City is required" }),
  state: z
    .string({ error: "State is required" })
    .trim()
    .nonempty({ error: "State is required" }),
  postalCode: z
    .string({ error: "Postal code is required" })
    .trim()
    .nonempty({ error: "Postal code is required" }),
});

export const loginSchema = z.object({
  emailOrMobile: z
    .string({ error: "Email or mobile number is required" })
    .min(1, {
      error: "Email or mobile number is required",
    }),
  password: z.string({ error: "Password is required" }).min(6, {
    error: "Password must be at least 6 characters long",
  }),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;

const schema = z.object({
  name: z.string({ error: "Name is required" }).min(2, {
    error: "Name must be at least 2 characters long",
  }),
  email: z
    .union([
      z.string().length(0, { message: "Invalid email address" }),
      z.email({ error: "Invalid email address" }),
    ])
    .optional(),
  mobile: z
    .union([
      z.string().length(0, { message: "Invalid mobile number" }),
      z.string().length(11, {
        error: "Mobile number must be 11 characters long",
      }),
    ])
    .optional(),
  password: z.string({ error: "Password is required" }).min(6, {
    error: "Password must be at least 6 characters long",
  }),
  confirmPassword: z.string({ error: "Confirm password is required" }).min(6, {
    error: "Confirm password must be at least 6 characters long",
  }),
});

export const registerSchema = schema
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
  .superRefine((data, ctx) => {
    if (!data.email && !data.mobile) {
      ctx.addIssue({
        code: "custom",
        message: "Email or mobile number is required",
        path: ["email"],
      });
      ctx.addIssue({
        code: "custom",
        message: "Email or mobile number is required",
        path: ["mobile"],
      });
    }
  });

export type RegisterSchemaType = z.infer<typeof registerSchema>;

export const updateProfileSchema = schema
  .omit({ email: true, mobile: true, password: true, confirmPassword: true })
  .extend({
    shippingAddress: addressSchema.partial(),
  });

export type UpdateProfileSchemaType = z.infer<typeof updateProfileSchema>;

export const updatePasswordSchema = z
  .object({
    currentPassword: z
      .string({ error: "Current password is required" })
      .min(6, {
        error: "Current password must be at least 6 characters long",
      }),
    newPassword: z.string({ error: "New password is required" }).min(6, {
      error: "New password must be at least 6 characters long",
    }),
    confirmNewPassword: z
      .string({ error: "Confirm new password is required" })
      .min(6, {
        error: "Confirm new password must be at least 6 characters long",
      }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "New passwords do not match",
  });

export type UpdatePasswordSchemaType = z.infer<typeof updatePasswordSchema>;
