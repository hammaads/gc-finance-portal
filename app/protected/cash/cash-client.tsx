"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRightLeft, Landmark, Banknote } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import { createCashTransfer, createCashDeposit, createBankWithdrawal } from "@/lib/actions/cash";

type CashBalance = {
  id: string | null;
  display_name: string | null;
  total_received_pkr: number | null;
  total_sent_pkr: number | null;
  total_deposited_pkr: number | null;
  total_spent_pkr: number | null;
  balance_pkr: number | null;
};

type Profile = {
  id: string;
  name: string;
};

type Currency = {
  id: string;
  code: string;
  symbol: string;
  exchange_rate_to_pkr: number;
};

type BankAccount = {
  id: string;
  account_name: string;
  bank_name: string;
  currencies: { code: string; symbol: string } | null;
};

interface CashClientProps {
  balances: CashBalance[];
  volunteers: Profile[];
  currencies: Currency[];
  bankAccounts: BankAccount[];
}

export function CashClient({
  balances,
  volunteers,
  currencies,
  bankAccounts,
}: CashClientProps) {
  const router = useRouter();

  // Transfer dialog state (GC-UX-001: no currency/exchange in UI)
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferFromId, setTransferFromId] = useState("");
  const [transferToId, setTransferToId] = useState("");

  // Deposit dialog state
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositFromId, setDepositFromId] = useState("");
  const [depositBankAccountId, setDepositBankAccountId] = useState("");

  // Bank → Volunteer (withdrawal) dialog state
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [withdrawalBankAccountId, setWithdrawalBankAccountId] = useState("");
  const [withdrawalToId, setWithdrawalToId] = useState("");

  // Transfer action
  const [transferState, transferAction, transferPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await createCashTransfer(formData);
      if (result.error) return result;
      toast.success("Cash transfer recorded successfully");
      setTransferOpen(false);
      router.refresh();
      return { success: true };
    },
    null,
  );

  // Deposit action
  const [depositState, depositAction, depositPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await createCashDeposit(formData);
      if (result.error) return result;
      toast.success("Cash deposit recorded successfully");
      setDepositOpen(false);
      router.refresh();
      return { success: true };
    },
    null,
  );

  // Bank → Volunteer action
  const [withdrawalState, withdrawalAction, withdrawalPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await createBankWithdrawal(formData);
      if (result.error) return result;
      toast.success("Bank withdrawal recorded successfully");
      setWithdrawalOpen(false);
      router.refresh();
      return { success: true };
    },
    null,
  );

  // Reset transfer form when dialog closes
  useEffect(() => {
    if (!transferOpen) {
      setTransferFromId("");
      setTransferToId("");
    }
  }, [transferOpen]);

  // Reset deposit form when dialog closes
  useEffect(() => {
    if (!depositOpen) {
      setDepositFromId("");
      setDepositBankAccountId("");
    }
  }, [depositOpen]);

  useEffect(() => {
    if (!withdrawalOpen) {
      setWithdrawalBankAccountId("");
      setWithdrawalToId("");
    }
  }, [withdrawalOpen]);

  const formErrors = (state: Record<string, unknown> | null) =>
    ((state as { error?: Record<string, string[]> })?.error ?? {});

  // Filter to only show volunteers with non-zero balance or any activity
  const activeBalances = balances.filter(
    (b) =>
      (b.balance_pkr ?? 0) !== 0 ||
      (b.total_received_pkr ?? 0) !== 0 ||
      (b.total_sent_pkr ?? 0) !== 0 ||
      (b.total_deposited_pkr ?? 0) !== 0 ||
      (b.total_spent_pkr ?? 0) !== 0,
  );

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        {/* Cash Transfer Dialog */}
        <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <ArrowRightLeft className="mr-2 size-4" />
              Cash Transfer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cash Transfer</DialogTitle>
            </DialogHeader>
            <form action={transferAction} className="space-y-4">
              <input type="hidden" name="from_user_id" value={transferFromId} />
              <input type="hidden" name="to_user_id" value={transferToId} />

              <div className="space-y-2">
                <Label>From Volunteer</Label>
                <Select
                  value={transferFromId}
                  onValueChange={setTransferFromId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select volunteer" />
                  </SelectTrigger>
                  <SelectContent>
                    {volunteers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors(transferState).from_user_id && (
                  <p className="text-sm text-destructive">
                    {formErrors(transferState).from_user_id![0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>To Volunteer</Label>
                <Select value={transferToId} onValueChange={setTransferToId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select volunteer" />
                  </SelectTrigger>
                  <SelectContent>
                    {volunteers
                      .filter((p) => p.id !== transferFromId)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {formErrors(transferState).to_user_id && (
                  <p className="text-sm text-destructive">
                    {formErrors(transferState).to_user_id![0]}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transfer-amount">Amount (PKR)</Label>
                  <Input
                    id="transfer-amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                  />
                  {formErrors(transferState).amount && (
                    <p className="text-sm text-destructive">
                      {formErrors(transferState).amount![0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transfer-date">Date</Label>
                  <Input
                    id="transfer-date"
                    name="date"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    required
                  />
                  {formErrors(transferState).date && (
                    <p className="text-sm text-destructive">
                      {formErrors(transferState).date![0]}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transfer-description">
                  Description (optional)
                </Label>
                <Textarea
                  id="transfer-description"
                  name="description"
                  rows={2}
                />
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={transferPending}>
                  {transferPending ? "Submitting..." : "Record Transfer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Bank → Volunteer (Receive from bank) Dialog */}
        <Dialog open={withdrawalOpen} onOpenChange={setWithdrawalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Banknote className="mr-2 size-4" />
              Receive from Bank
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Receive from Bank</DialogTitle>
            </DialogHeader>
            <form action={withdrawalAction} className="space-y-4">
              <input type="hidden" name="bank_account_id" value={withdrawalBankAccountId} />
              <input type="hidden" name="to_user_id" value={withdrawalToId} />
              <div className="space-y-2">
                <Label>Bank Account</Label>
                <Select value={withdrawalBankAccountId} onValueChange={setWithdrawalBankAccountId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((ba) => (
                      <SelectItem key={ba.id} value={ba.id}>
                        {ba.account_name} ({ba.bank_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>To Volunteer</Label>
                <Select value={withdrawalToId} onValueChange={setWithdrawalToId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select volunteer" />
                  </SelectTrigger>
                  <SelectContent>
                    {volunteers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="withdrawal-amount">Amount (PKR)</Label>
                  <Input id="withdrawal-amount" name="amount" type="number" min="0" step="0.01" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="withdrawal-date">Date</Label>
                  <Input id="withdrawal-date" name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="withdrawal-description">Description (optional)</Label>
                <Textarea id="withdrawal-description" name="description" rows={2} />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={withdrawalPending}>
                  {withdrawalPending ? "Submitting..." : "Record"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Cash Deposit Dialog */}
        <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Landmark className="mr-2 size-4" />
              Cash Deposit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cash Deposit</DialogTitle>
            </DialogHeader>
            <form action={depositAction} className="space-y-4">
              <input type="hidden" name="from_user_id" value={depositFromId} />
              <input
                type="hidden"
                name="bank_account_id"
                value={depositBankAccountId}
              />

              <div className="space-y-2">
                <Label>From Volunteer</Label>
                <Select
                  value={depositFromId}
                  onValueChange={setDepositFromId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select volunteer" />
                  </SelectTrigger>
                  <SelectContent>
                    {volunteers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors(depositState).from_user_id && (
                  <p className="text-sm text-destructive">
                    {formErrors(depositState).from_user_id![0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Bank Account</Label>
                <Select
                  value={depositBankAccountId}
                  onValueChange={setDepositBankAccountId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((ba) => (
                      <SelectItem key={ba.id} value={ba.id}>
                        {ba.account_name} ({ba.bank_name}
                        {ba.currencies ? ` - ${ba.currencies.code}` : ""})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors(depositState).bank_account_id && (
                  <p className="text-sm text-destructive">
                    {formErrors(depositState).bank_account_id![0]}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deposit-amount">Amount (PKR)</Label>
                  <Input
                    id="deposit-amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                  />
                  {formErrors(depositState).amount && (
                    <p className="text-sm text-destructive">
                      {formErrors(depositState).amount![0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deposit-date">Date</Label>
                  <Input
                    id="deposit-date"
                    name="date"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    required
                  />
                  {formErrors(depositState).date && (
                    <p className="text-sm text-destructive">
                      {formErrors(depositState).date![0]}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit-description">
                  Description (optional)
                </Label>
                <Textarea
                  id="deposit-description"
                  name="description"
                  rows={2}
                />
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={depositPending}>
                  {depositPending ? "Submitting..." : "Record Deposit"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cash Holdings Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Volunteer</TableHead>
              <TableHead className="text-right">Received</TableHead>
              <TableHead className="text-right">Sent</TableHead>
              <TableHead className="text-right">Deposited</TableHead>
              <TableHead className="text-right">Spent</TableHead>
              <TableHead className="text-right">Balance (PKR)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeBalances.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  No cash activity found. Record a transfer or deposit to get
                  started.
                </TableCell>
              </TableRow>
            ) : (
              activeBalances.map((b) => (
                <TableRow key={b.id ?? b.display_name}>
                  <TableCell className="font-medium">
                    {b.id ? (
                      <Link
                        href={`/protected/cash/${b.id}`}
                        className="hover:underline text-foreground"
                      >
                        {b.display_name ?? "Unknown"}
                      </Link>
                    ) : (
                      b.display_name ?? "Unknown"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(b.total_received_pkr ?? 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(b.total_sent_pkr ?? 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(b.total_deposited_pkr ?? 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(b.total_spent_pkr ?? 0)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold ${
                      (b.balance_pkr ?? 0) < 0 ? "text-destructive" : ""
                    }`}
                  >
                    {formatCurrency(b.balance_pkr ?? 0)}
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
