import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import mermaid from "mermaid";

import { sequenceToMermaid, stateMachineToMermaid } from "~/visuals/compile";
import { allVisuals } from "~/visuals/registry";
import { validateModel } from "~/visuals/validate";

describe("every registered visual", () => {
  for (const model of allVisuals()) {
    it(`RFC ${model.rfc} validates against its RFC text`, () => {
      const fixture = `test/fixtures/rfc${model.rfc}.txt`;
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
