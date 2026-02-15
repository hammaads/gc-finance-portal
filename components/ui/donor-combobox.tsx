"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Donor = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

type DonorAutocompleteProps = {
  donors: Donor[];
  donorId: string;
  donorName: string;
  donorPhone: string;
  onDonorIdChange: (id: string) => void;
  onDonorNameChange: (name: string) => void;
  onDonorPhoneChange: (phone: string) => void;
  disabled?: boolean;
};

export function DonorAutocomplete({
  donors,
  donorId,
  donorName,
  donorPhone,
  onDonorIdChange,
  onDonorNameChange,
  onDonorPhoneChange,
  disabled = false,
}: DonorAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = donorName.trim()
    ? donors.filter((d) =>
        d.name.toLowerCase().includes(donorName.toLowerCase()),
      )
    : [];

  const handleNameChange = useCallback(
    (value: string) => {
      onDonorNameChange(value);
      if (donorId) {
        onDonorIdChange("");
      }
      setShowSuggestions(true);
      setHighlightIndex(-1);
    },
    [donorId, onDonorIdChange, onDonorNameChange],
  );

  function handleSelect(donor: Donor) {
    onDonorIdChange(donor.id);
    onDonorNameChange(donor.name);
    onDonorPhoneChange(donor.phone ?? "");
    setShowSuggestions(false);
    setHighlightIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions || filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < filtered.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : filtered.length - 1,
      );
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(filtered[highlightIndex]);
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
    <div className="space-y-3">
      <div className="relative" ref={containerRef}>
        <Label htmlFor="donor-name">Donor Name</Label>
        <Input
          id="donor-name"
          type="text"
          value={donorName}
          onChange={(e) => handleNameChange(e.target.value)}
          onFocus={() => {
            if (donorName.trim() && !donorId) setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type donor name"
          autoComplete="off"
          disabled={disabled}
          className="mt-1"
        />
        {showSuggestions && filtered.length > 0 && (
          <ul
            ref={listRef}
            className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md"
          >
            {filtered.map((donor, i) => (
              <li
                key={donor.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(donor);
                }}
                onMouseEnter={() => setHighlightIndex(i)}
                className={`flex cursor-pointer flex-col rounded-sm px-2 py-1.5 text-sm ${
                  i === highlightIndex ? "bg-accent text-accent-foreground" : ""
                }`}
              >
                <span>{donor.name}</span>
                {donor.phone && (
                  <span className="text-xs text-muted-foreground">
                    {donor.phone}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <Label htmlFor="donor-phone">Phone Number</Label>
        <Input
          id="donor-phone"
          type="tel"
          value={donorPhone}
          onChange={(e) => onDonorPhoneChange(e.target.value)}
          placeholder="+92 300 1234567"
          disabled={disabled}
          className="mt-1"
        />
      </div>
    </div>
  );
}
