import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getCauses, getDriveFinancialSummaries } from "@/lib/actions/causes";
import { DrivesClient } from "./drives-client";

async function DrivesContent() {
  const [causes, summaries] = await Promise.all([
    getCauses(),
    getDriveFinancialSummaries(),
  ]);

  return <DrivesClient causes={causes} summaries={summaries} />;
}

export default function DrivesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Drives &amp; Causes
        </h1>
        <p className="text-muted-foreground">
          Manage iftaar drives and other causes
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <DrivesContent />
      </Suspense>
    </div>
  );
}
