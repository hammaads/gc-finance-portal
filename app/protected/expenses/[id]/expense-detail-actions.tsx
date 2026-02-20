"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { voidExpense } from "@/lib/actions/expenses";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ExpenseDetailActions({
  expenseId,
  isVoided,
}: {
  expenseId: string;
  isVoided: boolean;
}) {
  const router = useRouter();
  const [voidOpen, setVoidOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  async function handleVoid(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    setPending(true);
    const result = await voidExpense(expenseId, reason.trim());
    setPending(false);
    if (result?.error && "reason" in result.error) {
      toast.error(result.error.reason[0]);
      return;
    }
    if (!result?.error) {
      toast.success("Expense voided");
      setVoidOpen(false);
      setReason("");
      router.refresh();
    } else {
      toast.error("Failed to void");
    }
  }

  if (isVoided) return null;

  return (
    <>
      <Button variant="outline" size="sm" asChild>
        <Link href={`/protected/expenses/${expenseId}/edit`}>Edit</Link>
      </Button>
      <Dialog open={voidOpen} onOpenChange={(o) => { setVoidOpen(o); if (!o) setReason(""); }}>
        <Button variant="destructive" size="sm" onClick={() => setVoidOpen(true)}>
          Void
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void expense</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Voiding excludes this expense from totals. A reason is required.</p>
          <form onSubmit={handleVoid} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-void-reason">Reason (required)</Label>
              <Textarea
                id="expense-void-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Duplicate, wrong amount"
                rows={3}
                required
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" variant="destructive" disabled={pending || !reason.trim()}>
                {pending ? "Voiding..." : "Void"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
