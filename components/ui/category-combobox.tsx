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
import { createExpenseCategory } from "@/lib/actions/settings";
import { toast } from "sonner";

type Category = {
  id: string;
  name: string;
};

type CategoryComboboxProps = {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
};

export function CategoryCombobox({
  categories,
  value,
  onChange,
  placeholder = "Search or select category",
  disabled = false,
  hasError = false,
}: CategoryComboboxProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [justCreated, setJustCreated] = useState<Category | null>(null);

  const selectedCategory =
    categories.find((c) => c.id === value) ??
    (justCreated && justCreated.id === value ? justCreated : null);

  function handleSelectCategory(categoryId: string) {
    onChange(categoryId);
    setOpen(false);
  }

  function handleCreateCategory(nameToCreate: string) {
    const trimmed = nameToCreate.trim();
    if (!trimmed) {
      toast.error("Please type a category name first");
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", trimmed);
      const result = await createExpenseCategory(formData);
      if ("error" in result && result.error) {
        toast.error(result.error.name?.[0] ?? "Failed to add category");
        return;
      }
      if ("category" in result && result.category) {
        setJustCreated({ id: result.category.id, name: trimmed });
        onChange(result.category.id);
        setOpen(false);
        setSearchText("");
        toast.success("Category created");
        router.refresh();
      }
    });
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
            !selectedCategory && "text-muted-foreground"
          )}
        >
          {selectedCategory ? selectedCategory.name : placeholder}
          <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command
            shouldFilter={false}
            className="rounded-lg border-0 shadow-none"
          >
            <CommandInput
              placeholder="Search categories..."
              value={searchText}
              onValueChange={setSearchText}
            />
            <CommandList>
              {(() => {
                const filtered = categories.filter(
                  (cat) =>
                    !searchText ||
                    cat.name.toLowerCase().includes(searchText.toLowerCase()),
                );
                return (
                  <>
                    <CommandGroup>
                      {filtered.map((cat) => (
                        <CommandItem
                          key={cat.id}
                          value={cat.id}
                          onSelect={() => handleSelectCategory(cat.id)}
                        >
                          {cat.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandEmpty>
                      <div className="py-4 text-center">
                        <p className="mb-2 text-sm text-muted-foreground">
                          No categories found.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          className="h-auto w-full justify-center rounded-md border bg-muted/60 py-3 font-medium hover:bg-muted/80"
                          onClick={() => handleCreateCategory(searchText)}
                        >
                          <Plus className="mr-2 size-4" />
                          {isPending
                            ? "Creating..."
                            : `Create "${searchText || "new category"}" as category`}
                        </Button>
                      </div>
                    </CommandEmpty>
                    {filtered.length > 0 && searchText.trim() && (
                      <>
                        <CommandSeparator className="my-2" />
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => handleCreateCategory(searchText)}
                            disabled={isPending}
                            className="mt-2 cursor-pointer rounded-md border bg-muted/50 py-2.5 font-medium data-[selected=true]:bg-muted/70"
                          >
                            <Plus className="mr-2 size-4" />
                            {isPending
                              ? "Creating..."
                              : `Create "${searchText}" as category`}
                          </CommandItem>
                        </CommandGroup>
                      </>
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
