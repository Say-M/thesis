import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { AppBindings } from "@/app";
import { Role } from "@/enums/role";
import type { User } from "@/models/user";

type Action = "create" | "read" | "update" | "delete";

type PermissionOpt = { moduleName: string; action: Action };

function hasPermission(
  user: User,
  moduleName: string,
  action: Action,
): boolean {
  if (user.role === Role.SUPER_ADMIN) return true;

  const perms = user.permissions;
  if (!perms) return false;

  const modulePerms =
    perms instanceof Map
      ? perms.get(moduleName)
      : (perms as Record<string, { create?: boolean; read?: boolean; update?: boolean; delete?: boolean }>)?.[
          moduleName
        ];

  return modulePerms?.[action] === true;
}

export const permissionGuard = (opts: PermissionOpt | PermissionOpt[]) => {
  const optsArray: PermissionOpt[] = Array.isArray(opts) ? opts : [opts];

  return async (c: Context<AppBindings>, next: () => Promise<void>) => {
    const user = c.var.user;
    if (!user) throw new HTTPException(401, { message: "Unauthorized" });

    const allowed = optsArray.some((o) =>
      hasPermission(user, o.moduleName, o.action),
    );
    if (!allowed)
      throw new HTTPException(403, {
        message: "Forbidden",
      });

    return next();
  };
};

export default permissionGuard;
