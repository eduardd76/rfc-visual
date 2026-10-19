import type { HeaderField, Layer, RfcVisualModel, Sequence } from "~/visuals/types";

const mermaidId = (state: string) => state.replace(/[^A-Za-z0-9]/g, "_");
// Characters that end or break a Mermaid label.
const safeLabel = (text: string) => text.replace(/[:;#{}"]/g, " ").replace(/\s+/g, " ").trim();

export function stateMachineToMermaid(model: RfcVisualModel, layers: Layer[]): string {
  const lines = ["stateDiagram-v2"];
  for (const { id } of model.states) {
    if (mermaidId(id) !== id) lines.push(`  state "${safeLabel(id)}" as ${mermaidId(id)}`);
  }
  if (model.initial) lines.push(`  [*] --> ${mermaidId(model.initial)}`);
  for (const t of model.transitions) {
    if (!layers.includes(t.layer)) continue;
    const label = safeLabel(t.action ? `${t.event} / ${t.action}` : t.event);
    lines.push(`  ${mermaidId(t.from)} --> ${mermaidId(t.to)} : ${label}`);
  }
  return lines.join("\n");
}

/** "<SEQ=300><ACK=101><CTL=SYN,ACK>" → "SYN,ACK seq=300 ack=101". */
export function formatSegment(segment: string): string {
  // Only RFC 9293-style "<SEQ=..><CTL=..>" notation is reformatted.
  if (!segment.startsWith("<")) return safeLabel(segment);
  const fields = new Map<string, string>();
  for (const [, key, value] of segment.matchAll(/<([A-Z]+)(?:=([^>]*))?>/g)) {
    fields.set(key!, value ?? "");
  }
  const flags = (fields.get("CTL") ?? "") + (fields.has("DATA") ? " + data" : "");
  const numbers = [
    fields.has("SEQ") ? `seq=${fields.get("SEQ")}` : "",
    fields.has("ACK") ? `ack=${fields.get("ACK")}` : "",
  ].filter(Boolean);
  return [flags, ...numbers].join(" ").trim();
}

export function sequenceToMermaid(sequence: Sequence): string {
  const names = sequence.participants ?? { a: "Peer A", b: "Peer B" };
  const lines = [
    "sequenceDiagram",
    `  participant A as ${safeLabel(names.a)}`,
    `  participant B as ${safeLabel(names.b)}`,
  ];
  if (sequence.start) {
    lines.push(
      `  Note over A: ${safeLabel(sequence.start.stateA)}`,
      `  Note over B: ${safeLabel(sequence.start.stateB)}`,
    );
  }
  for (const step of sequence.steps) {
    const arrow = step.from === "A" ? "A->>B" : "B->>A";
    lines.push(`  ${arrow}: ${formatSegment(step.segment)}`);
    if (step.stateA) lines.push(`  Note over A: ${safeLabel(step.stateA)}`);
    if (step.stateB) lines.push(`  Note over B: ${safeLabel(step.stateB)}`);
  }
  return lines.join("\n");
}

export type RowSegment = { name: string; bits: number | "var"; continued: boolean };

/** Packs header fields into rows of `wordBits`, splitting fields across rows. */
export function headerRows(fields: HeaderField[], wordBits = 32): RowSegment[][] {
  const rows: RowSegment[][] = [];
  let row: RowSegment[] = [];
  let used = 0;
  const flush = () => {
    if (row.length > 0) rows.push(row);
    row = [];
    used = 0;
  };
  for (const field of fields) {
    if (field.bits === "var") {
      flush();
      rows.push([{ name: field.name, bits: "var", continued: false }]);
      continue;
    }
    let remaining = field.bits;
    let continued = false;
    while (remaining > 0) {
      const take = Math.min(remaining, wordBits - used);
      row.push({ name: field.name, bits: take, continued });
      used += take;
      remaining -= take;
      continued = true;
      if (used === wordBits) flush();
    }
  }
  flush();
  return rows;
}
