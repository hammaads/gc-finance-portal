import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getInventoryItems,
  getInventoryByCustodian,
} from "@/lib/actions/inventory";
import { getCauses } from "@/lib/actions/causes";
import { getProfiles } from "@/lib/actions/cash";
import { InventoryClient } from "./inventory-client";

async function InventoryContent() {
  const [inventoryItems, custodianData, causes, profiles] = await Promise.all([
    getInventoryItems(),
    getInventoryByCustodian(),
    getCauses(),
    getProfiles(),
  ]);

  return (
    <InventoryClient
      inventoryItems={inventoryItems}
      custodianData={custodianData}
      causes={causes}
      profiles={profiles}
    />
  );
}

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground">
          Track items, custody, and consumption
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <InventoryContent />
      </Suspense>
    </div>
  );
}
