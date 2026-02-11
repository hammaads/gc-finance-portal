import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getDonors } from "@/lib/actions/donors";
import { DonorsClient } from "./donors-client";

async function DonorsContent() {
  const donors = await getDonors();

  return <DonorsClient donors={donors} />;
}

export default function DonorsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Donors</h1>
        <p className="text-muted-foreground">
          Manage donors and their contact information
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <DonorsContent />
      </Suspense>
    </div>
  );
}
