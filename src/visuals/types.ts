/** A verbatim span of RFC text and the section it sits in. */
export type Cite = { section: string; quote: string };

/** happy: normal open/close; rst: reset handling; error: ABORT and timeouts. */
export type Layer = "happy" | "rst" | "error";

export type StateDef = { id: string; cite: Cite };

export type Transition = {
  from: string;
  to: string;
  event: string;
  action?: string;
  layer: Layer;
  cite: Cite;
  /** e.g. present in the prose but omitted from the RFC's own figure. */
  note?: string;
};

export type SequenceStep = {
  /** Who sends: A → B or B → A. */
  from: "A" | "B";
  segment: string;
  stateA: string;
  stateB: string;
  /** Plain-English summary; the quote is authoritative. */
  explain: string;
  cite: Cite;
};

export type Sequence = {
  id: string;
  title: string;
  intro: Cite;
  start: { stateA: string; stateB: string };
  steps: SequenceStep[];
};

export type RfcVisualModel = {
  rfc: number;
  initial: string;
  reviewed: boolean;
  states: StateDef[];
  transitions: Transition[];
  sequences: Sequence[];
  notShown: string[];
};
