import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Navigation } from "@/components/navigation";
import { CheckCircle2 } from "lucide-react";

const MOCK_ORDER_ID = "ORD-872640";

export default function ConfirmationPage() {
  return (
    <>
      <Navigation />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12">
        <Card className="border-primary/40">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm uppercase tracking-tight text-primary">
              Order Confirmed
            </p>
            <CardTitle className="text-3xl">Thank you for your order!</CardTitle>
            <p className="text-muted-foreground">
              Your order has been successfully placed. You will receive a
              confirmation email shortly.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-lg border p-4">
              <p className="mb-2 font-semibold">Order Details</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>Order ID: {MOCK_ORDER_ID}</li>
                <li>Estimated delivery: 3-5 business days</li>
                <li>You can track your order in your profile</li>
              </ul>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="mb-2 font-semibold">What&apos;s next?</p>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Check your email for order confirmation</li>
                <li>Track your order status in your profile</li>
                <li>Contact support if you have any questions</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button asChild className="w-full" size="lg">
              <Link href="/profile">View Order History</Link>
            </Button>
            <div className="flex w-full gap-3">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/agent">Chat with AI Agent</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">Continue Shopping</Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </main>
    </>
  );
}
