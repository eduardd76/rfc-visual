import { SITE_ORIGIN } from "~/lib/site";
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
  const clicks = [`  click ${focal} "${SITE_ORIGIN}${canonicalRfcPath(entry.num)}"`];
  const seen = new Set<number>([entry.num]);

  for (const group of GROUPS) {
    const nums = entry[group.key];
    for (const num of nums.slice(0, maxPerGroup)) {
      const id = `r${num}`;
      if (!seen.has(num)) {
        lines.push(`  ${id}["${nodeLabel(num, index)}"]`);
        clicks.push(`  click ${id} "${SITE_ORIGIN}${canonicalRfcPath(num)}"`);
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
