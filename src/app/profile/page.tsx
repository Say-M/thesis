"use client";

import { Navigation } from "@/components/navigation";
import { useAgent } from "@/context/agent-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export default function ProfilePage() {
  const { user, orders } = useAgent();

  const getStatusColor = (
    status: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "delivered":
        return "default";
      case "shipped":
        return "secondary";
      case "pending":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <>
      <Navigation />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-8 space-y-2">
          <h1 className="text-4xl font-semibold">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your account and view order history.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{user.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-semibold">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Phone</p>
                  <p className="text-sm text-muted-foreground">{user.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Address</p>
                  <p className="text-sm text-muted-foreground">
                    {user.address}
                  </p>
                </div>
                <Separator />
                <Button variant="outline" className="w-full">
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Order History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <p className="text-sm text-muted-foreground">
                  View all your past orders and their status.
                </p>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <p className="mb-4">No orders yet.</p>
                    <Button asChild>
                      <Link href="/">Start Shopping</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono text-sm">
                              {order.id}
                            </TableCell>
                            <TableCell>
                              {new Date(order.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {order.items.map((item, idx) => (
                                  <p key={idx} className="text-sm">
                                    {item.title} x{item.quantity}
                                  </p>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold">
                              {order.total}
                            </TableCell>
                            <TableCell>
                    <Badge variant={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                              >
                                <Link href={`/orders/${order.id}`}>
                                  View Details
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Settings Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about your orders
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Password</p>
                    <p className="text-sm text-muted-foreground">
                      Change your account password
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Change
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Privacy</p>
                    <p className="text-sm text-muted-foreground">
                      Manage your privacy settings
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}

