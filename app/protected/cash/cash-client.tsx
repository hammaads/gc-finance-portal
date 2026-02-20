"use client";

import { useActionState, useEffect, useState } from "react";
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
  DialogClose,
  DialogContent,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRightLeft, Landmark } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import {
  createCashDeposit,
  createCashTransfer,
  createCashWithdrawal,
} from "@/lib/actions/cash";

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
  currencies: _currencies,
  bankAccounts,
}: CashClientProps) {
  void _currencies;
  const router = useRouter();

  // Volunteer -> Volunteer.
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferFromId, setTransferFromId] = useState("");
  const [transferToId, setTransferToId] = useState("");

  // Volunteer -> Bank.
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositFromId, setDepositFromId] = useState("");
  const [depositBankAccountId, setDepositBankAccountId] = useState("");

  // Bank -> Volunteer.
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawBankAccountId, setWithdrawBankAccountId] = useState("");
  const [withdrawToId, setWithdrawToId] = useState("");

  const [transferState, transferAction, transferPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await createCashTransfer(formData);
      if (result.error) return result;
      toast.success("Cash transfer recorded");
      setTransferOpen(false);
      router.refresh();
      return { success: true };
    },
    null,
  );

  const [depositState, depositAction, depositPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await createCashDeposit(formData);
      if (result.error) return result;
      toast.success("Cash deposit recorded");
      setDepositOpen(false);
      router.refresh();
      return { success: true };
    },
    null,
  );

  const [withdrawState, withdrawAction, withdrawPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await createCashWithdrawal(formData);
      if (result.error) return result;
      toast.success("Bank to volunteer transfer recorded");
      setWithdrawOpen(false);
      router.refresh();
      return { success: true };
    },
    null,
  );

  useEffect(() => {
    if (!transferOpen) {
      setTransferFromId("");
      setTransferToId("");
    }
  }, [transferOpen]);

  useEffect(() => {
    if (!depositOpen) {
      setDepositFromId("");
      setDepositBankAccountId("");
    }
  }, [depositOpen]);

  useEffect(() => {
    if (!withdrawOpen) {
      setWithdrawBankAccountId("");
      setWithdrawToId("");
    }
  }, [withdrawOpen]);

  const formErrors = (state: Record<string, unknown> | null) =>
    ((state as { error?: Record<string, string[]> })?.error ?? {});

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
      <div className="flex justify-end gap-2">
        <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <ArrowRightLeft className="mr-2 size-4" />
              Volunteer to Volunteer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Volunteer to Volunteer Transfer</DialogTitle>
            </DialogHeader>
            <form action={transferAction} className="space-y-4">
              <input type="hidden" name="from_user_id" value={transferFromId} />
              <input type="hidden" name="to_user_id" value={transferToId} />

              <div className="space-y-2">
                <Label>From Volunteer</Label>
                <Select value={transferFromId} onValueChange={setTransferFromId}>
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
                <Label htmlFor="transfer-description">Description (optional)</Label>
                <Textarea id="transfer-description" name="description" rows={2} />
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

        <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Landmark className="mr-2 size-4" />
              Volunteer to Bank
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Volunteer to Bank Transfer</DialogTitle>
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
                <Select value={depositFromId} onValueChange={setDepositFromId}>
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
                <Label>To Bank Account</Label>
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
                  <Label htmlFor="deposit-amount">Amount</Label>
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
                <Label htmlFor="deposit-description">Description (optional)</Label>
                <Textarea id="deposit-description" name="description" rows={2} />
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={depositPending}>
                  {depositPending ? "Submitting..." : "Record Transfer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Landmark className="mr-2 size-4" />
              Bank to Volunteer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bank to Volunteer Transfer</DialogTitle>
            </DialogHeader>
            <form action={withdrawAction} className="space-y-4">
              <input
                type="hidden"
                name="bank_account_id"
                value={withdrawBankAccountId}
              />
              <input type="hidden" name="to_user_id" value={withdrawToId} />

              <div className="space-y-2">
                <Label>From Bank Account</Label>
                <Select
                  value={withdrawBankAccountId}
                  onValueChange={setWithdrawBankAccountId}
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
                {formErrors(withdrawState).bank_account_id && (
                  <p className="text-sm text-destructive">
                    {formErrors(withdrawState).bank_account_id![0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>To Volunteer</Label>
                <Select value={withdrawToId} onValueChange={setWithdrawToId}>
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
                {formErrors(withdrawState).to_user_id && (
                  <p className="text-sm text-destructive">
                    {formErrors(withdrawState).to_user_id![0]}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount">Amount</Label>
                  <Input
                    id="withdraw-amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                  />
                  {formErrors(withdrawState).amount && (
                    <p className="text-sm text-destructive">
                      {formErrors(withdrawState).amount![0]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="withdraw-date">Date</Label>
                  <Input
                    id="withdraw-date"
                    name="date"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    required
                  />
                  {formErrors(withdrawState).date && (
                    <p className="text-sm text-destructive">
                      {formErrors(withdrawState).date![0]}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="withdraw-description">Description (optional)</Label>
                <Textarea id="withdraw-description" name="description" rows={2} />
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={withdrawPending}>
                  {withdrawPending ? "Submitting..." : "Record Transfer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
                  className="py-8 text-center text-muted-foreground"
                >
                  No cash activity found. Record a transfer to get started.
                </TableCell>
              </TableRow>
            ) : (
              activeBalances.map((b) => (
                <TableRow key={b.id ?? b.display_name}>
                  <TableCell className="font-medium">
                    {b.id ? (
                      <Link
                        href={`/protected/cash/${b.id}`}
                        className="text-foreground hover:underline"
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
