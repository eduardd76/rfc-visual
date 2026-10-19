import { canonicalRfcPath } from "~/rfc/canonical";
import type { RfcEntry } from "~/rfc/types";

const TITLE_MAX = 40;

type Group = {
  key: "obsoletes" | "updates" | "obsoletedBy" | "updatedBy";
  label: string;
  /**
   * Older documents sit left of the focal RFC, newer ones right. Every edge
   * points older → newer and reads as a sentence: "793 obsoleted by 9293".
   */
  side: "older" | "newer";
};

const GROUPS: Group[] = [
  { key: "obsoletes", label: "obsoleted by", side: "older" },
  { key: "updates", label: "updated by", side: "older" },
  { key: "obsoletedBy", label: "obsoleted by", side: "newer" },
  { key: "updatedBy", label: "updated by", side: "newer" },
];

// Mermaid entity codes; `#` first so later escapes aren't re-escaped.
function escapeLabel(text: string): string {
  return text
    .replace(/#/g, "#35;")
    .replace(/"/g, "#quot;")
    .replace(/</g, "#lt;")
    .replace(/>/g, "#gt;");
}

function truncate(text: string): string {
  return text.length > TITLE_MAX ? `${text.slice(0, TITLE_MAX - 1).trimEnd()}…` : text;
}

function nodeLabel(num: number, index: Record<number, RfcEntry>): string {
  const title = index[num]?.title;
  return title
    ? `RFC ${num}<br/>${escapeLabel(truncate(title))}`
    : `RFC ${num}`;
}

/** The newest `max` numbers: later updates are the more relevant ones. */
function newest(nums: number[], max: number): number[] {
  return [...nums].sort((a, b) => b - a).slice(0, max);
}

/** Node rows on the taller side of the graph, for sizing its container. */
export function lineageRows(entry: RfcEntry, maxPerGroup = 8): number {
  const rows = { older: 0, newer: 0 };
  for (const group of GROUPS) {
    const count = entry[group.key].length;
    rows[group.side] += Math.min(count, maxPerGroup) + (count > maxPerGroup ? 1 : 0);
  }
  return Math.max(rows.older, rows.newer, 1);
}

export function hasLineage(entry: RfcEntry): boolean {
  return GROUPS.some((group) => entry[group.key].length > 0);
}

export function lineageToMermaid(
  entry: RfcEntry,
  index: Record<number, RfcEntry>,
  maxPerGroup = 8,
): string {
  const focal = `r${entry.num}`;
  const lines = [
    "flowchart LR",
    `  ${focal}["${nodeLabel(entry.num, { ...index, [entry.num]: entry })}"]`,
    `  class ${focal} focal`,
  ];
  const clicks = [`  click ${focal} "${canonicalRfcPath(entry.num)}"`];
  const seen = new Set<number>([entry.num]);

  for (const group of GROUPS) {
    const nums = entry[group.key];
    for (const num of newest(nums, maxPerGroup)) {
      const id = `r${num}`;
      if (!seen.has(num)) {
        lines.push(`  ${id}["${nodeLabel(num, index)}"]`);
        clicks.push(`  click ${id} "${canonicalRfcPath(num)}"`);
        seen.add(num);
      }
      lines.push(
        group.side === "older"
          ? `  ${id} -->|${group.label}| ${focal}`
          : `  ${focal} -->|${group.label}| ${id}`,
      );
      if (group.key === "obsoletedBy") lines.push(`  class ${id} obsolete`);
    }
    const rest = nums.length - maxPerGroup;
    if (rest > 0) {
      const id = `more_${group.key}`;
      lines.push(`  ${id}["+${rest} more"]`);
      lines.push(
        group.side === "older"
          ? `  ${id} -.->|${group.label}| ${focal}`
          : `  ${focal} -.->|${group.label}| ${id}`,
      );
    }
  }

  lines.push(
    "  classDef focal stroke-width:3px,font-weight:bold",
    "  classDef obsolete stroke:#dc2626,color:#dc2626",
  );
  return [...lines, ...clicks].join("\n");
}
