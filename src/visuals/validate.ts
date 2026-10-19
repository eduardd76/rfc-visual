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

/** Names a field may appear under in a packet diagram: "Foo (FOO)" → Foo, FOO. */
function diagramKeys(name: string): string[] {
  const keys = [name, ...name.split("/")];
  for (const part of [...keys]) {
    const paren = /\(([^)]+)\)/.exec(part)?.[1];
    if (paren) keys.push(paren);
    keys.push(part.replace(/\s*\([^)]*\)/, ""), part.replace(/\s+fields?$/i, ""));
  }
  return [...new Set(keys.map((k) => k.trim().toLowerCase()).filter((k) => k.length >= 2))];
}

/**
 * Checks that header fields are listed in the order the RFC's ASCII packet
 * diagram draws them. Uses the diagram block naming the most fields; fields
 * the diagram does not name (e.g. flag bits drawn as letters) are skipped.
 */
function headerOrderIssue(fields: { name: string }[], rfcText: string): string | undefined {
  const blocks: string[] = [];
  let current: string[] = [];
  for (const line of rfcText.split("\n")) {
    if (/^\s*[|+]/.test(line)) current.push(line);
    else if (current.length > 0) {
      blocks.push(current.join("\n").toLowerCase());
      current = [];
    }
  }
  if (current.length > 0) blocks.push(current.join("\n").toLowerCase());

  // Whole-word search, so "type" does not match inside "Type-Specific".
  const find = (block: string, key: string, from: number) => {
    const match = new RegExp(`(?<![a-z0-9])${escapeRegExp(key)}(?![a-z0-9])`, "g");
    match.lastIndex = from;
    return match.exec(block)?.index ?? -1;
  };
  const named = (block: string) =>
    fields.filter((f) => diagramKeys(f.name).some((key) => find(block, key, 0) !== -1)).length;
  // Only real packet diagrams: bit-cell borders such as "+-+-+-+".
  const block = blocks.filter((b) => b.includes("+-+-+")).reduce<string | undefined>(
    (best, b) => (named(b) > (best ? named(best) : 0) ? b : best),
    undefined,
  );
  if (!block || named(block) < 2) return undefined;

  // Each repeated name (two "Reserved" fields) takes its next occurrence.
  const used = new Map<string, number>();
  let previous: { name: string; at: number } | undefined;
  for (const field of fields) {
    let at = -1;
    let usedKey = "";
    for (const key of diagramKeys(field.name)) {
      const from = used.get(key) ?? 0;
      const found = find(block, key, from);
      if (found !== -1 && (at === -1 || found < at)) {
        at = found;
        usedKey = key;
      }
    }
    if (at === -1) continue;
    used.set(usedKey, at + usedKey.length);
    if (previous && at < previous.at) {
      return `field order differs from the RFC diagram (${field.name} is drawn before ${previous.name})`;
    }
    previous = { name: field.name, at };
  }
  return undefined;
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

/**
 * A validation problem and the element it belongs to: "states.2",
 * "transitions.5", "sequences.0.steps.3", "headers.1.fields.0", "headers.1",
 * or "structure" for state-machine shape problems.
 */
export type ValidationIssue = { path: string; message: string };

export function validateModel(model: RfcVisualModel, rfcText: string): string[] {
  return validateDetailed(model, rfcText).map((issue) => issue.message);
}

export function validateDetailed(model: RfcVisualModel, rfcText: string): ValidationIssue[] {
  const text = normalizeRfcText(rfcText);
  const sections = sectionsOf(rfcText);
  const issues: ValidationIssue[] = [];
  let path = "";
  const report = (message: string) => {
    issues.push({ path, message });
  };

  /** Position of the quote inside its cited section, or null with an issue. */
  function locate(cite: Cite, what: string): number | null {
    const quote = normalizeRfcText(cite.quote);
    const section =
      cite.section === "-" ? { title: "", start: 0, end: text.length } : sections.get(cite.section);
    if (!section) {
      report(`${what}: section ${cite.section} not found`);
      return null;
    }
    const at = text.indexOf(quote, section.start);
    if (at === -1 && !text.includes(quote)) {
      report(`${what}: quote not found in RFC: "${quote}"`);
      return null;
    }
    if (at === -1 || at + quote.length > section.end) {
      report(`${what}: quote not in section ${cite.section}: "${quote}"`);
      return null;
    }
    return at;
  }

  const stateIds = new Set(model.states.map((s) => s.id));
  model.states.forEach((state, i) => {
    path = `states.${i}`;
    const what = `state ${state.id}`;
    if (locate(state.cite, what) !== null && !mentions(state.cite.quote, state.id)) {
      report(`${what}: quote does not mention ${state.id}`);
    }
  });

  model.transitions.forEach((t, i) => {
    path = `transitions.${i}`;
    const what = `${t.from} → ${t.to} (${t.event})`;
    for (const id of [t.from, t.to]) {
      if (!stateIds.has(id)) report(`${what}: unknown state ${id}`);
    }
    const at = locate(t.cite, what);
    if (at === null) return;
    const quote = t.cite.quote;
    const toOk =
      mentions(quote, t.to) || (t.to === "CLOSED" && /delete (the )?TCB/i.test(quote));
    if (!toOk) report(`${what}: quote does not mention ${t.to}`);
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
      report(`${what}: ${t.from} not named near the quote`);
    }
  });

  model.sequences.forEach((sequence, s) => {
    path = `sequences.${s}.intro`;
    locate(sequence.intro, `sequence ${sequence.id} intro`);
    sequence.steps.forEach((step, i) => {
      path = `sequences.${s}.steps.${i}`;
      const what = `sequence ${sequence.id} step ${i + 1}`;
      if (locate(step.cite, what) === null) return;
      const quote = normalizeRfcText(step.cite.quote);
      if (!quote.includes(step.segment)) report(`${what}: segment ${step.segment} not in quote`);
      for (const state of [step.stateA, step.stateB]) {
        if (state && !mentions(quote, state)) report(`${what}: quote does not mention ${state}`);
      }
    });
  });

  model.headers.forEach((header, h) => {
    path = `headers.${h}.intro`;
    locate(header.intro, `header ${header.id} intro`);
    let fixedBits = 0;
    let fixedPrefix = true;
    header.fields.forEach((field, f) => {
      path = `headers.${h}.fields.${f}`;
      const what = `header ${header.id} field ${field.name}`;
      if (locate(field.cite, what) !== null && !mentions(normalizeRfcText(field.cite.quote), field.name)) {
        report(`${what}: quote does not mention ${field.name}`);
      }
      if (field.bits === "var") fixedPrefix = false;
      else if (fixedPrefix) fixedBits += field.bits;
    });
    path = `headers.${h}`;
    const order = headerOrderIssue(header.fields, rfcText);
    if (order) report(`header ${header.id}: ${order}`);
    if (fixedBits % 8 !== 0) {
      report(`header ${header.id}: fixed fields total ${fixedBits} bits, not a whole number of octets`);
    }
  });

  path = "structure";
  if (model.states.length === 0) return issues;
  if (!model.initial) {
    report("model has states but no initial state");
    return issues;
  }

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
    if (!reachable.has(id)) report(`${id} is unreachable from ${model.initial}`);
    const terminal = model.terminal?.includes(id) ?? false;
    if (id !== model.initial && !terminal && !model.transitions.some((t) => t.from === id)) {
      report(`${id} has no exit`);
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
