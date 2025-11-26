"use client";

import Link from "next/link";
import { useAgent } from "@/context/agent-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";

export function Navigation() {
  const { cartItemCount } = useAgent();

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="text-xl font-bold">
          AI Commerce
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/categories">
            <Button variant="ghost">Categories</Button>
          </Link>
          <Link href="/agent">
            <Button variant="ghost">AI Agent</Button>
          </Link>
          <Link href="/cart" className="relative">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="ghost">Profile</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

