import { describe, expect, it } from "vitest";

import { lineageGraphHeight } from "~/components/lineage-graph";

describe("lineageGraphHeight", () => {
  it("grows with node rows so labels keep their size", () => {
    // Never below the interactive viewer's own min-h-[22rem] (352px), or it overflows.
    expect(lineageGraphHeight(1)).toBe(352);
    expect(lineageGraphHeight(5)).toBe(352);
    expect(lineageGraphHeight(10)).toBe(608);
  });
});
