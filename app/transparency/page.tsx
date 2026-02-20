import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getDriveSummaries } from "@/lib/actions/transparency";
import { TransparencyClient } from "./transparency-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Financial Transparency - Grand Citizens",
  description:
    "View iftaar drive financial summaries and verify your donation was received.",
};

async function TransparencyData() {
  const summaries = await getDriveSummaries();
  return <TransparencyClient summaries={summaries} />;
}

export default function TransparencyPage() {
  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        <div className="mb-8 space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Financial Transparency
          </h1>
          <p className="text-muted-foreground">
            Grand Citizens iftaar drive financial summaries and donation
            verification.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="space-y-6">
              <Skeleton className="h-8 w-48" />
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-64" />
            </div>
          }
        >
          <TransparencyData />
        </Suspense>
      </div>
    </div>
  );
}
