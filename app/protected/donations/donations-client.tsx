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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Trash2, CalendarIcon, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatCurrency, formatDate } from "@/lib/format";
import { createDonation, deleteDonation } from "@/lib/actions/donations";
import { DonorAutocomplete } from "@/components/ui/donor-combobox";
import { cn } from "@/lib/utils";

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
  currency_id: string;
  currencies: { code: string; symbol: string; exchange_rate_to_pkr: number } | null;
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
  const [donorName, setDonorName] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [causeId, setCauseId] = useState("");
  const [bankAccountId, setBankAccountId] = useState(
    bankAccounts.length > 0 ? bankAccounts[0].id : "",
  );
  const [toUserId, setToUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [showDescription, setShowDescription] = useState(false);

  const baseCurrency = currencies.find((c) => c.is_base) ?? currencies[0];
  const selectedBank = bankAccounts.find((b) => b.id === bankAccountId);
  const activeCurrency =
    method === "donation_bank" && selectedBank
      ? {
          id: selectedBank.currency_id,
          code: selectedBank.currencies?.code ?? "PKR",
          symbol: selectedBank.currencies?.symbol ?? "Rs",
          exchange_rate: selectedBank.currencies?.exchange_rate_to_pkr ?? 1,
        }
      : {
          id: baseCurrency?.id ?? "",
          code: baseCurrency?.code ?? "PKR",
          symbol: baseCurrency?.symbol ?? "Rs",
          exchange_rate: baseCurrency?.exchange_rate_to_pkr ?? 1,
        };

  function resetForm() {
    setMethod("donation_bank");
    setDonorId("");
    setDonorName("");
    setDonorPhone("");
    setAmount("");
    setCauseId("");
    setBankAccountId(bankAccounts.length > 0 ? bankAccounts[0].id : "");
    setToUserId("");
    setDate(new Date());
    setShowDescription(false);
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

  const formReady =
    donorName.trim().length > 0 &&
    Number(amount) > 0 &&
    (method === "donation_bank" ? !!bankAccountId : !!toUserId);

  function handleMethodChange(value: string) {
    const newMethod = value as "donation_bank" | "donation_cash";
    setMethod(newMethod);
    setBankAccountId(
      newMethod === "donation_bank" && bankAccounts.length > 0
        ? bankAccounts[0].id
        : "",
    );
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
      <DialogContent className="max-w-sm gap-0 p-5">
        <DialogHeader className="mb-3 space-y-0">
          <DialogTitle className="text-base">Add Donation</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="type" value={method} />
          <input type="hidden" name="currency_id" value={activeCurrency.id} />
          <input type="hidden" name="exchange_rate_to_pkr" value={String(activeCurrency.exchange_rate)} />
          <input type="hidden" name="date" value={format(date, "yyyy-MM-dd")} />
          <input type="hidden" name="donor_id" value={donorId} />
          <input type="hidden" name="donor_name" value={donorName} />
          <input type="hidden" name="donor_phone" value={donorPhone} />
          <input type="hidden" name="cause_id" value={causeId} />
          {method === "donation_bank" && (
            <input type="hidden" name="bank_account_id" value={bankAccountId} />
          )}
          {method === "donation_cash" && (
            <input type="hidden" name="to_user_id" value={toUserId} />
          )}

          {/* Method toggle */}
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              Method <span className="text-destructive">*</span>
            </label>
            <div className="flex rounded-md border p-0.5">
              <button
                type="button"
                onClick={() => handleMethodChange("donation_bank")}
                className={cn(
                  "flex-1 rounded-sm px-3 py-1 text-xs font-medium transition-colors",
                  method === "donation_bank"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Bank
              </button>
              <button
                type="button"
                onClick={() => handleMethodChange("donation_cash")}
                className={cn(
                  "flex-1 rounded-sm px-3 py-1 text-xs font-medium transition-colors",
                  method === "donation_cash"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Cash
              </button>
            </div>
          </div>

          {/* Donor name + phone */}
          <DonorAutocomplete
            donors={donors}
            donorId={donorId}
            donorName={donorName}
            donorPhone={donorPhone}
            onDonorIdChange={setDonorId}
            onDonorNameChange={setDonorName}
            onDonorPhoneChange={setDonorPhone}
          />

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              Amount ({activeCurrency.code}) <span className="text-destructive">*</span>
              {Number(amount) > 0 && <Check className="size-3 text-emerald-500" />}
            </label>
            <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              Date <span className="text-destructive">*</span>
            </label>
            <Input
              name="amount"
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={cn(
                "transition-colors",
                Number(amount) > 0 && "border-emerald-500/50 bg-emerald-500/5",
              )}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start border-emerald-500/50 bg-emerald-500/5 text-left text-sm font-normal transition-colors"
                >
                  <CalendarIcon className="mr-1.5 size-3.5 shrink-0 opacity-60" />
                  <span className="truncate">{format(date, "dd MMM yyyy")}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  disabled={{ after: new Date() }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Destination + Cause */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              {method === "donation_bank" ? "Bank Account" : "Receiving Volunteer"} <span className="text-destructive">*</span>
              {(method === "donation_bank" ? bankAccountId : toUserId) && (
                <Check className="size-3 text-emerald-500" />
              )}
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              Cause
            </label>
            {method === "donation_bank" ? (
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger
                  className={cn(
                    "text-sm transition-colors",
                    bankAccountId && "border-emerald-500/50 bg-emerald-500/5",
                  )}
                >
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name} ({account.bank_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select value={toUserId} onValueChange={setToUserId}>
                <SelectTrigger
                  className={cn(
                    "text-sm transition-colors",
                    toUserId && "border-emerald-500/50 bg-emerald-500/5",
                  )}
                >
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
            )}
            <Select value={causeId} onValueChange={setCauseId}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Optional" />
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

          {/* Description - collapsible */}
          {showDescription ? (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Notes</label>
              <Textarea
                name="description"
                placeholder="Optional notes about this donation"
                rows={2}
                className="text-sm"
                autoFocus
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDescription(true)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              + Add notes
            </button>
          )}

          <DialogFooter className="gap-2 pt-1">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={pending || !formReady}>
              {pending ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
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
