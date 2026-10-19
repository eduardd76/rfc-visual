import type { Cite, RfcVisualModel } from "~/visuals/types";

// How far back from a quote the source state may be named (its sub-heading).
const FROM_STATE_WINDOW = 1500;

/** Joins words hyphenated across a line break, then collapses whitespace. */
export function normalizeRfcText(text: string): string {
  return text
    .replace(/([A-Za-z0-9])-\n\s*/g, "$1-")
    .replace(/\s+/g, " ")
    .trim();
}

type Section = { title: string; start: number; end: number };

/** Section bounds by top-level heading lines ("3.10.7.4.  Other States"). */
function sectionsOf(raw: string): Map<string, Section> {
  const lines = raw.split("\n");
  const headings: { id: string; title: string; line: number }[] = [];
  const seen = new Set<string>();
  lines.forEach((line, i) => {
    // "3.10.7.4.  Other States", "4.1.1. Header section format", "4.4.1 Initialization ..."
    const match =
      /^(\d+(?:\.\d+)*)\.\s+([A-Za-z].*)$/.exec(line) ??
      /^(\d+\.\d+(?:\.\d+)*)\s+([A-Za-z].*)$/.exec(line) ??
      // Indented multi-level headings: "    10.3.  The Neighbor state machine"
      /^\s{1,4}(\d+\.\d+(?:\.\d+)*)\.\s{2}([A-Za-z].*)$/.exec(line) ??
      // "Appendix A.  State Machine", "A.1.  Client", "Appendix C: ...", "A.3.1 The OSPF ..."
      /^(?:Appendix\s+)?([A-Z](?:\.\d+)*)[.:]\s+([A-Za-z].*)$/.exec(line) ??
      /^([A-Z](?:\.\d+)+)\s+([A-Za-z].*)$/.exec(line);
    // Skip table-of-contents lines ("2. Design .......... 5").
    if (!match || /\.\s?\.\s?\./.test(line) || seen.has(match[1]!)) return;
    seen.add(match[1]!);
    headings.push({ id: match[1]!, title: match[2]!.trim(), line: i });
  });
  const sections = new Map<string, Section>();
  headings.forEach((heading, i) => {
    // A section includes its subsections: it ends at the next non-descendant heading.
    const next = headings.slice(i + 1).find((h) => !h.id.startsWith(`${heading.id}.`));
    const end = next?.line ?? lines.length;
    sections.set(heading.id, {
      title: heading.title,
      start: normalizeRfcText(lines.slice(0, heading.line).join("\n")).length,
      end: normalizeRfcText(lines.slice(0, end).join("\n")).length,
    });
  });
  return sections;
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The state whose sub-heading ("OpenSent:", "OpenConfirm State:") comes last
 * in `text`, i.e. the state a rule further down belongs to.
 */
function nearestStateHeading(text: string, states: string[]): string | undefined {
  let best: { state: string; at: number } | undefined;
  for (const state of states) {
    const pattern = new RegExp(`(?:^|\\s)${escapeRegExp(state)}(?:\\s+state)?:`, "gi");
    for (const match of text.matchAll(pattern)) {
      if (!best || match.index > best.at) best = { state, at: match.index };
    }
  }
  return best?.state;
}

const mentions = (haystack: string, state: string) =>
  haystack.toUpperCase().includes(state.toUpperCase());

export function validateModel(model: RfcVisualModel, rfcText: string): string[] {
  const text = normalizeRfcText(rfcText);
  const sections = sectionsOf(rfcText);
  const issues: string[] = [];

  /** Position of the quote inside its cited section, or null with an issue. */
  function locate(cite: Cite, what: string): number | null {
    const quote = normalizeRfcText(cite.quote);
    const section =
      cite.section === "-" ? { title: "", start: 0, end: text.length } : sections.get(cite.section);
    if (!section) {
      issues.push(`${what}: section ${cite.section} not found`);
      return null;
    }
    const at = text.indexOf(quote, section.start);
    if (at === -1 && !text.includes(quote)) {
      issues.push(`${what}: quote not found in RFC: "${quote}"`);
      return null;
    }
    if (at === -1 || at + quote.length > section.end) {
      issues.push(`${what}: quote not in section ${cite.section}: "${quote}"`);
      return null;
    }
    return at;
  }

  const stateIds = new Set(model.states.map((s) => s.id));
  for (const state of model.states) {
    const what = `state ${state.id}`;
    if (locate(state.cite, what) !== null && !mentions(state.cite.quote, state.id)) {
      issues.push(`${what}: quote does not mention ${state.id}`);
    }
  }

  for (const t of model.transitions) {
    const what = `${t.from} → ${t.to} (${t.event})`;
    for (const id of [t.from, t.to]) {
      if (!stateIds.has(id)) issues.push(`${what}: unknown state ${id}`);
    }
    const at = locate(t.cite, what);
    if (at === null) continue;
    const quote = t.cite.quote;
    const toOk =
      mentions(quote, t.to) || (t.to === "CLOSED" && /delete (the )?TCB/i.test(quote));
    if (!toOk) issues.push(`${what}: quote does not mention ${t.to}`);
    const before = text.slice(Math.max(0, at - FROM_STATE_WINDOW), at);
    const title = t.cite.section === "-" ? "" : (sections.get(t.cite.section)?.title ?? "");
    const sectionStart = t.cite.section === "-" ? 0 : (sections.get(t.cite.section)?.start ?? 0);
    const heading = nearestStateHeading(text.slice(sectionStart, at), [...stateIds]);
    if (
      !mentions(quote, t.from) &&
      !mentions(title, t.from) &&
      !mentions(before, t.from) &&
      heading !== t.from
    ) {
      issues.push(`${what}: ${t.from} not named near the quote`);
    }
  }

  for (const sequence of model.sequences) {
    locate(sequence.intro, `sequence ${sequence.id} intro`);
    sequence.steps.forEach((step, i) => {
      const what = `sequence ${sequence.id} step ${i + 1}`;
      if (locate(step.cite, what) === null) return;
      const quote = normalizeRfcText(step.cite.quote);
      if (!quote.includes(step.segment)) issues.push(`${what}: segment ${step.segment} not in quote`);
      for (const state of [step.stateA, step.stateB]) {
        if (state && !mentions(quote, state)) issues.push(`${what}: quote does not mention ${state}`);
      }
    });
  }

  for (const header of model.headers) {
    locate(header.intro, `header ${header.id} intro`);
    let fixedBits = 0;
    let fixedPrefix = true;
    for (const field of header.fields) {
      const what = `header ${header.id} field ${field.name}`;
      if (locate(field.cite, what) !== null && !mentions(normalizeRfcText(field.cite.quote), field.name)) {
        issues.push(`${what}: quote does not mention ${field.name}`);
      }
      if (field.bits === "var") fixedPrefix = false;
      else if (fixedPrefix) fixedBits += field.bits;
    }
    if (fixedBits % 8 !== 0) {
      issues.push(`header ${header.id}: fixed fields total ${fixedBits} bits, not a whole number of octets`);
    }
  }

  if (model.states.length === 0) return issues;
  if (!model.initial) return [...issues, "model has states but no initial state"];

  // Structure: every state reachable, every non-terminal state has a way out.
  const reachable = new Set([model.initial]);
  for (let grew = true; grew; ) {
    grew = false;
    for (const t of model.transitions) {
      if (reachable.has(t.from) && !reachable.has(t.to)) {
        reachable.add(t.to);
        grew = true;
      }
    }
  }
  for (const id of stateIds) {
    if (!reachable.has(id)) issues.push(`${id} is unreachable from ${model.initial}`);
    const terminal = model.terminal?.includes(id) ?? false;
    if (id !== model.initial && !terminal && !model.transitions.some((t) => t.from === id)) {
      issues.push(`${id} has no exit`);
    }
  }

  return issues;
}

/** The most specific section holding the first in-section occurrence of `quote`. */
export function deepestSection(rfcText: string, quote: string): string | undefined {
  const text = normalizeRfcText(rfcText);
  const needle = normalizeRfcText(quote);
  const sections = [...sectionsOf(rfcText)];
  // Earlier occurrences may sit in the table of contents, outside every section.
  for (let at = text.indexOf(needle); at !== -1; at = text.indexOf(needle, at + 1)) {
    let best: { id: string; size: number } | undefined;
    for (const [id, section] of sections) {
      const size = section.end - section.start;
      if (section.start <= at && at < section.end && (!best || size < best.size)) best = { id, size };
    }
    if (best) return best.id;
  }
  return undefined;
}
