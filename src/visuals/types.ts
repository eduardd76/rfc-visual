/** A verbatim span of RFC text and the section it sits in. */
export type Cite = {
  /** Section number, or "-" for RFCs with no numbered sections (whole document). */
  section: string;
  quote: string;
};

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
  /** The message as the RFC writes it; must appear in the quote. */
  segment: string;
  /** Each side's state after this step, when the RFC gives one. */
  stateA?: string;
  stateB?: string;
  /** Plain-English summary; the quote is authoritative. */
  explain: string;
  cite: Cite;
};

export type Sequence = {
  id: string;
  title: string;
  /** Participant names, e.g. { a: "Client", b: "Server" }. Default Peer A / Peer B. */
  participants?: { a: string; b: string };
  intro: Cite;
  start?: { stateA: string; stateB: string };
  steps: SequenceStep[];
};

export type HeaderField = {
  name: string;
  /** Width in bits, or "var" for variable-length fields. */
  bits: number | "var";
  /** What the field means, in plain English; the quote is authoritative. */
  explain: string;
  cite: Cite;
};

export type Header = {
  id: string;
  title: string;
  intro: Cite;
  fields: HeaderField[];
};

export type RfcVisualModel = {
  rfc: number;
  /** Required when the model has states. */
  initial?: string;
  /** States the RFC defines as final; they need no exit. */
  terminal?: string[];
  /** Tab label for the state machine, e.g. "BGP FSM". Default "State machine". */
  stateMachineTitle?: string;
  reviewed: boolean;
  states: StateDef[];
  transitions: Transition[];
  sequences: Sequence[];
  headers: Header[];
  notShown: string[];
};
