import type { RfcEntry } from "~/rfc/types";

const STANDARDS = new Set(["INTERNET STANDARD", "DRAFT STANDARD", "PROPOSED STANDARD"]);
const OTHERS = new Set(["BEST CURRENT PRACTICE", "INFORMATIONAL", "EXPERIMENTAL"]);

/**
 * The next RFCs to generate: current (not obsoleted) RFCs with plain text
 * and no visual yet. Standards track first, then BCP / informational /
 * experimental; within each, the most-updated first — a proxy for how
 * central an RFC is.
 */
export function pickQueue(
  entries: Record<number, RfcEntry>,
  existing: Set<number>,
  limit: number,
): number[] {
  const tier = (e: RfcEntry) => (STANDARDS.has(e.status) ? 0 : OTHERS.has(e.status) ? 1 : 2);
  return Object.values(entries)
    .filter(
      (e) =>
        tier(e) < 2 &&
        e.obsoletedBy.length === 0 &&
        e.formats.includes("TXT") &&
        !existing.has(e.num),
    )
    .sort((a, b) => tier(a) - tier(b) || b.updatedBy.length - a.updatedBy.length || b.num - a.num)
    .slice(0, limit)
    .map((e) => e.num);
}
