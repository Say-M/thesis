"use client";

import { TrackingStep } from "@/data/mock-content";

type Props = {
  steps: TrackingStep[];
};

export function TrackingTimeline({ steps }: Props) {
  return (
    <ol className="space-y-4 rounded-xl border bg-card p-4">
      {steps.map((step) => (
        <li
          key={step.label}
          className="flex items-start gap-4 text-sm text-muted-foreground"
        >
          <span
            className={`mt-1 h-2.5 w-2.5 rounded-full ${
              step.status === "done" ? "bg-primary" : "bg-muted-foreground/50"
            }`}
          />
          <div>
            <p className="font-semibold text-foreground">{step.label}</p>
            <p>{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
