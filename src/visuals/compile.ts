import type { Layer, RfcVisualModel, Sequence } from "~/visuals/types";

const mermaidId = (state: string) => state.replace(/-/g, "_");

export function stateMachineToMermaid(model: RfcVisualModel, layers: Layer[]): string {
  const lines = ["stateDiagram-v2"];
  for (const { id } of model.states) {
    if (id.includes("-")) lines.push(`  state "${id}" as ${mermaidId(id)}`);
  }
  lines.push(`  [*] --> ${mermaidId(model.initial)}`);
  for (const t of model.transitions) {
    if (!layers.includes(t.layer)) continue;
    const label = t.action ? `${t.event} / ${t.action}` : t.event;
    lines.push(`  ${mermaidId(t.from)} --> ${mermaidId(t.to)} : ${label}`);
  }
  return lines.join("\n");
}

/** "<SEQ=300><ACK=101><CTL=SYN,ACK>" → "SYN,ACK seq=300 ack=101". */
export function formatSegment(segment: string): string {
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
  const lines = [
    "sequenceDiagram",
    "  participant A as Peer A",
    "  participant B as Peer B",
    `  Note over A: ${sequence.start.stateA}`,
    `  Note over B: ${sequence.start.stateB}`,
  ];
  for (const step of sequence.steps) {
    const arrow = step.from === "A" ? "A->>B" : "B->>A";
    lines.push(`  ${arrow}: ${formatSegment(step.segment)}`);
    lines.push(`  Note over A: ${step.stateA}`);
    lines.push(`  Note over B: ${step.stateB}`);
  }
  return lines.join("\n");
}
