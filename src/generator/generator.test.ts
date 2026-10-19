import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { parseModelReply } from "~/generator/parse";
import { pruneModel } from "~/generator/prune";
import { pickQueue } from "~/generator/queue";
import type { RfcEntry } from "~/rfc/types";
import { rfc768 } from "~/visuals/rfc768";
import { rfc9293 } from "~/visuals/rfc9293";
import type { RfcVisualModel } from "~/visuals/types";

const udpText = readFileSync("test/fixtures/rfc768.txt", "utf8");
const tcpText = readFileSync("test/fixtures/rfc9293.txt", "utf8");

describe("parseModelReply", () => {
  it("extracts JSON from a fenced reply and fills defaults", () => {
    const reply = 'Here you go:\n```json\n{"headers":[{"id":"h","title":"H","intro":{"section":"-","quote":"x"},"fields":[]}]}\n```';
    const result = parseModelReply(reply, 768);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.model.rfc).toBe(768);
    expect(result.model.reviewed).toBe(false);
    expect(result.model.states).toEqual([]);
    expect(result.model.headers).toHaveLength(1);
  });

  it("forces the RFC number even if the model claims another", () => {
    const result = parseModelReply('{"rfc": 1, "states": []}', 768);
    expect(result.ok && result.model.rfc).toBe(768);
  });

  it("reports unparseable replies", () => {
    expect(parseModelReply("I cannot help with that.", 768).ok).toBe(false);
  });
});

describe("pruneModel", () => {
  it("keeps a valid model unchanged", () => {
    const result = pruneModel(structuredClone(rfc768), udpText);
    expect(result.withheld).toBe(false);
    expect(result.dropped).toEqual([]);
    expect(result.model.headers[0]?.fields).toHaveLength(5);
  });

  it("drops only the invalid element and records it", () => {
    const model = structuredClone(rfc768);
    model.headers[0]!.fields.push({ name: "Magic", bits: 8, explain: "", cite: { section: "-", quote: "a magic octet" } });
    model.headers[0]!.fields.splice(4, 0, model.headers[0]!.fields.pop()!); // before the variable data
    // 6 fields + intro = 7 elements, 1 bad → 14% → kept
    const result = pruneModel(model, udpText);
    expect(result.withheld).toBe(false);
    expect(result.model.headers[0]?.fields.map((f) => f.name)).not.toContain("Magic");
    expect(result.dropped.join("\n")).toMatch(/Magic/);
  });

  it("withholds the visual when more than 20% of elements fail", () => {
    const model = structuredClone(rfc768);
    for (const field of model.headers[0]!.fields.slice(0, 3)) field.cite.quote = "not in the RFC at all";
    expect(pruneModel(model, udpText).withheld).toBe(true);
  });

  it("drops a state machine that is no longer sound after pruning, keeping the rest", () => {
    const model: RfcVisualModel = structuredClone(rfc9293);
    // Break the only way out of LAST-ACK: its exit transition now cites nothing real.
    const exit = model.transitions.find((t) => t.from === "LAST-ACK" && t.layer === "happy")!;
    exit.cite.quote = "LAST-ACK goes away";
    const others = model.transitions.filter((t) => t.from === "LAST-ACK" && t !== exit);
    model.transitions = model.transitions.filter((t) => !others.includes(t));
    const result = pruneModel(model, tcpText);
    expect(result.model.states).toEqual([]);
    expect(result.model.transitions).toEqual([]);
    expect(result.model.sequences).toHaveLength(2);
    expect(result.dropped.join("\n")).toMatch(/state machine/);
  });
});

describe("pickQueue", () => {
  const entry = (num: number, over: Partial<RfcEntry> = {}): RfcEntry => ({
    num, title: `RFC ${num}`, authors: [], date: "", status: "PROPOSED STANDARD", stream: "IETF",
    formats: ["TXT"], obsoletes: [], obsoletedBy: [], updates: [], updatedBy: [],
    errata: { verified: 0, held: 0, reported: 0 }, ...over,
  });
  const entries = {
    1: entry(1, { status: "UNKNOWN" }),
    2: entry(2, { obsoletedBy: [3] }),
    3: entry(3, { updatedBy: [10, 11] }),
    4: entry(4, { updatedBy: [10, 11, 12] }),
    5: entry(5, { status: "INFORMATIONAL", updatedBy: [10, 11, 12, 13] }),
    6: entry(6, { updatedBy: [10] }),
    7: entry(7, { formats: ["PDF"] }),
    8: entry(8, { status: "HISTORIC" }),
  };

  it("picks current standards-track RFCs without a visual, most-updated first", () => {
    expect(pickQueue(entries, new Set([6]), 10)).toEqual([4, 3, 5]);
  });

  it("respects the limit", () => {
    expect(pickQueue(entries, new Set(), 2)).toEqual([4, 3]);
  });
});
