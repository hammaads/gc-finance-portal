"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate, ledgerTypeLabel } from "@/lib/format";
import { deleteLedgerEntry } from "@/lib/actions/ledger";

type Transaction = {
  id: string;
  type: string;
  amount: number;
  amount_pkr: number;
  date: string;
  description: string | null;
  from_user_id: string | null;
  to_user_id: string | null;
  donors: { name: string } | null;
  causes: { name: string } | null;
  expense_categories: { name: string } | null;
  bank_accounts: { account_name: string } | null;
  from_user: { name: string } | null;
  to_user: { name: string } | null;
};

function getDirection(
  entry: Transaction,
  volunteerId: string
): "In" | "Out" {
  if (entry.from_user_id === volunteerId) return "Out";
  return "In";
}

function getCounterparty(entry: Transaction, volunteerId: string): string {
  switch (entry.type) {
    case "donation_cash":
      return entry.donors?.name ?? "-";
    case "expense_cash":
      return [entry.expense_categories?.name, entry.causes?.name]
        .filter(Boolean)
        .join(" - ") || "-";
    case "cash_transfer":
      return entry.from_user_id === volunteerId
        ? `To ${entry.to_user?.name ?? "Unknown"}`
        : `From ${entry.from_user?.name ?? "Unknown"}`;
    case "cash_deposit":
      return entry.bank_accounts?.account_name ?? "-";
    default:
      return "-";
  }
}

function DeleteTransactionDialog({
  entry,
  volunteerId,
}: {
  entry: Transaction;
  volunteerId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteLedgerEntry(entry.id, volunteerId);
    if ("success" in result && result.success) {
      toast.success("Transaction deleted");
      setOpen(false);
      router.refresh();
    } else {
      toast.error("Failed to delete transaction");
    }
    setDeleting(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Transaction</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete this {ledgerTypeLabel(entry.type).toLowerCase()} of{" "}
          <span className="font-medium text-foreground">
            {formatCurrency(entry.amount_pkr, "Rs")}
          </span>
          ? This action cannot be undone.
        </p>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface VolunteerTransactionsClientProps {
  transactions: Transaction[];
  volunteerId: string;
}

export function VolunteerTransactionsClient({
  transactions,
  volunteerId,
}: VolunteerTransactionsClientProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right w-32">PKR Value</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead className="w-16 text-right">Actions</TableHead>
          </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
              className="text-center text-muted-foreground py-8"
            >
              No transactions found for this volunteer.
            </TableCell>
          </TableRow>
        ) : (
          transactions.map((entry) => {
            const direction = getDirection(entry, volunteerId);
            const counterparty = getCounterparty(entry, volunteerId);
            const isIn = direction === "In";
            return (
              <TableRow key={entry.id}>
                <TableCell>{formatDate(entry.date)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      entry.type?.startsWith("donation") ? "default" : "outline"
                    }
                  >
                    {ledgerTypeLabel(entry.type)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {isIn ? "+" : "-"}
                  {formatCurrency(entry.amount_pkr, "Rs")}
                </TableCell>
                <TableCell>{direction}</TableCell>
                <TableCell>{counterparty}</TableCell>
                <TableCell className="text-right">
                  <DeleteTransactionDialog entry={entry} volunteerId={volunteerId} />
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
