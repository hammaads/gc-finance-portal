import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getExpenseCategories, getCurrencies } from "@/lib/actions/settings";
import { getDriveTemplates } from "@/lib/actions/budget";
import { SettingsClient } from "./settings-client";

async function SettingsContent() {
  const [categories, currencies, templates] = await Promise.all([
    getExpenseCategories(),
    getCurrencies(),
    getDriveTemplates(),
  ]);

  return (
    <SettingsClient
      categories={categories}
      currencies={currencies}
      templates={templates}
    />
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage categories, currencies, and templates
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
