import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import mermaid from "mermaid";

import { sequenceToMermaid, stateMachineToMermaid } from "~/visuals/compile";
import { allVisuals } from "~/visuals/registry";
import { validateModel } from "~/visuals/validate";

describe("every registered visual", () => {
  for (const model of allVisuals()) {
    const fixture = `test/fixtures/rfc${model.rfc}.txt`;
    // Generated drafts were validated against the exact text the generator fetched;
    // their RFC text is not checked in, so they are re-validated only when it is.
    const check = model.provenance && !existsSync(fixture) ? it.skip : it;
    check(`RFC ${model.rfc} validates against its RFC text`, () => {
      expect(existsSync(fixture)).toBe(true);
      expect(validateModel(model, readFileSync(fixture, "utf8"))).toEqual([]);
    });

    it(`RFC ${model.rfc} diagrams are valid Mermaid`, async () => {
      if (model.states.length > 0) {
        await expect(mermaid.parse(stateMachineToMermaid(model, ["happy", "rst", "error"]))).resolves.toBeTruthy();
      }
      for (const sequence of model.sequences) {
        await expect(mermaid.parse(sequenceToMermaid(sequence))).resolves.toBeTruthy();
      }
    });
  }
});

describe("mergeVisuals", () => {
  it("prefers a hand-built visual over a generated one for the same RFC", async () => {
    const { mergeVisuals } = await import("~/visuals/registry");
    const hand = { rfc: 1, reviewed: false, states: [], transitions: [], sequences: [], headers: [], notShown: [] };
    const gen = (rfc: number) => ({ ...hand, rfc, provenance: { kind: "generated" as const, model: "m", generatedAt: "", dropped: 0 } });
    const merged = mergeVisuals([hand], [gen(1), gen(2)]);
    expect(merged.map((m) => [m.rfc, m.provenance?.kind ?? "hand"])).toEqual([[1, "hand"], [2, "generated"]]);
  });
});
