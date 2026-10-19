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

describe("validateModel on other shapes", () => {
  const tiny = (over: Partial<RfcVisualModel>): RfcVisualModel => ({
    rfc: 1, reviewed: false, states: [], transitions: [], sequences: [], headers: [], notShown: [], ...over,
  });
  const doc = "Some RFC\n\n   The Source Port is an optional field. Length is the length in octets.\n";

  it("accepts whole-document citations with section \"-\"", () => {
    const model = tiny({
      headers: [{ id: "h", title: "H", intro: { section: "-", quote: "Length is the length in octets." },
        fields: [{ name: "Source Port", bits: 16, explain: "", cite: { section: "-", quote: "The Source Port is an optional field." } }] }],
    });
    expect(validateModel(model, doc)).toEqual([]);
  });

  it("rejects a header field whose quote does not name it", () => {
    const model = tiny({
      headers: [{ id: "h", title: "H", intro: { section: "-", quote: "Length is the length in octets." },
        fields: [{ name: "Checksum", bits: 16, explain: "", cite: { section: "-", quote: "The Source Port is an optional field." } }] }],
    });
    expect(validateModel(model, doc).join("\n")).toMatch(/does not mention Checksum/);
  });

  it("rejects fixed header bits that do not end on an octet boundary", () => {
    const model = tiny({
      headers: [{ id: "h", title: "H", intro: { section: "-", quote: "Length is the length in octets." },
        fields: [{ name: "Source Port", bits: 13, explain: "", cite: { section: "-", quote: "The Source Port is an optional field." } }] }],
    });
    expect(validateModel(model, doc).join("\n")).toMatch(/not a whole number of octets/);
  });

  it("allows sequence steps without states", () => {
    const model = tiny({
      sequences: [{ id: "s", title: "S", intro: { section: "-", quote: "Length is the length in octets." },
        steps: [{ from: "A", segment: "Source Port", explain: "", cite: { section: "-", quote: "The Source Port is an optional field." } }] }],
    });
    expect(validateModel(model, doc)).toEqual([]);
  });
});

describe("section headings in older RFC styles", () => {
  const dhcp = readFileSync("test/fixtures/rfc2131.txt", "utf8");
  const dns = readFileSync("test/fixtures/rfc1035.txt", "utf8");
  const tiny = (cite: { section: string; quote: string }): RfcVisualModel => ({
    rfc: 1, reviewed: false, states: [], transitions: [], sequences: [], notShown: [],
    headers: [{ id: "h", title: "H", intro: cite, fields: [] }],
  });

  it("finds '4.4.1 Initialization and allocation of network address' (no trailing dot)", () => {
    expect(validateModel(tiny({ section: "4.4.1", quote: "The client begins in INIT state and forms a DHCPDISCOVER message." }), dhcp)).toEqual([]);
  });

  it("finds '4.1.1. Header section format' (single space)", () => {
    expect(validateModel(tiny({ section: "4.1.1", quote: "The header contains the following fields:" }), dns)).toEqual([]);
  });
});
