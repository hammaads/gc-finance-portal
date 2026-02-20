"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Plus,
  Trash2,
  CalendarIcon,
  Check,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  createDonation,
  voidDonation,
  restoreDonation,
} from "@/lib/actions/donations";
import { DonorAutocomplete } from "@/components/ui/donor-combobox";
import { VolunteerCombobox } from "@/components/ui/volunteer-combobox";
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
  item_name: string | null;
  quantity: number | null;
  deleted_at: string | null;
  void_reason: string | null;
  voided_at: string | null;
  restored_at: string | null;
  currencies: { code: string; symbol: string } | null;
  donors: { name: string } | null;
  causes: { name: string } | null;
  bank_accounts: { account_name: string } | null;
  to_user: { name: string } | null;
  custodian: { name: string } | null;
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

type Volunteer = {
  id: string;
  name: string;
};

interface DonationsClientProps {
  donations: Donation[];
  donors: Donor[];
  currencies: Currency[];
  bankAccounts: BankAccount[];
  causes: Cause[];
  volunteers: Volunteer[];
  itemNames: string[];
  showVoided: boolean;
}

// ── Delete Donation Dialog ──

function VoidDonationDialog({ donation }: { donation: Donation }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleVoid() {
    if (!reason.trim()) {
      toast.error("Void reason is required");
      return;
    }
    setSubmitting(true);
    const result = await voidDonation(donation.id, reason);
    if ("success" in result && result.success) {
      toast.success("Donation voided");
      setOpen(false);
      setReason("");
      router.refresh();
    } else {
      const message = "error" in result ? result.error : "Failed to void donation";
      toast.error(typeof message === "string" ? message : "Failed to void donation");
    }
    setSubmitting(false);
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
          <DialogTitle>Void Donation</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This donation will be excluded from totals. Please provide a reason.
        </p>
        <div className="space-y-2">
          <label className="text-sm font-medium">Reason</label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Explain why this donation is being voided"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Donation amount:{" "}
          <span className="font-medium text-foreground">
            {donation.currencies?.symbol ?? ""}{" "}
            {donation.amount.toLocaleString()}
          </span>
        </p>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleVoid}
            disabled={submitting || !reason.trim()}
          >
            {submitting ? "Voiding..." : "Void Donation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RestoreDonationDialog({ donation }: { donation: Donation }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);

  async function handleRestore() {
    setRestoring(true);
    const result = await restoreDonation(donation.id);
    if ("success" in result && result.success) {
      toast.success("Donation restored");
      setOpen(false);
      router.refresh();
    } else {
      const message =
        "error" in result ? result.error : "Failed to restore donation";
      toast.error(
        typeof message === "string" ? message : "Failed to restore donation",
      );
    }
    setRestoring(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <RotateCcw className="size-4 text-emerald-600" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restore Donation</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Restore this voided donation back into active totals?
        </p>
        {donation.void_reason && (
          <p className="rounded-md bg-muted p-2 text-sm">
            <span className="font-medium">Void reason: </span>
            {donation.void_reason}
          </p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleRestore} disabled={restoring}>
            {restoring ? "Restoring..." : "Restore"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Donation Dialog ──

export function AddDonationDialog({
  donors,
  currencies,
  bankAccounts,
  causes,
  volunteers,
  itemNames,
}: {
  donors: Donor[];
  currencies: Currency[];
  bankAccounts: BankAccount[];
  causes: Cause[];
  volunteers: Volunteer[];
  itemNames: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<"donation_bank" | "donation_cash" | "donation_in_kind">(
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
  // In-kind specific state
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [custodianId, setCustodianId] = useState("");
  const [itemSuggestions, setItemSuggestions] = useState(false);

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

  const filteredItemNames = itemName.trim()
    ? itemNames.filter((n) => n.toLowerCase().includes(itemName.toLowerCase()))
    : [];

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
    setItemName("");
    setQuantity("1");
    setCustodianId("");
    setItemSuggestions(false);
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
    (method === "donation_in_kind"
      ? itemName.trim().length > 0 && Number(quantity) > 0 && !!custodianId
      : Number(amount) > 0 &&
        (method === "donation_bank" ? !!bankAccountId : !!toUserId));

  function handleMethodChange(newMethod: "donation_bank" | "donation_cash" | "donation_in_kind") {
    setMethod(newMethod);
    setBankAccountId(
      newMethod === "donation_bank" && bankAccounts.length > 0
        ? bankAccounts[0].id
        : "",
    );
    setToUserId("");
    setItemName("");
    setQuantity("1");
    setCustodianId("");
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
          <input type="hidden" name="date" value={format(date, "yyyy-MM-dd")} />
          <input type="hidden" name="donor_id" value={donorId} />
          <input type="hidden" name="donor_name" value={donorName} />
          <input type="hidden" name="donor_phone" value={donorPhone} />
          <input type="hidden" name="cause_id" value={causeId} />
          {method === "donation_in_kind" ? (
            <>
              <input type="hidden" name="item_name" value={itemName} />
              <input type="hidden" name="quantity" value={quantity} />
              <input type="hidden" name="custodian_id" value={custodianId} />
            </>
          ) : (
            <>
              <input type="hidden" name="currency_id" value={activeCurrency.id} />
              <input type="hidden" name="exchange_rate_to_pkr" value={String(activeCurrency.exchange_rate)} />
              {method === "donation_bank" && (
                <input type="hidden" name="bank_account_id" value={bankAccountId} />
              )}
              {method === "donation_cash" && (
                <input type="hidden" name="to_user_id" value={toUserId} />
              )}
            </>
          )}

          {/* Method toggle */}
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              Method <span className="text-destructive">*</span>
            </label>
            <div className="flex rounded-md border p-0.5">
              {(["donation_bank", "donation_cash", "donation_in_kind"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMethodChange(m)}
                  className={cn(
                    "flex-1 rounded-sm px-3 py-1 text-xs font-medium transition-colors",
                    method === m
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m === "donation_bank" ? "Bank" : m === "donation_cash" ? "Cash" : "In Kind"}
                </button>
              ))}
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

          {method === "donation_in_kind" ? (
            <>
              {/* Item Name + Quantity */}
              <div className="grid grid-cols-[1fr_80px] gap-x-2 gap-y-1">
                <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  Item Name <span className="text-destructive">*</span>
                  {itemName.trim() && <Check className="size-3 text-emerald-500" />}
                </label>
                <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  Qty <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Input
                    placeholder="e.g. Rice Bags"
                    value={itemName}
                    onChange={(e) => {
                      setItemName(e.target.value);
                      setItemSuggestions(true);
                    }}
                    onFocus={() => setItemSuggestions(true)}
                    onBlur={() => setTimeout(() => setItemSuggestions(false), 150)}
                    className={cn(
                      "text-sm transition-colors",
                      itemName.trim() && "border-emerald-500/50 bg-emerald-500/5",
                    )}
                  />
                  {itemSuggestions && filteredItemNames.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
                      {filteredItemNames.slice(0, 5).map((name) => (
                        <button
                          key={name}
                          type="button"
                          className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                          onMouseDown={() => {
                            setItemName(name);
                            setItemSuggestions(false);
                          }}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={cn(
                    "text-sm transition-colors",
                    Number(quantity) > 0 && "border-emerald-500/50 bg-emerald-500/5",
                  )}
                />
              </div>

              {/* Date + Custodian */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  Date <span className="text-destructive">*</span>
                </label>
                <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  Received By <span className="text-destructive">*</span>
                  {custodianId && <Check className="size-3 text-emerald-500" />}
                </label>
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
                <VolunteerCombobox
                  volunteers={volunteers}
                  value={custodianId}
                  onChange={setCustodianId}
                  placeholder="Who received items..."
                />
              </div>

              {/* Cause */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Cause</label>
                <Select value={causeId} onValueChange={setCauseId}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    {causes.filter((c) => c.type !== "drive").map((cause) => (
                      <SelectItem key={cause.id} value={cause.id}>
                        {cause.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
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
                  <VolunteerCombobox
                    volunteers={volunteers}
                    value={toUserId}
                    onChange={setToUserId}
                  />
                )}
                <Select value={causeId} onValueChange={setCauseId}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    {causes.filter((c) => c.type !== "drive").map((cause) => (
                      <SelectItem key={cause.id} value={cause.id}>
                        {cause.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

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
  volunteers,
  itemNames,
  showVoided,
}: DonationsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleShowVoidedChange(checked: boolean) {
    const next = new URLSearchParams(searchParams.toString());
    if (checked) {
      next.set("showVoided", "1");
    } else {
      next.delete("showVoided");
    }
    const query = next.toString();
    router.push(query ? `?${query}` : "/protected/donations");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">All Donations</h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={showVoided} onCheckedChange={handleShowVoidedChange} />
            Show voided
          </label>
          <AddDonationDialog
            donors={donors}
            currencies={currencies}
            bankAccounts={bankAccounts}
            causes={causes}
            volunteers={volunteers}
            itemNames={itemNames}
          />
        </div>
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
            <TableHead>Status</TableHead>
            <TableHead className="w-16 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {donations.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={10}
                className="text-center text-muted-foreground"
              >
                {showVoided
                  ? "No donations found."
                  : "No active donations yet. Add one to get started."}
              </TableCell>
            </TableRow>
          ) : (
            donations.map((donation) => {
              const isInKind = donation.type === "donation_in_kind";
              const isVoided = !!donation.deleted_at;
              const pkrValue = donation.amount * donation.exchange_rate_to_pkr;
              const methodLabel =
                donation.type === "donation_bank" ? "Bank" : donation.type === "donation_cash" ? "Cash" : "In-Kind";
              const recipient = isInKind
                ? donation.custodian?.name ?? "-"
                : donation.type === "donation_bank"
                  ? donation.bank_accounts?.account_name ?? "-"
                  : donation.to_user?.name ?? "-";

              return (
                <TableRow key={donation.id} className={isVoided ? "opacity-70" : undefined}>
                  <TableCell>{formatDate(donation.date)}</TableCell>
                  <TableCell>
                    <Link
                      href={`/protected/donations/${donation.id}`}
                      className="font-medium hover:underline"
                    >
                      {donation.donors?.name ?? "-"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    {isInKind
                      ? `${donation.item_name} ×${donation.quantity}`
                      : formatCurrency(donation.amount, donation.currencies?.symbol)}
                  </TableCell>
                  <TableCell>{isInKind ? "-" : donation.currencies?.code ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    {isInKind ? "-" : formatCurrency(pkrValue, "Rs")}
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
                  <TableCell>
                    {isVoided ? (
                      <div className="space-y-1">
                        <Badge variant="destructive">VOID</Badge>
                        {donation.void_reason && (
                          <p className="max-w-48 truncate text-xs text-muted-foreground">
                            {donation.void_reason}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isVoided ? (
                      <RestoreDonationDialog donation={donation} />
                    ) : (
                      <VoidDonationDialog donation={donation} />
                    )}
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
