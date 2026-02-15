"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type ItemNameComboboxProps = {
  itemNames: string[];
  value: string;
  onChange: (name: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
};

export function ItemNameCombobox({
  itemNames,
  value,
  onChange,
  placeholder = "Search or type item name",
  disabled = false,
  hasError = false,
}: ItemNameComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  function handleSelect(name: string) {
    onChange(name);
    setOpen(false);
    setSearchText("");
  }

  function handleSearchChange(text: string) {
    setSearchText(text);
    // Live update the value as user types (free-text field)
    onChange(text);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={hasError}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
          )}
        >
          {value || placeholder}
          <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command shouldFilter={false} className="rounded-lg border-0 shadow-none">
          <CommandInput
            placeholder="Type item name..."
            value={searchText || value}
            onValueChange={handleSearchChange}
          />
          <CommandList>
            {(() => {
              const query = (searchText || value || "").toLowerCase();
              const filtered = itemNames.filter(
                (name) => !query || name.toLowerCase().includes(query),
              );
              return (
                <>
                  <CommandGroup>
                    {filtered.map((name) => (
                      <CommandItem
                        key={name}
                        value={name}
                        onSelect={() => handleSelect(name)}
                      >
                        {name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {filtered.length === 0 && (
                    <CommandEmpty>
                      <p className="py-2 text-center text-sm text-muted-foreground">
                        New item — press Enter or click outside
                      </p>
                    </CommandEmpty>
                  )}
                </>
              );
            })()}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
