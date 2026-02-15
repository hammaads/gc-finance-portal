"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDonor } from "@/lib/actions/donors";
import { toast } from "sonner";

type Donor = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

type DonorComboboxProps = {
  donors: Donor[];
  value: string;
  onChange: (donorId: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function DonorCombobox({
  donors,
  value,
  onChange,
  placeholder = "Search or select donor",
  disabled = false,
}: DonorComboboxProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [addName, setAddName] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedDonor = donors.find((d) => d.id === value);

  function handleSelectDonor(donorId: string) {
    onChange(donorId);
    setOpen(false);
  }

  function handleShowAddForm(prefillName = "") {
    setAddName(prefillName);
    setAddPhone("");
    setAddEmail("");
    setShowAddForm(true);
  }

  function handleCancelAddForm() {
    setShowAddForm(false);
    setAddName("");
    setAddPhone("");
    setAddEmail("");
  }

  async function handleCreateDonor(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("name", addName.trim());
    formData.set("phone", addPhone.trim() || "");
    formData.set("email", addEmail.trim() || "");

    startTransition(async () => {
      const result = await createDonor(formData);
      if ("error" in result && result.error) {
        toast.error(result.error.name?.[0] ?? "Failed to add donor");
        return;
      }
      if ("donor" in result && result.donor) {
        onChange(result.donor.id);
        setShowAddForm(false);
        setOpen(false);
        handleCancelAddForm();
        router.refresh();
        toast.success("Donor added");
      }
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setShowAddForm(false);
      setAddName("");
      setAddPhone("");
      setAddEmail("");
    }
    setOpen(nextOpen);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !selectedDonor && "text-muted-foreground",
          )}
        >
          {selectedDonor ? selectedDonor.name : placeholder}
          <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        {showAddForm ? (
          <form onSubmit={handleCreateDonor} className="space-y-3 p-3">
            <div className="space-y-2">
              <Label htmlFor="add-donor-name">Name</Label>
              <Input
                id="add-donor-name"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Donor name"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-donor-phone">Phone (optional)</Label>
              <Input
                id="add-donor-phone"
                type="tel"
                value={addPhone}
                onChange={(e) => setAddPhone(e.target.value)}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-donor-email">Email (optional)</Label>
              <Input
                id="add-donor-email"
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="Email address"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelAddForm}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? "Adding..." : "Add Donor"}
              </Button>
            </div>
          </form>
        ) : (
          <Command
            shouldFilter={false}
            className="rounded-lg border-0 shadow-none"
          >
            <CommandInput
              placeholder="Search donors..."
              value={searchText}
              onValueChange={setSearchText}
            />
            <CommandList>
              {(() => {
                const filteredDonors = donors.filter(
                  (donor) =>
                    !searchText ||
                    donor.name.toLowerCase().includes(searchText.toLowerCase()),
                );
                return (
                  <>
                    <CommandGroup>
                      {filteredDonors.map((donor) => (
                        <CommandItem
                          key={donor.id}
                          value={donor.id}
                          onSelect={() => handleSelectDonor(donor.id)}
                        >
                          {donor.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandEmpty>
                      <div className="py-4 text-center">
                        <p className="mb-2 text-sm text-muted-foreground">
                          No donors found.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-auto w-full justify-center rounded-md border bg-muted/60 py-3 font-medium hover:bg-muted/80"
                          onClick={() => handleShowAddForm(searchText)}
                        >
                          <Plus className="mr-2 size-4" />
                          Add &quot;{searchText || "new donor"}&quot; as new
                          donor
                        </Button>
                      </div>
                    </CommandEmpty>
                    {filteredDonors.length > 0 && (
                      <>
                        <CommandSeparator className="my-2" />
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => handleShowAddForm(searchText)}
                            className="mt-2 cursor-pointer rounded-md border bg-muted/50 py-2.5 font-medium data-[selected=true]:bg-muted/70"
                          >
                            <Plus className="mr-2 size-4" />
                            Add new donor
                          </CommandItem>
                        </CommandGroup>
                      </>
                    )}
                  </>
                );
              })()}
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}
