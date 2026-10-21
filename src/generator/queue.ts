import { NETWORKING_FIRST, NETWORKING_TITLE } from "~/generator/networking";
import type { RfcEntry } from "~/rfc/types";

const STANDARDS = new Set(["INTERNET STANDARD", "DRAFT STANDARD", "PROPOSED STANDARD"]);
const OTHERS = new Set(["BEST CURRENT PRACTICE", "INFORMATIONAL", "EXPERIMENTAL"]);

/**
 * The next RFCs to generate: current (not obsoleted) RFCs with plain text
 * and no visual yet. The curated networking list goes first, in its order;
 * then networking titles before the rest; then standards track before BCP /
 * informational / experimental; within each, the most-updated first — a
 * proxy for how central an RFC is.
 */
export function pickQueue(
  entries: Record<number, RfcEntry>,
  existing: Set<number>,
  limit: number,
  priority: number[] = NETWORKING_FIRST,
): number[] {
  const tier = (e: RfcEntry) => (STANDARDS.has(e.status) ? 0 : OTHERS.has(e.status) ? 1 : 2);
  const eligible = (e: RfcEntry | undefined): e is RfcEntry =>
    e !== undefined &&
    tier(e) < 2 &&
    e.obsoletedBy.length === 0 &&
    e.formats.includes("TXT") &&
    !existing.has(e.num);
  const topic = (e: RfcEntry) => (NETWORKING_TITLE.test(e.title) ? 0 : 1);

  const first = priority.map((num) => entries[num]).filter(eligible);
  const chosen = new Set(first.map((e) => e.num));
  const rest = Object.values(entries)
    .filter((e) => eligible(e) && !chosen.has(e.num))
    .sort(
      (a, b) =>
        topic(a) - topic(b) ||
        tier(a) - tier(b) ||
        b.updatedBy.length - a.updatedBy.length ||
        b.num - a.num,
    );
  return [...first, ...rest].slice(0, limit).map((e) => e.num);
}
