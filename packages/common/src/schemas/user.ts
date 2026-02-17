import { z } from "zod";
import { cursorPaginationQuerySchema } from "./common";
import { Role } from "../enums/role";

export const listUserQuerySchema = cursorPaginationQuerySchema.extend({
  search: z.string().trim().nullish(),
  status: z
    .string()
    .nullish()
    .transform((val) => val?.split(",").map((v) => v === "true")),
  role: z
    .string()
    .nullish()
    .transform(
      (val) => val?.split(",").map((v) => v.trim()) as Role[] | undefined,
    ),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").nullish(),
  role: z.enum([Role.ADMIN, Role.USER]).nullish(),
  status: z.boolean().nullish(),
  password: z
    .union(
      [
        z.string().min(6, "Password must be at least 6 characters long"),
        z.literal(""),
      ],
      { message: "Password must be at least 6 characters long" },
    )
    .nullish(),
  permissions: z
    .record(
      z.string(),
      z.object({
        create: z.boolean().nullish(),
        read: z.boolean().nullish(),
        update: z.boolean().nullish(),
        delete: z.boolean().nullish(),
      }),
    )
    .nullish(),
});

export type ListUserQuerySchemaType = z.infer<typeof listUserQuerySchema>;
export type UpdateUserSchemaType = z.infer<typeof updateUserSchema>;
