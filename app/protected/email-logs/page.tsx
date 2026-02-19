import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getEmailImportLogs } from "@/lib/actions/email-import-logs";
import { EmailLogsClient } from "./email-logs-client";

async function EmailLogsContent() {
  const logs = await getEmailImportLogs();
  return <EmailLogsClient logs={logs} />;
}

export default function EmailLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Email Import Logs
        </h1>
        <p className="text-muted-foreground">
          Track all bank donation emails processed by the auto-import system
        </p>
      </div>
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        }
      >
        <EmailLogsContent />
      </Suspense>
    </div>
  );
}
