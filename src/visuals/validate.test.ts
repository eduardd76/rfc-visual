import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { rfc9293 } from "~/visuals/rfc9293";
import type { RfcVisualModel } from "~/visuals/types";
import { normalizeRfcText, validateModel } from "~/visuals/validate";

const text = readFileSync("test/fixtures/rfc9293.txt", "utf8");

function edit(mutate: (m: RfcVisualModel) => void): RfcVisualModel {
  const copy = structuredClone(rfc9293);
  mutate(copy);
  return copy;
}

describe("validateModel on RFC 9293", () => {
  it("accepts the hand-built model against the real RFC text", () => {
    expect(validateModel(rfc9293, text)).toEqual([]);
  });

  it("covers all eleven TCP states", () => {
    expect(rfc9293.states.map((s) => s.id).sort()).toEqual(
      [
        "CLOSED", "CLOSE-WAIT", "CLOSING", "ESTABLISHED", "FIN-WAIT-1", "FIN-WAIT-2",
        "LAST-ACK", "LISTEN", "SYN-RECEIVED", "SYN-SENT", "TIME-WAIT",
      ].sort(),
    );
  });

  it("rejects a quote that is not in the RFC", () => {
    const bad = edit((m) => {
      m.transitions[0]!.cite.quote = "enter the MAGIC state";
    });
    expect(validateModel(bad, text).join("\n")).toMatch(/not found/);
  });

  it("rejects a real quote cited to the wrong section", () => {
    const bad = edit((m) => {
      m.transitions[0]!.cite.section = "3.4";
    });
    expect(validateModel(bad, text).join("\n")).toMatch(/not in section 3\.4/);
  });

  it("rejects a real quote attached to the wrong target state", () => {
    const bad = edit((m) => {
      const t = m.transitions.find((x) => x.from === "ESTABLISHED" && x.to === "CLOSE-WAIT")!;
      t.to = "LAST-ACK";
    });
    expect(validateModel(bad, text).join("\n")).toMatch(/does not mention LAST-ACK/);
  });

  it("rejects an unreachable state", () => {
    const bad = edit((m) => {
      m.transitions = m.transitions.filter((x) => x.to !== "LAST-ACK");
    });
    expect(validateModel(bad, text).join("\n")).toMatch(/LAST-ACK is unreachable/);
  });

  it("rejects a sequence step whose segment is not in its quote", () => {
    const bad = edit((m) => {
      m.sequences[0]!.steps[0]!.segment = "<SEQ=999><CTL=SYN>";
    });
    expect(validateModel(bad, text).join("\n")).toMatch(/segment <SEQ=999>/);
  });
});

describe("normalizeRfcText", () => {
  it("joins words hyphenated across a line break", () => {
    expect(normalizeRfcText("then enter FIN-\n      WAIT-2 and")).toBe("then enter FIN-WAIT-2 and");
  });
});
