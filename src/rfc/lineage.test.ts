import mermaid from "mermaid";
import { describe, expect, it } from "vitest";

import { hasLineage, lineageRows, lineageToMermaid } from "~/rfc/lineage";
import type { RfcEntry } from "~/rfc/types";

function entry(num: number, overrides: Partial<RfcEntry> = {}): RfcEntry {
  return {
    num,
    title: `Title ${num}`,
    authors: [],
    date: "",
    status: "PROPOSED STANDARD",
    stream: "IETF",
    formats: ["TXT"],
    obsoletes: [],
    obsoletedBy: [],
    updates: [],
    updatedBy: [],
    errata: { verified: 0, held: 0, reported: 0 },
    ...overrides,
  };
}

const tcp793 = entry(793, {
  title: "Transmission Control Protocol",
  obsoletes: [761],
  obsoletedBy: [9293],
  updatedBy: [1122, 3168, 6093, 6528],
});
const index: Record<number, RfcEntry> = {
  761: entry(761),
  793: tcp793,
  9293: entry(9293, { title: "Transmission Control Protocol (TCP)" }),
  1122: entry(1122),
  3168: entry(3168),
  6093: entry(6093),
  6528: entry(6528),
};

describe("lineageToMermaid", () => {
  it("RFC 793 graph has 761 left, 9293 right as obsoleted by, four updated-by nodes", () => {
    const source = lineageToMermaid(tcp793, index);
    expect(source.startsWith("flowchart LR")).toBe(true);
    expect(source).toContain("r761");
    expect(source).toContain("r9293");
    expect(source).toContain("obsoleted by");
    // Relative, so links work on any host (netlify.app, previews, custom domain).
    expect(source).toContain('click r9293 "/rfc/rfc9293/"');
    for (const n of [1122, 3168, 6093, 6528]) expect(source).toContain(`r${n}[`);
  });

  it("caps a group at maxPerGroup with a +K more node", () => {
    const updatedBy = Array.from({ length: 29 }, (_, i) => 2000 + i);
    const source = lineageToMermaid(entry(1035, { updatedBy }), {});
    const shown = updatedBy.filter((n) => source.includes(`r${n}[`));
    // The newest updates are the most relevant ones to show.
    expect(shown).toEqual([2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028]);
    expect(source).toContain("+21 more");
    const moreId = /(\w+)\["\+21 more"\]/.exec(source)?.[1];
    expect(moreId).toBeDefined();
    expect(source).not.toContain(`click ${moreId} `);
  });

  it("escapes titles", async () => {
    const odd = entry(1, {
      title: '"Very Distant" Host interface; (#1) <x>',
      updatedBy: [2],
    });
    const source = lineageToMermaid(odd, { 1: odd, 2: entry(2) });
    expect(source).toContain("#quot;Very Distant#quot;");
    for (const line of source.split("\n").filter((l) => l.includes("["))) {
      const label = /\["(.*)"\]/.exec(line)?.[1] ?? "";
      expect(label).not.toContain('"');
    }
    await expect(mermaid.parse(source)).resolves.toBeTruthy();
  });

  it("dangling numbers render without title", () => {
    const source = lineageToMermaid(entry(5, { updatedBy: [424242] }), {});
    expect(source).toContain('r424242["RFC 424242"]');
  });
});

describe("hasLineage", () => {
  it("is false when all four lists are empty", () => {
    expect(hasLineage(entry(2119))).toBe(false);
    expect(hasLineage(tcp793)).toBe(true);
  });
});

describe("lineageRows", () => {
  it("counts the taller side, including +K more nodes", () => {
    // 793: older = 761 (1); newer = 9293 + four updated-by (5).
    expect(lineageRows(tcp793)).toBe(5);
    const updatedBy = Array.from({ length: 29 }, (_, i) => 2000 + i);
    // 8 shown + one "+21 more".
    expect(lineageRows(entry(1035, { updatedBy }))).toBe(9);
    expect(lineageRows(entry(2119))).toBe(1);
  });
});
