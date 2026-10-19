"use client";

import { useId, useMemo, useRef, useState } from "react";

import { canonicalRfcPath, parseUserInput } from "~/rfc/canonical";
import { searchRfcs, type SearchEntry } from "~/rfc/search";

const MAX_RESULTS = 8;

/**
 * Search by protocol name ("bgp", "host configuration") or jump straight to an
 * RFC number or rfc-editor.org URL. The index loads on first focus.
 */
export function RfcSearch({
  navigate = (path: string) => window.location.assign(path),
  compact = false,
}: {
  navigate?: (path: string) => void;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const loading = useRef(false);
  const listId = useId();

  const results = useMemo(
    () => (index ? searchRfcs(index, query, MAX_RESULTS) : []),
    [index, query],
  );

  function loadIndex() {
    if (index || loading.current) return;
    loading.current = true;
    fetch("/search-index.json")
      .then((response) => response.json() as Promise<SearchEntry[]>)
      .then(setIndex)
      .catch(() => {
        loading.current = false;
      });
  }

  function go() {
    const direct = parseUserInput(query);
    if (direct !== null) return navigate(canonicalRfcPath(direct));
    const pick = results[active];
    if (pick) navigate(canonicalRfcPath(pick[0]));
  }

  const showList = open && query.trim().length > 0 && index !== null;

  return (
    <div className="relative w-full">
      <label htmlFor={`${listId}-input`} className="sr-only">
        Search RFCs by protocol, title or number
      </label>
      <input
        id={`${listId}-input`}
        role="combobox"
        aria-label="Search RFCs by protocol, title or number"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && results[active] ? `${listId}-${results[active][0]}` : undefined}
        autoComplete="off"
        value={query}
        placeholder={compact ? "Search RFCs… (bgp, dhcp, 9293)" : "Try bgp, ospf, dhcp, tls, quic — or an RFC number"}
        onFocus={() => {
          loadIndex();
          setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (event.key === "Enter") {
            event.preventDefault();
            go();
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        className={`neo-input w-full rounded-md border-[3px] border-black px-3 ${
          compact ? "min-h-[40px] text-sm" : "min-h-[52px] text-base"
        }`}
      />
      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-[70vh] w-full overflow-y-auto rounded-md border-[3px] border-black bg-[hsl(var(--background))] shadow-[4px_4px_0_0_#000]"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm">No RFCs match &ldquo;{query}&rdquo;.</li>
          ) : (
            results.map((entry, i) => (
              <li
                key={entry[0]}
                id={`${listId}-${entry[0]}`}
                role="option"
                aria-selected={i === active}
                // mousedown, not click: fires before the input's blur closes the list.
                onMouseDown={(event) => {
                  event.preventDefault();
                  navigate(canonicalRfcPath(entry[0]));
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-start gap-3 px-3 py-2 text-sm ${
                  i === active ? "bg-[hsl(var(--neo-panel))]" : ""
                }`}
              >
                <span className="shrink-0 font-mono text-xs font-semibold">RFC {entry[0]}</span>
                <span className={`flex-1 ${entry[3] ? "text-[hsl(var(--neo-soft-text))] line-through decoration-1" : ""}`}>
                  {entry[1]}
                </span>
                <span className="flex shrink-0 gap-1 text-[10px] font-bold uppercase">
                  {entry[4] ? <span className="rounded bg-purple-600 px-1.5 py-0.5 text-white">Visual</span> : null}
                  {entry[3] ? <span className="rounded border border-red-600 px-1.5 py-0.5 text-red-600">Obsoleted</span> : null}
                </span>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
