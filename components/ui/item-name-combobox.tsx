"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

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
  placeholder = "Type item name...",
  disabled = false,
  hasError = false,
}: ItemNameComboboxProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = value.trim()
    ? itemNames.filter((name) =>
        name.toLowerCase().includes(value.toLowerCase()),
      )
    : [];

  function handleChange(text: string) {
    onChange(text);
    setShowSuggestions(true);
    setHighlightIndex(-1);
  }

  function handleSelect(name: string) {
    onChange(name);
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
    <div ref={containerRef} className="relative">
      <Input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          if (value.trim()) setShowSuggestions(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        disabled={disabled}
        aria-invalid={hasError}
      />
      {showSuggestions && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 max-h-40 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md"
        >
          {filtered.map((name, i) => (
            <li
              key={name}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(name);
              }}
              onMouseEnter={() => setHighlightIndex(i)}
              className={`cursor-pointer rounded-sm px-2 py-1.5 text-sm ${
                i === highlightIndex
                  ? "bg-accent text-accent-foreground"
                  : ""
              }`}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
