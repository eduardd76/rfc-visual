import { validateDetailed } from "~/visuals/validate";
import type { RfcVisualModel } from "~/visuals/types";

// Design §5.4: withhold a visual when more than this share of its elements fail.
const MAX_REJECTED = 0.2;

export type PruneResult = {
  model: RfcVisualModel;
  /** Human-readable list of what was removed and why. */
  dropped: string[];
  withheld: boolean;
};

function countElements(model: RfcVisualModel): number {
  return (
    model.states.length +
    model.transitions.length +
    model.sequences.reduce((n, s) => n + 1 + s.steps.length, 0) +
    model.headers.reduce((n, h) => n + 1 + h.fields.length, 0)
  );
}

/**
 * Removes every element the validator rejects, then the whole state machine
 * if it is no longer sound. Withholds the visual if too much was rejected or
 * nothing is left.
 */
export function pruneModel(input: RfcVisualModel, rfcText: string): PruneResult {
  const model = structuredClone(input);
  const total = countElements(model);
  const dropped: string[] = [];
  let rejected = 0;

  for (let round = 0; round < 5; round++) {
    const issues = validateDetailed(model, rfcText);
    const elementIssues = issues.filter((i) => i.path !== "structure");
    if (elementIssues.length === 0) break;
    const bad = new Set(elementIssues.map((i) => i.path));
    for (const issue of elementIssues) dropped.push(issue.message);

    const keep = <T>(items: T[], prefix: string) =>
      items.filter((_, i) => {
        if (!bad.has(`${prefix}.${i}`)) return true;
        rejected += 1;
        return false;
      });
    model.states = keep(model.states, "states");
    model.transitions = keep(model.transitions, "transitions");
    model.sequences = model.sequences.filter((sequence, s) => {
      if (bad.has(`sequences.${s}.intro`)) {
        rejected += 1 + sequence.steps.length;
        return false;
      }
      sequence.steps = keep(sequence.steps, `sequences.${s}.steps`);
      return sequence.steps.length > 0;
    });
    model.headers = model.headers.filter((header, h) => {
      if (bad.has(`headers.${h}.intro`) || bad.has(`headers.${h}`)) {
        rejected += 1 + header.fields.length;
        return false;
      }
      header.fields = keep(header.fields, `headers.${h}.fields`);
      return header.fields.length > 0;
    });
  }

  const structure = validateDetailed(model, rfcText).filter((i) => i.path === "structure");
  if (model.states.length > 0 && structure.length > 0) {
    dropped.push(`state machine dropped: ${structure.map((i) => i.message).join("; ")}`);
    model.states = [];
    model.transitions = [];
    model.initial = undefined;
    model.terminal = [];
  }

  const empty = model.states.length === 0 && model.sequences.length === 0 && model.headers.length === 0;
  const withheld = total === 0 || empty || rejected / total > MAX_REJECTED;
  return { model, dropped, withheld };
}
