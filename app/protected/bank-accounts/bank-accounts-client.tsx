"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
} from "@/lib/actions/bank-accounts";
import { type BankAccountBalanceRow } from "@/lib/actions/bank-accounts";
import { formatCurrency } from "@/lib/format";

type BankAccountBalance = BankAccountBalanceRow;

type Currency = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchange_rate_to_pkr: number;
  is_base: boolean;
};

interface BankAccountsClientProps {
  balances: BankAccountBalance[];
  currencies: Currency[];
}

export function BankAccountsClient({
  balances,
  currencies,
}: BankAccountsClientProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccountBalance | null>(null);

  // Defer Radix Dialog render until after mount to avoid server/client ID hydration mismatch
  useEffect(() => setMounted(true), []);

  // Create action
  const [createState, createAction, createPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await createBankAccount(formData);
      if (result.error) return result;
      toast.success("Bank account created successfully");
      setDialogOpen(false);
      router.refresh();
      return { success: true };
    },
    null,
  );

  // Update action
  const [updateState, updateAction, updatePending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await updateBankAccount(formData);
      if (result.error) return result;
      toast.success("Bank account updated successfully");
      setEditingAccount(null);
      router.refresh();
      return { success: true };
    },
    null,
  );


  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this bank account?")) return;
    const result = await deleteBankAccount(id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Bank account deleted successfully");
    router.refresh();
  }

  const formErrors = (state: Record<string, unknown> | null) =>
    ((state as { error?: Record<string, string[]> })?.error ?? {});

  return (
    <div className="space-y-4">
      {/* Add Account Dialog - only render after mount to avoid Radix ID hydration mismatch */}
      <div className="flex justify-end">
        {mounted ? (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Bank Account</DialogTitle>
              <DialogDescription>
                Create a new bank account to track finances.
              </DialogDescription>
            </DialogHeader>
            <form action={createAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account_name">Account Name</Label>
                <Input id="account_name" name="account_name" required />
                {formErrors(createState).account_name && (
                  <p className="text-sm text-destructive">
                    {formErrors(createState).account_name![0]}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input id="bank_name" name="bank_name" required />
                {formErrors(createState).bank_name && (
                  <p className="text-sm text-destructive">
                    {formErrors(createState).bank_name![0]}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number (optional)</Label>
                <Input id="account_number" name="account_number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency_id">Currency</Label>
                <Select name="currency_id" required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code} ({c.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors(createState).currency_id && (
                  <p className="text-sm text-destructive">
                    {formErrors(createState).currency_id![0]}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="opening_balance">Opening Balance</Label>
                <Input
                  id="opening_balance"
                  name="opening_balance"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue="0"
                />
                {formErrors(createState).opening_balance && (
                  <p className="text-sm text-destructive">
                    {formErrors(createState).opening_balance![0]}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createPending}>
                  {createPending ? "Creating..." : "Create Account"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        ) : (
          <Button type="button" tabIndex={-1} aria-hidden>
            <Plus className="mr-2 size-4" />
            Add Account
          </Button>
        )}
      </div>

      {/* Edit Account Dialog - only render after mount to avoid Radix ID hydration mismatch */}
      {mounted && (
      <Dialog
        open={!!editingAccount}
        onOpenChange={(open) => !open && setEditingAccount(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bank Account</DialogTitle>
            <DialogDescription>
              Update bank account details.
            </DialogDescription>
          </DialogHeader>
          {editingAccount && (
            <form action={updateAction} className="space-y-4">
              <input type="hidden" name="id" value={editingAccount.id ?? ""} />
              <div className="space-y-2">
                <Label htmlFor="edit_account_name">Account Name</Label>
                <Input
                  id="edit_account_name"
                  name="account_name"
                  defaultValue={editingAccount.account_name ?? ""}
                  required
                />
                {formErrors(updateState).account_name && (
                  <p className="text-sm text-destructive">
                    {formErrors(updateState).account_name![0]}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_bank_name">Bank Name</Label>
                <Input
                  id="edit_bank_name"
                  name="bank_name"
                  defaultValue={editingAccount.bank_name ?? ""}
                  required
                />
                {formErrors(updateState).bank_name && (
                  <p className="text-sm text-destructive">
                    {formErrors(updateState).bank_name![0]}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_account_number">
                  Account Number (optional)
                </Label>
                <Input
                  id="edit_account_number"
                  name="account_number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_currency_id">Currency</Label>
                <Select
                  name="currency_id"
                  defaultValue={editingAccount.currency_id ?? undefined}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code} ({c.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors(updateState).currency_id && (
                  <p className="text-sm text-destructive">
                    {formErrors(updateState).currency_id![0]}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_opening_balance">Opening Balance</Label>
                <Input
                  id="edit_opening_balance"
                  name="opening_balance"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={editingAccount.opening_balance ?? 0}
                />
                {formErrors(updateState).opening_balance && (
                  <p className="text-sm text-destructive">
                    {formErrors(updateState).opening_balance![0]}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={updatePending}>
                  {updatePending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      )}

      {/* Accounts Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account Name</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead className="text-right">Opening Balance</TableHead>
              <TableHead className="text-right">Deposits</TableHead>
              <TableHead className="text-right">Withdrawals</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {balances.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground py-8"
                >
                  No bank accounts found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              balances.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/protected/bank-accounts/${account.id}`}
                      className="hover:underline"
                    >
                      {account.account_name}
                    </Link>
                  </TableCell>
                  <TableCell>{account.bank_name}</TableCell>
                  <TableCell>{account.currency_code}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(
                      account.opening_balance ?? 0,
                      account.currency_symbol ?? undefined,
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(
                      account.total_deposits ?? 0,
                      account.currency_symbol ?? undefined,
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(
                      account.total_withdrawals ?? 0,
                      account.currency_symbol ?? undefined,
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(
                      account.balance ?? 0,
                      account.currency_symbol ?? undefined,
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingAccount(account)}
                      >
                        <Pencil className="size-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => account.id && handleDelete(account.id)}
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
