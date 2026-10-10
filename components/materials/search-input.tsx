"use client";
import { Search, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isSearchMode, type SearchMode } from "@/lib/materials/search";

const options = {
  any: {
    label: "All fields",
    placeholder: "Formula, elements, or an identifier",
  },
  formula: {
    label: "Chemical formula",
    placeholder: "e.g. Fe2O3 or (NH4)2SO4",
  },
  elements: {
    label: "Contains elements",
    placeholder: "e.g. Fe-O · additional elements allowed",
  },
  system: {
    label: "Exact chemical system",
    placeholder: "e.g. Fe-O · only these elements",
  },
  id: {
    label: "Material ID",
    placeholder: "Enter an exact material identifier",
  },
  record: {
    label: "Structure record ID",
    placeholder: "Enter an exact structure record identifier",
  },
  phase: { label: "Phase ID", placeholder: "Enter an exact phase identifier" },
};
export function SearchInput({
  query,
  mode,
  onQueryChange,
  onModeChange,
  error,
}: {
  query: string;
  mode: SearchMode;
  onQueryChange: (query: string) => void;
  onModeChange: (mode: SearchMode) => void;
  error?: string;
}) {
  const errorElement = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (error) errorElement.current?.focus();
  }, [error]);
  return (
    <div className="search-component">
      <div className="hero-search discovery-search">
        <Search size={19} aria-hidden="true" className="search-icon" />
        <label htmlFor="workspace-search" className="sr-only">
          Material query
        </label>
        <Input
          id="workspace-search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={options[mode].placeholder}
          className="search-field"
          autoComplete="off"
          maxLength={200}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "search-error" : "query-hint"}
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onQueryChange("")}
            aria-label="Clear search"
          >
            <X size={16} />
          </Button>
        )}
        <Select
          value={mode}
          onValueChange={(value) => {
            if (isSearchMode(value)) onModeChange(value);
          }}
        >
          <SelectTrigger className="search-mode" aria-label="Search type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(options).map(([value, { label }]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" className="search-submit">
          Search <Search size={15} />
        </Button>
      </div>
      <p id="query-hint" className="query-hint">
        {mode === "system"
          ? "Matches all selected elements and no others, independent of stoichiometry."
          : mode === "elements"
            ? "Matches every selected element; additional elements may be present."
            : "Type a formula or select elements below. Element symbols are case-sensitive."}
      </p>
      {error && (
        <p
          className="search-error"
          id="search-error"
          role="alert"
          ref={errorElement}
          tabIndex={-1}
        >
          {error}
        </p>
      )}
    </div>
  );
}
