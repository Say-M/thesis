"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function OrderConfirmationPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12">
      <Card>
        <CardHeader>
          <div className="flex justify-center">
            <CheckCircle2 className="size-16 text-green-500" />
          </div>
          <h1 className="text-xl font-semibold text-center">
            Order placed successfully
          </h1>
        </CardHeader>
        <CardContent className="space-y-4">
          {id && (
            <p className="text-sm text-muted-foreground text-center">
              Order ID: <span className="font-mono">{id}</span>
            </p>
          )}
          <p className="text-sm text-muted-foreground text-center">
            We&apos;ll send you an update when your order ships.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Button asChild className="w-full">
              <Link href="/products">Continue shopping</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
