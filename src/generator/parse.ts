import type { RfcVisualModel } from "~/visuals/types";

export type ParseResult = { ok: true; model: RfcVisualModel } | { ok: false; error: string };

/** The outermost JSON object in a model reply, with or without ``` fences. */
function extractJson(reply: string): string | null {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(reply)?.[1];
  const text = fenced ?? reply;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start === -1 || end <= start ? null : text.slice(start, end + 1);
}

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export function parseModelReply(reply: string, rfc: number): ParseResult {
  const json = extractJson(reply);
  if (!json) return { ok: false, error: "no JSON object in reply" };
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(json) as Record<string, unknown>;
  } catch (error) {
    return { ok: false, error: `invalid JSON: ${(error as Error).message}` };
  }
  if (typeof raw !== "object" || raw === null) return { ok: false, error: "reply is not an object" };
  const model: RfcVisualModel = {
    rfc,
    reviewed: false,
    initial: typeof raw.initial === "string" ? raw.initial : undefined,
    terminal: asArray<string>(raw.terminal),
    stateMachineTitle: typeof raw.stateMachineTitle === "string" ? raw.stateMachineTitle : undefined,
    states: asArray(raw.states),
    transitions: asArray(raw.transitions),
    sequences: asArray(raw.sequences),
    headers: asArray(raw.headers),
    notShown: asArray<string>(raw.notShown).filter((item) => typeof item === "string"),
  };
  return { ok: true, model };
}
