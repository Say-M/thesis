"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useListUsers, useUpdateUser } from "@/hooks/api/users";
import type { UserListItem } from "@/hooks/api/users";
import { Role } from "@app/backend/enums/role";
import { useEffect, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsersTable({
  search,
  status,
  onEdit,
}: {
  search?: string;
  status?: string;
  onEdit?: (user: UserListItem) => void;
}) {
  const {
    data: usersData,
    status: usersStatus,
    fetchNextPage: fetchNextUsersPage,
    isFetchingNextPage: isFetchingNextUsersPage,
  } = useListUsers({
    search,
    status,
  });
  const users = useMemo(
    () => usersData?.pages?.map((page) => page.users).flat() ?? [],
    [usersData],
  );
  const { ref, inView } = useInView({ threshold: 0.8 });
  useEffect(() => {
    if (inView) {
      fetchNextUsersPage();
    }
  }, [inView, fetchNextUsersPage]);

  const { mutate: updateUser } = useUpdateUser();

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Mobile</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user._id}>
              <TableCell>{user.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {user.email ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {user.mobile ?? "—"}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{user.role}</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={user.status ? "default" : "secondary"}
                  className={!user.status ? "opacity-75" : ""}
                >
                  {user.status ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {user.role !== Role.SUPER_ADMIN && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onEdit && (
                        <DropdownMenuItem onSelect={() => onEdit(user)}>
                          Edit user
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          Change role
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup
                              value={user.role}
                              onValueChange={(value) =>
                                updateUser({
                                  id: user._id,
                                  payload: {
                                    role: value as Role.ADMIN | Role.USER,
                                  },
                                })
                              }
                            >
                              <DropdownMenuRadioItem value={Role.SUPER_ADMIN}>
                                Super admin
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value={Role.ADMIN}>
                                Admin
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value={Role.USER}>
                                User
                              </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>

                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          Change status
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup
                              value={user.status?.toString()}
                              onValueChange={(value) =>
                                updateUser({
                                  id: user._id,
                                  payload: { status: value === "true" },
                                })
                              }
                            >
                              <DropdownMenuRadioItem value="true">
                                Active
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="false">
                                Inactive
                              </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div ref={ref} />
      {(isFetchingNextUsersPage || usersStatus === "pending") && (
        <div className="flex flex-col gap-4 m-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      )}
    </div>
  );
}
