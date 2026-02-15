"use client";

import { useState, useRef, useEffect } from "react";
import { Check, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createVolunteer } from "@/lib/actions/volunteers";

type Volunteer = { id: string; name: string };

type VolunteerComboboxProps = {
  volunteers: Volunteer[];
  value: string; // volunteer ID
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function VolunteerCombobox({
  volunteers,
  value,
  onChange,
  placeholder = "Type volunteer name...",
  disabled = false,
}: VolunteerComboboxProps) {
  const [searchText, setSearchText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [localVolunteers, setLocalVolunteers] = useState(volunteers);
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sync when volunteers prop changes
  useEffect(() => {
    setLocalVolunteers(volunteers);
  }, [volunteers]);

  const selectedVolunteer = localVolunteers.find((v) => v.id === value);

  const filtered = searchText.trim()
    ? localVolunteers.filter((v) =>
        v.name.toLowerCase().includes(searchText.toLowerCase()),
      )
    : [];

  const exactMatch = localVolunteers.some(
    (v) => v.name.toLowerCase() === searchText.trim().toLowerCase(),
  );

  function handleTextChange(text: string) {
    setSearchText(text);
    if (value) onChange(""); // clear selection when typing
    setShowSuggestions(true);
    setHighlightIndex(-1);
  }

  function handleSelect(volunteer: Volunteer) {
    onChange(volunteer.id);
    setSearchText(volunteer.name);
    setShowSuggestions(false);
    setHighlightIndex(-1);
  }

  async function handleCreateNew() {
    if (!searchText.trim() || creating) return;
    setCreating(true);
    const result = await createVolunteer(searchText.trim());
    if ("volunteer" in result && result.volunteer) {
      const newVol = result.volunteer;
      setLocalVolunteers((prev) =>
        [...prev, newVol].sort((a, b) => a.name.localeCompare(b.name)),
      );
      onChange(newVol.id);
      setShowSuggestions(false);
    }
    setCreating(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions) return;

    const totalItems = filtered.length + (!exactMatch && searchText.trim() ? 1 : 0);
    if (totalItems === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < filtered.length) {
        handleSelect(filtered[highlightIndex]);
      } else if (
        highlightIndex === filtered.length &&
        !exactMatch &&
        searchText.trim()
      ) {
        handleCreateNew();
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  useEffect(() => {
    if (
      highlightIndex >= 0 &&
      listRef.current &&
      listRef.current.children[highlightIndex]
    ) {
      (listRef.current.children[highlightIndex] as HTMLElement).scrollIntoView({
        block: "nearest",
      });
    }
  }, [highlightIndex]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="space-y-1">
      <div className="relative">
        <Input
          type="text"
          value={value ? (selectedVolunteer?.name ?? "") : searchText}
          onChange={(e) => handleTextChange(e.target.value)}
          onFocus={() => {
            if (searchText.trim() && !value) setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          disabled={disabled || creating}
          className={cn(
            "transition-colors",
            value && "border-emerald-500/50 bg-emerald-500/5",
          )}
        />
        {showSuggestions && (filtered.length > 0 || (!exactMatch && searchText.trim())) && (
          <ul
            ref={listRef}
            className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md"
          >
            {filtered.map((vol, i) => (
              <li
                key={vol.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(vol);
                }}
                onMouseEnter={() => setHighlightIndex(i)}
                className={`flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm ${
                  i === highlightIndex
                    ? "bg-accent text-accent-foreground"
                    : ""
                }`}
              >
                {vol.name}
              </li>
            ))}
            {!exactMatch && searchText.trim() && (
              <li
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleCreateNew();
                }}
                onMouseEnter={() => setHighlightIndex(filtered.length)}
                className={`flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-blue-600 ${
                  highlightIndex === filtered.length
                    ? "bg-accent text-accent-foreground"
                    : ""
                }`}
              >
                <UserPlus className="size-3.5" />
                Create &quot;{searchText.trim()}&quot;
              </li>
            )}
          </ul>
        )}
      </div>
      {value && selectedVolunteer && (
        <p className="flex items-center gap-1 text-[11px] text-emerald-600">
          <Check className="size-3" />
          {selectedVolunteer.name}
        </p>
      )}
    </div>
  );
}
