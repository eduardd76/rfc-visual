import { describe, expect, it } from "vitest";

import { lineageGraphHeight } from "~/components/lineage-graph";

describe("lineageGraphHeight", () => {
  it("grows with node rows so labels keep their size", () => {
    expect(lineageGraphHeight(1)).toBe(240);
    expect(lineageGraphHeight(5)).toBe(328);
    expect(lineageGraphHeight(10)).toBe(608);
  });
});
