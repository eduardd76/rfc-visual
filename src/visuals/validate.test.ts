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

describe("appendices, terminal states and reachability", () => {
  const tls = readFileSync("test/fixtures/rfc8446.txt", "utf8");
  const base = (over: Partial<RfcVisualModel>): RfcVisualModel => ({
    rfc: 1, reviewed: false, states: [], transitions: [], sequences: [], headers: [], notShown: [], ...over,
  });

  it("finds appendix sections such as A.1", () => {
    const model = base({ headers: [{ id: "h", title: "H", fields: [],
      intro: { section: "A.1", quote: "START <----+" } }] });
    expect(validateModel(model, tls)).toEqual([]);
  });

  const doc = "1.  Intro\n\n   READY moves to SENT. SENT moves to DONE. READY moves to GONE.\n";
  const st = (id: string) => ({ id, cite: { section: "1", quote: id === "READY" ? "READY moves to SENT." : `moves to ${id}.` } });
  const tr = (from: string, to: string, layer: "happy" | "rst", quote: string) =>
    ({ from, to, event: "e", layer, cite: { section: "1", quote } });

  it("lets states marked terminal have no exit", () => {
    const model = base({
      initial: "READY", terminal: ["DONE"],
      states: [st("READY"), st("SENT"), st("DONE")],
      transitions: [tr("READY", "SENT", "happy", "READY moves to SENT."), tr("SENT", "DONE", "happy", "SENT moves to DONE.")],
    });
    expect(validateModel(model, doc)).toEqual([]);
  });

  it("still requires an exit from non-terminal states", () => {
    const model = base({
      initial: "READY",
      states: [st("READY"), st("SENT"), st("DONE")],
      transitions: [tr("READY", "SENT", "happy", "READY moves to SENT."), tr("SENT", "DONE", "happy", "SENT moves to DONE.")],
    });
    expect(validateModel(model, doc).join("\n")).toMatch(/DONE has no exit/);
  });

  it("counts states reachable through any layer", () => {
    const model = base({
      initial: "READY", terminal: ["DONE", "GONE"],
      states: [st("READY"), st("SENT"), st("DONE"), st("GONE")],
      transitions: [
        tr("READY", "SENT", "happy", "READY moves to SENT."),
        tr("SENT", "DONE", "happy", "SENT moves to DONE."),
        tr("READY", "GONE", "rst", "READY moves to GONE."),
      ],
    });
    expect(validateModel(model, doc)).toEqual([]);
  });
});

describe("long sub-sections and indented headings", () => {
  const filler = "   Some unrelated rule text that goes on. ".repeat(80);
  const doc = [
    "8.2.2.  Finite State Machine", "",
    "   OpenSent:", "", filler, "",
    "      If a valid OPEN is received, it changes its state to OpenConfirm.", "",
    "   OpenConfirm State:", "", filler, "",
    "      If the local system receives a KEEPALIVE, it changes its state to Established.", "",
  ].join("\n");
  const model = (from: string, to: string, quote: string): RfcVisualModel => ({
    rfc: 1, reviewed: false, headers: [], sequences: [], notShown: [],
    initial: from, terminal: ["OpenConfirm", "Established"],
    states: [
      { id: "OpenSent", cite: { section: "8.2.2", quote: "OpenSent:" } },
      { id: "OpenConfirm", cite: { section: "8.2.2", quote: "OpenConfirm State:" } },
      ...(to === "Established" ? [{ id: to, cite: { section: "8.2.2", quote } }] : []),
    ],
    transitions: [{ from, to, event: "e", layer: "happy", cite: { section: "8.2.2", quote } }],
  });

  it("accepts a rule far below its state's sub-heading", () => {
    expect(validateModel(model("OpenSent", "OpenConfirm",
      "If a valid OPEN is received, it changes its state to OpenConfirm."), doc)).toEqual([]);
  });

  it("rejects a rule whose nearest state sub-heading is a different state", () => {
    const wrong = model("OpenSent", "Established",
      "If the local system receives a KEEPALIVE, it changes its state to Established.");
    expect(validateModel(wrong, doc).join("\n")).toMatch(/OpenSent not named near the quote/);
  });

  it("finds indented multi-level and appendix headings", () => {
    const ospf = readFileSync("test/fixtures/rfc2328.txt", "utf8");
    const header = (section: string, quote: string): RfcVisualModel => ({
      rfc: 1, reviewed: false, states: [], transitions: [], sequences: [], notShown: [],
      headers: [{ id: "h", title: "H", fields: [], intro: { section, quote } }],
    });
    expect(validateModel(header("10.3", "The Neighbor state machine"), ospf)).toEqual([]);
    expect(validateModel(header("A.3.1", "The OSPF packet header"), ospf)).toEqual([]);
  });
});

describe("deepestSection", () => {
  it("names the most specific section that contains a quote", async () => {
    const { deepestSection } = await import("~/visuals/validate");
    const ospf = readFileSync("test/fixtures/rfc2328.txt", "utf8");
    expect(deepestSection(ospf, "The Neighbor state machine")).toBe("10.3");
    expect(deepestSection(text, "Enter the CLOSE-WAIT state.")).toBe("3.10.7.4");
  });
});

describe("header field order against the RFC's packet diagram", () => {
  const vxlan = readFileSync("test/fixtures/rfc7348.txt", "utf8");
  const field = (name: string, bits: number, quote: string) => ({ name, bits, explain: "", cite: { section: "5", quote } });
  const flags = field("Flags", 8, "Flags (8 bits): where the I flag MUST be set to 1");
  const vni = field("VXLAN Segment ID/VXLAN Network Identifier (VNI)", 24, "VXLAN Segment ID/VXLAN Network Identifier (VNI): this is a 24-bit value");
  const reserved = (bits: number) => field("Reserved", bits, "Reserved fields (24 bits and 8 bits): MUST be set to zero on transmission");
  const model = (fields: ReturnType<typeof field>[]): RfcVisualModel => ({
    rfc: 7348, reviewed: false, states: [], transitions: [], sequences: [], notShown: [],
    headers: [{ id: "vxlan", title: "VXLAN Header", intro: { section: "5", quote: "VXLAN Header: This is an 8-byte field that has:" }, fields }],
  });

  it("rejects fields drawn in a different order from the diagram", () => {
    expect(validateModel(model([flags, vni, reserved(32)]), vxlan).join("\n")).toMatch(/order/);
  });

  it("accepts the diagram's order", () => {
    expect(validateModel(model([flags, reserved(24), vni, reserved(8)]), vxlan)).toEqual([]);
  });
});
