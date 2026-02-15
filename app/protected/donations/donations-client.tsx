"use client";

import { useState, useActionState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/format";
import { createDonation, deleteDonation } from "@/lib/actions/donations";
import { DonorCombobox } from "@/components/ui/donor-combobox";

// ── Types ──

type Donation = {
  id: string;
  type: string;
  amount: number;
  currency_id: string;
  exchange_rate_to_pkr: number;
  date: string;
  description: string | null;
  donor_id: string | null;
  cause_id: string | null;
  bank_account_id: string | null;
  to_user_id: string | null;
  currencies: { code: string; symbol: string } | null;
  donors: { name: string } | null;
  causes: { name: string } | null;
  bank_accounts: { account_name: string } | null;
  to_user: { display_name: string } | null;
};

type Donor = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

type Currency = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchange_rate_to_pkr: number;
  is_base: boolean;
};

type BankAccount = {
  id: string;
  account_name: string;
  bank_name: string;
  currencies: { code: string; symbol: string } | null;
};

type Cause = {
  id: string;
  name: string;
  type: string;
};

type Profile = {
  id: string;
  display_name: string;
};

interface DonationsClientProps {
  donations: Donation[];
  donors: Donor[];
  currencies: Currency[];
  bankAccounts: BankAccount[];
  causes: Cause[];
  profiles: Profile[];
}

// ── Delete Donation Dialog ──

function DeleteDonationDialog({ donation }: { donation: Donation }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteDonation(donation.id);
    if ("success" in result && result.success) {
      toast.success("Donation deleted");
      setOpen(false);
      router.refresh();
    } else {
      toast.error("Failed to delete donation");
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
          <DialogTitle>Delete Donation</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete this donation of{" "}
          <span className="font-medium text-foreground">
            {donation.currencies?.symbol ?? ""}{" "}
            {donation.amount.toLocaleString()}
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

// ── Add Donation Dialog ──

function AddDonationDialog({
  donors,
  currencies,
  bankAccounts,
  causes,
  profiles,
}: {
  donors: Donor[];
  currencies: Currency[];
  bankAccounts: BankAccount[];
  causes: Cause[];
  profiles: Profile[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<"donation_bank" | "donation_cash">(
    "donation_bank",
  );
  const [donorId, setDonorId] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [exchangeRate, setExchangeRate] = useState("");
  const [causeId, setCauseId] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [toUserId, setToUserId] = useState("");

  function resetForm() {
    setMethod("donation_bank");
    setDonorId("");
    setCurrencyId("");
    setExchangeRate("");
    setCauseId("");
    setBankAccountId("");
    setToUserId("");
  }

  function getErrorMessage(result: { error?: Record<string, string[] | undefined> }): string {
    if (!result.error) return "Failed to create donation";
    const first = Object.values(result.error).flat().find(Boolean);
    return typeof first === "string" ? first : "Failed to create donation";
  }

  const [, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await createDonation(formData);
      if ("success" in result && result.success) {
        toast.success("Donation created");
        setOpen(false);
        resetForm();
        router.refresh();
      } else {
        toast.error(getErrorMessage(result));
      }
      return result;
    },
    null,
  );

  function handleCurrencyChange(value: string) {
    setCurrencyId(value);
    const currency = currencies.find((c) => c.id === value);
    if (currency) {
      setExchangeRate(String(currency.exchange_rate_to_pkr));
    }
  }

  function handleMethodChange(value: string) {
    const newMethod = value as "donation_bank" | "donation_cash";
    setMethod(newMethod);
    setBankAccountId("");
    setToUserId("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 size-4" />
          Add Donation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Donation</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="type" value={method} />

          {/* Method Toggle */}
          <div className="space-y-2">
            <Label>Method</Label>
            <Select value={method} onValueChange={handleMethodChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="donation_bank">Bank Transfer</SelectItem>
                <SelectItem value="donation_cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Donor */}
          <div className="space-y-2">
            <Label>Donor</Label>
            <input type="hidden" name="donor_id" value={donorId} />
            <DonorCombobox
              donors={donors}
              value={donorId}
              onChange={setDonorId}
              placeholder="Search or select donor"
            />
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="add-donation-amount">Amount</Label>
              <Input
                id="add-donation-amount"
                name="amount"
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <input type="hidden" name="currency_id" value={currencyId} />
              <Select
                value={currencyId}
                onValueChange={handleCurrencyChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.id} value={currency.id}>
                      {currency.code} ({currency.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Exchange Rate */}
          <div className="space-y-2">
            <Label htmlFor="add-donation-rate">Exchange Rate to PKR</Label>
            <Input
              id="add-donation-rate"
              name="exchange_rate_to_pkr"
              type="number"
              step="any"
              min="0"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="add-donation-date">Date</Label>
            <Input
              id="add-donation-date"
              name="date"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="add-donation-description">
              Description (optional)
            </Label>
            <Textarea
              id="add-donation-description"
              name="description"
              placeholder="Notes about this donation"
              rows={2}
            />
          </div>

          {/* Cause */}
          <div className="space-y-2">
            <Label>Cause (optional)</Label>
            <input type="hidden" name="cause_id" value={causeId} />
            <Select value={causeId} onValueChange={setCauseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select cause" />
              </SelectTrigger>
              <SelectContent>
                {causes.map((cause) => (
                  <SelectItem key={cause.id} value={cause.id}>
                    {cause.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bank Account (if bank method) */}
          {method === "donation_bank" && (
            <div className="space-y-2">
              <Label>Bank Account</Label>
              <input
                type="hidden"
                name="bank_account_id"
                value={bankAccountId}
              />
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name} ({account.bank_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Receiving Volunteer (if cash method) */}
          {method === "donation_cash" && (
            <div className="space-y-2">
              <Label>Receiving Volunteer</Label>
              <input type="hidden" name="to_user_id" value={toUserId} />
              <Select value={toUserId} onValueChange={setToUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select volunteer" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Donations Client ──

export function DonationsClient({
  donations,
  donors,
  currencies,
  bankAccounts,
  causes,
  profiles,
}: DonationsClientProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">All Donations</h2>
        <AddDonationDialog
          donors={donors}
          currencies={currencies}
          bankAccounts={bankAccounts}
          causes={causes}
          profiles={profiles}
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Donor</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead className="text-right">PKR Value</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Cause</TableHead>
            <TableHead>Recipient</TableHead>
            <TableHead className="w-16 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {donations.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={9}
                className="text-center text-muted-foreground"
              >
                No donations yet. Add one to get started.
              </TableCell>
            </TableRow>
          ) : (
            donations.map((donation) => {
              const pkrValue = donation.amount * donation.exchange_rate_to_pkr;
              const methodLabel =
                donation.type === "donation_bank" ? "Bank" : "Cash";
              const recipient =
                donation.type === "donation_bank"
                  ? donation.bank_accounts?.account_name ?? "-"
                  : donation.to_user?.display_name ?? "-";

              return (
                <TableRow key={donation.id}>
                  <TableCell>{formatDate(donation.date)}</TableCell>
                  <TableCell>{donation.donors?.name ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(
                      donation.amount,
                      donation.currencies?.symbol,
                    )}
                  </TableCell>
                  <TableCell>{donation.currencies?.code ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(pkrValue, "Rs")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        donation.type === "donation_bank"
                          ? "default"
                          : "outline"
                      }
                    >
                      {methodLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>{donation.causes?.name ?? "-"}</TableCell>
                  <TableCell>{recipient}</TableCell>
                  <TableCell className="text-right">
                    <DeleteDonationDialog donation={donation} />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
