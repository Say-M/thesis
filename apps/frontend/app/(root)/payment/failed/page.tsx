"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function PaymentFailed() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get error details from URL params
  const reason = searchParams.get("reason") || "Payment processing failed";
  const transactionId = searchParams.get("transactionId");
  const orderAmount = searchParams.get("amount");
  const errorCode = searchParams.get("code");

  const handleRetry = () => {
    router.push("/cart");
  };

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <div className="px-4 pt-8">
      <div className="w-full max-w-md mx-auto">
        <Card className="border-destructive/20 bg-destructive/5">
          {/* Error Icon */}
          <div className="flex justify-center pt-8">
            <div className="flex size-20 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="size-10 text-destructive" />
            </div>
          </div>

          {/* Main Content */}
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <Badge variant="destructive" className="gap-1">
                <span className="size-2 rounded-full bg-current" />
                Payment Failed
              </Badge>
            </div>
            <CardTitle className="text-2xl text-destructive mb-2">
              Transaction Unsuccessful
            </CardTitle>
            <CardDescription className="text-base">{reason}</CardDescription>
          </CardHeader>

          {/* Separator */}
          <Separator className="mx-6" />

          {/* Error Details */}
          <div className="px-6 py-6 space-y-4">
            {transactionId && (
              <div className="bg-muted/40 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">
                  Transaction ID
                </p>
                <p className="font-mono text-sm text-foreground break-all">
                  {transactionId}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {orderAmount && (
                <div className="bg-muted/40 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Amount</p>
                  <p className="font-semibold text-foreground">{orderAmount}</p>
                </div>
              )}

              {errorCode && (
                <div className="bg-muted/40 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Error Code
                  </p>
                  <p className="font-mono text-sm text-foreground">
                    {errorCode}
                  </p>
                </div>
              )}
            </div>

            {/* Helpful Message */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                💡 <span className="font-medium">Tip:</span> Please check your
                internet connection and try again. If the problem persists,
                contact our support team.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 space-y-3">
            <Button
              onClick={handleRetry}
              variant="default"
              className="w-full gap-2"
            >
              <RotateCcw className="size-4" />
              Try Again
            </Button>
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="w-full gap-2"
            >
              <ArrowLeft className="size-4" />
              Back to Home
            </Button>
          </div>

          {/* Footer Help Text */}
          <div className="px-6 pb-6 text-center text-xs text-muted-foreground border-t">
            <p className="pt-4">
              Need help?{" "}
              <a
                href="mailto:support@example.com"
                className="text-primary hover:underline font-medium"
              >
                Contact Support
              </a>
            </p>
          </div>
        </Card>

        {/* Additional Info Card */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg border">
          <h3 className="font-semibold text-sm mb-2">What's Next?</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary">✓</span>
              <span>Your cart items are saved</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">✓</span>
              <span>No charge has been made to your account</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">✓</span>
              <span>Try a different payment method</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
