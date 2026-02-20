"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteReceipt } from "@/lib/actions/receipts";
import { toast } from "sonner";
import { ImageIcon, Trash2 } from "lucide-react";

type Receipt = {
  id: string;
  file_name: string | null;
  url: string | null;
  storage_path: string;
};

export function ExpenseReceipts({
  expenseId,
  initialReceipts,
}: {
  expenseId: string;
  initialReceipts: Receipt[];
}) {
  const router = useRouter();
  const [receipts, setReceipts] = useState(initialReceipts);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(receiptId: string) {
    setDeletingId(receiptId);
    const result = await deleteReceipt(receiptId);
    setDeletingId(null);
    if (!result?.error) {
      setReceipts((prev) => prev.filter((r) => r.id !== receiptId));
      toast.success("Receipt removed");
      router.refresh();
    } else {
      toast.error("Failed to remove receipt");
    }
  }

  if (receipts.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-medium mb-2">Receipts</h2>
        <p className="text-sm text-muted-foreground">No receipts attached. You can upload receipts when editing the expense.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-medium mb-4">Receipts</h2>
      <div className="flex flex-wrap gap-4">
        {receipts.map((r) => (
          <div key={r.id} className="relative group border rounded-lg overflow-hidden w-40 h-40 bg-muted">
            {r.url ? (
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                <img src={r.url} alt={r.file_name ?? "Receipt"} className="w-full h-full object-cover" />
              </a>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="size-10 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
              <Button
                variant="destructive"
                size="icon"
                onClick={() => handleDelete(r.id)}
                disabled={deletingId === r.id}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            {r.file_name && (
              <p className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
                {r.file_name}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
