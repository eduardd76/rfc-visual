import { XMLParser } from "fast-xml-parser";

import type { ErrataCounts, RfcEntry, RfcIndex } from "~/rfc/types";

type XmlEntry = {
  "doc-id": string[];
  title?: string | number;
  author?: { name?: string }[];
  date?: { month?: string; year?: number | string };
  format?: { "file-format"?: string[] };
  obsoletes?: { "doc-id"?: string[] };
  "obsoleted-by"?: { "doc-id"?: string[] };
  updates?: { "doc-id"?: string[] };
  "updated-by"?: { "doc-id"?: string[] };
  "current-status"?: string;
  stream?: string;
};

// One-element lists must still parse as arrays.
const ARRAY_TAGS = new Set(["rfc-entry", "author", "file-format", "doc-id", "kw"]);

const parser = new XMLParser({
  ignoreAttributes: true,
  parseTagValue: false,
  isArray: (name) => ARRAY_TAGS.has(name),
});

function rfcNumber(docId: string): number | null {
  const match = /^RFC0*(\d+)$/.exec(docId.trim());
  return match ? Number(match[1]) : null;
}

function rfcNumbers(list: { "doc-id"?: string[] } | undefined): number[] {
  return (list?.["doc-id"] ?? [])
    .map(rfcNumber)
    .filter((n): n is number => n !== null);
}

const NO_ERRATA: ErrataCounts = { verified: 0, held: 0, reported: 0 };

export function parseRfcIndex(xml: string): RfcEntry[] {
  const doc = parser.parse(xml) as { "rfc-index"?: { "rfc-entry"?: XmlEntry[] } };
  const entries: RfcEntry[] = [];
  for (const raw of doc["rfc-index"]?.["rfc-entry"] ?? []) {
    // The entry's own id is its direct child doc-id, never one from a relation list.
    const num = rfcNumber(raw["doc-id"][0] ?? "");
    if (num === null) continue;
    const month = raw.date?.month ?? "";
    const year = raw.date?.year ?? "";
    entries.push({
      num,
      title: String(raw.title ?? "").trim(),
      authors: (raw.author ?? []).map((a) => String(a.name ?? "").trim()).filter(Boolean),
      date: `${month} ${year}`.trim(),
      status: raw["current-status"] ?? "UNKNOWN",
      stream: raw.stream ?? null,
      formats: raw.format?.["file-format"] ?? [],
      obsoletes: rfcNumbers(raw.obsoletes),
      obsoletedBy: rfcNumbers(raw["obsoleted-by"]),
      updates: rfcNumbers(raw.updates),
      updatedBy: rfcNumbers(raw["updated-by"]),
      errata: { ...NO_ERRATA },
    });
  }
  return entries;
}

const STATUS_FIELD: Record<string, keyof ErrataCounts> = {
  Verified: "verified",
  "Held for Document Update": "held",
  Reported: "reported",
};

export function countErrata(
  records: { "doc-id": string; errata_status_code: string }[],
): Map<number, ErrataCounts> {
  const counts = new Map<number, ErrataCounts>();
  for (const record of records) {
    const field = STATUS_FIELD[record.errata_status_code];
    const num = rfcNumber(record["doc-id"]);
    if (!field || num === null) continue;
    const current = counts.get(num) ?? { ...NO_ERRATA };
    current[field] += 1;
    counts.set(num, current);
  }
  return counts;
}

export function buildRfcIndex(
  xml: string,
  errata: unknown[],
  fetchedAt: string,
): RfcIndex {
  const counts = countErrata(
    errata as { "doc-id": string; errata_status_code: string }[],
  );
  const entries: Record<number, RfcEntry> = {};
  for (const entry of parseRfcIndex(xml)) {
    entries[entry.num] = { ...entry, errata: counts.get(entry.num) ?? { ...NO_ERRATA } };
  }
  return { fetchedAt, entries };
}
