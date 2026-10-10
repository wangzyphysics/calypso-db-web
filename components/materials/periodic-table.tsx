"use client";
import { useEffect, useId, useRef, useState } from "react";
import {
  ChevronDown,
  Pin,
  PinOff,
  RotateCcw,
  SwatchBook,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ElementInformation } from "./element-information";
import {
  elementCategories,
  elementReferences,
  elementReferenceSource,
} from "@/lib/materials/element-reference";
import { periodicCells } from "@/lib/materials/elements";
export function PeriodicTable({
  selected,
  excluded,
  onSelectionChange,
  onExcludedChange,
}: {
  selected: string[];
  excluded: string[];
  onSelectionChange: (elements: string[]) => void;
  onExcludedChange: (elements: string[]) => void;
}) {
  const [inspected, setInspected] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const visibleSymbol =
    pinned ?? inspected ?? selected[0] ?? excluded[0] ?? null;
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelPreview = () => {
    if (previewTimer.current !== null) clearTimeout(previewTimer.current);
    previewTimer.current = null;
  };
  useEffect(() => () => cancelPreview(), []);
  const [intent, setIntent] = useState<"include" | "exclude">("include");
  const [focusSymbol, setFocusSymbol] = useState("H");
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const includedHint = useId();
  const excludedHint = useId();
  const toggle = (symbol: string) => {
    const current = intent === "include" ? selected : excluded;
    const next = current.includes(symbol)
      ? current.filter((item) => item !== symbol)
      : [...current, symbol];
    if (intent === "include") onSelectionChange(next);
    else onExcludedChange(next);
  };
  return (
    <div className="element-panel">
      <span id={includedHint} className="sr-only">
        Included in the search
      </span>
      <span id={excludedHint} className="sr-only">
        Excluded from the search
      </span>
      <div className="element-toolbar">
        <strong className="periodic-title">Periodic table</strong>
        <span className="periodic-scroll-hint">
          Scroll to explore the table
        </span>
        <div className="element-actions">
          <div
            className="element-intent"
            role="group"
            aria-label="Element selection action"
          >
            <button
              type="button"
              aria-pressed={intent === "include"}
              onClick={() => setIntent("include")}
            >
              Include
            </button>
            <button
              type="button"
              aria-pressed={intent === "exclude"}
              onClick={() => setIntent("exclude")}
            >
              Exclude
            </button>
          </div>
          <details
            className="element-legend-menu"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.currentTarget.open = false;
                event.currentTarget.querySelector("summary")?.focus();
              }
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget))
                event.currentTarget.open = false;
            }}
          >
            <summary aria-label="Color guide">
              <SwatchBook size={14} />
              <span className="legend-label-full">Color guide</span>
              <span className="legend-label-compact">Colors</span>
              <ChevronDown size={13} />
            </summary>
            <div
              className="element-legend"
              aria-label="Element color categories"
            >
              {Object.entries(elementCategories).map(([family, label]) => (
                <span key={family}>
                  <i className={family} />
                  {label}
                </span>
              ))}
            </div>
          </details>
          <Button
            type="button"
            variant="ghost"
            className="element-clear"
            disabled={!selected.length && !excluded.length}
            onClick={() => {
              cancelPreview();
              setInspected(null);
              setPinned(null);
              onSelectionChange([]);
              onExcludedChange([]);
            }}
            aria-label="Clear selected elements"
          >
            <RotateCcw size={14} className="element-clear-icon" />
            <span className="element-clear-label">Clear</span>
          </Button>
        </div>
      </div>
      <div className="element-selection-summary">
        <div
          className="selected-elements"
          aria-label="Selected elements"
          aria-live="polite"
        >
          {selected.length || excluded.length ? (
            [
              ...selected.map((symbol) => ({ symbol, kind: "include" })),
              ...excluded.map((symbol) => ({ symbol, kind: "exclude" })),
            ].map(({ symbol, kind }) => (
              <button
                key={`${kind}-${symbol}`}
                type="button"
                className={kind === "exclude" ? "excluded-chip" : ""}
                onClick={() =>
                  kind === "exclude"
                    ? onExcludedChange(
                        excluded.filter((item) => item !== symbol),
                      )
                    : onSelectionChange(
                        selected.filter((item) => item !== symbol),
                      )
                }
                aria-label={`Remove ${kind === "exclude" ? "excluded " : ""}${symbol}`}
              >
                {kind === "exclude" ? `Exclude ${symbol}` : symbol}
                <X size={12} />
              </button>
            ))
          ) : (
            <span>Select to search. Hover to inspect.</span>
          )}
        </div>
        {visibleSymbol && (
          <button
            type="button"
            className="element-pin"
            aria-pressed={pinned !== null}
            aria-label={
              pinned ? "Unpin element information" : "Pin element information"
            }
            title={
              pinned
                ? "Unpin to resume previews. Search selections are independent."
                : "Pause over an element to preview it. Pin to keep its information visible."
            }
            onClick={() => {
              cancelPreview();
              if (pinned) {
                setInspected(pinned);
                setPinned(null);
              } else setPinned(visibleSymbol);
            }}
          >
            {pinned ? <PinOff size={12} /> : <Pin size={12} />}
            {pinned ? `Pinned ${pinned}` : "Pin info"}
          </button>
        )}
      </div>
      {visibleSymbol && (
        <div
          className="mobile-element-information"
          role="region"
          aria-label="Element reference information"
        >
          <ElementInformation symbol={visibleSymbol} variant="inset" />
        </div>
      )}
      <div
        className="periodic-scroll"
        tabIndex={0}
        role="region"
        aria-label="Periodic table, scroll horizontally on smaller screens"
      >
        <div className="periodic-grid">
          <div
            className={`element-reference-well${visibleSymbol ? "" : " empty"}`}
            role={visibleSymbol ? "region" : undefined}
            aria-label={
              visibleSymbol ? "Element reference information" : undefined
            }
          >
            {visibleSymbol ? (
              <ElementInformation symbol={visibleSymbol} variant="inset" />
            ) : (
              <div className="element-reference-prompt">
                <strong>Explore the elements.</strong>
                <span>Hover to inspect · select to search.</span>
              </div>
            )}
          </div>
          <div
            className="series-label lanthanide"
            style={{ gridColumn: "1 / 3", gridRow: 10 }}
          >
            <span>Lanthanides</span>
            <small>57–71</small>
          </div>
          <div
            className="series-label actinide"
            style={{ gridColumn: "1 / 3", gridRow: 11 }}
          >
            <span>Actinides</span>
            <small>89–103</small>
          </div>
          {Array.from({ length: 18 }, (_, i) => (
            <span
              key={`group-${i}`}
              className="group-number"
              style={{ gridColumn: i + 1, gridRow: 1 }}
            >
              {i + 1}
            </span>
          ))}
          {periodicCells.map((cell) =>
            cell.number === null ? (
              <span
                key={cell.symbol}
                className="element-series"
                style={{ gridColumn: cell.column, gridRow: cell.row + 1 }}
                aria-label={cell.name}
              >
                <span className="series-range">
                  {cell.symbol === "Ln" ? "57–71" : "89–103"}
                </span>
                <small>{cell.symbol}</small>
              </span>
            ) : (
              <button
                key={cell.symbol}
                ref={(node) => {
                  if (node) buttons.current.set(cell.symbol, node);
                  else buttons.current.delete(cell.symbol);
                }}
                type="button"
                className={`element-cell ${cell.family} ${elementReferences[cell.symbol].category}${selected.includes(cell.symbol) ? " selected" : ""}${excluded.includes(cell.symbol) ? " excluded" : ""}`}
                style={{ gridColumn: cell.column, gridRow: cell.row + 1 }}
                aria-label={`${cell.name} (${cell.symbol}), atomic number ${cell.number}`}
                aria-pressed={
                  selected.includes(cell.symbol) ||
                  excluded.includes(cell.symbol)
                }
                aria-describedby={
                  excluded.includes(cell.symbol)
                    ? excludedHint
                    : selected.includes(cell.symbol)
                      ? includedHint
                      : undefined
                }
                data-selection={
                  excluded.includes(cell.symbol)
                    ? "excluded"
                    : selected.includes(cell.symbol)
                      ? "included"
                      : "none"
                }
                tabIndex={focusSymbol === cell.symbol ? 0 : -1}
                data-inspected={visibleSymbol === cell.symbol || undefined}
                onPointerEnter={(event) => {
                  cancelPreview();
                  if (pinned || event.pointerType === "touch") return;
                  previewTimer.current = setTimeout(() => {
                    setInspected(cell.symbol);
                    previewTimer.current = null;
                  }, 350);
                }}
                onPointerLeave={cancelPreview}
                onFocus={() => {
                  cancelPreview();
                  setFocusSymbol(cell.symbol);
                  if (!pinned) setInspected(cell.symbol);
                }}
                onClick={() => {
                  cancelPreview();
                  if (!pinned) setInspected(cell.symbol);
                  toggle(cell.symbol);
                }}
                onKeyDown={(event) => {
                  if (
                    ![
                      "ArrowLeft",
                      "ArrowRight",
                      "ArrowUp",
                      "ArrowDown",
                      "Home",
                      "End",
                    ].includes(event.key)
                  )
                    return;
                  event.preventDefault();
                  const selectable = periodicCells.filter(
                    (item) => item.number !== null,
                  );
                  let target;
                  if (event.key === "Home" || event.key === "End") {
                    const row = selectable.filter(
                      (item) => item.row === cell.row,
                    );
                    target =
                      event.key === "Home" ? row[0] : row[row.length - 1];
                  } else {
                    const horizontal =
                      event.key === "ArrowLeft" || event.key === "ArrowRight";
                    const forward =
                      event.key === "ArrowRight" || event.key === "ArrowDown";
                    const candidates = selectable.filter((item) =>
                      horizontal
                        ? item.row === cell.row &&
                          (forward
                            ? item.column > cell.column
                            : item.column < cell.column)
                        : item.column === cell.column &&
                          (forward ? item.row > cell.row : item.row < cell.row),
                    );
                    target = candidates.sort((a, b) =>
                      horizontal
                        ? Math.abs(a.column - cell.column) -
                          Math.abs(b.column - cell.column)
                        : Math.abs(a.row - cell.row) -
                          Math.abs(b.row - cell.row),
                    )[0];
                  }
                  if (target) buttons.current.get(target.symbol)?.focus();
                }}
              >
                <span className="atomic-number">{cell.number}</span>
                <span className="element-symbol">{cell.symbol}</span>
              </button>
            ),
          )}
        </div>
      </div>
      <p className="element-source-note">
        Reference properties and categories:{" "}
        <a href={elementReferenceSource} target="_blank" rel="noreferrer">
          PubChem ↗
        </a>
        . Missing values are not inferred; these are not pressure-dependent
        material properties.
      </p>
    </div>
  );
}
