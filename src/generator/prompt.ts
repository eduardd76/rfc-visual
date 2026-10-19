import type { Message } from "~/generator/openrouter";

// Free models handle long context, but the RFC text dominates the budget.
const DEFAULT_MAX_CHARS = 300_000;
const MAX_ISSUES_IN_REPAIR = 40;

export function buildMessages({
  num,
  title,
  text,
  guide,
  schema,
  example,
  maxChars = DEFAULT_MAX_CHARS,
}: {
  num: number;
  title: string;
  text: string;
  /** docs/visual-authoring.md */
  guide: string;
  /** src/visuals/types.ts */
  schema: string;
  /** A hand-built model as JSON. */
  example: string;
  maxChars?: number;
}): Message[] {
  const truncated = text.length > maxChars;
  const system = [
    "You build citation-checked visual explanations of IETF RFCs for network engineers.",
    "Follow these authoring rules exactly. An automated validator checks every quote against the RFC text; anything that fails is removed.",
    "",
    guide,
    "",
    "Return ONE JSON object matching the RfcVisualModel type below (omit `rfc` and `reviewed`). No prose, no markdown.",
    "",
    schema,
    "",
    "Example of a valid model (RFC 792):",
    example,
  ].join("\n");
  const user = [
    `RFC ${num}: ${title}`,
    truncated ? `(Text truncated to the first ${maxChars} characters; only cite what is below.)` : "",
    "",
    text.slice(0, maxChars),
  ].join("\n");
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

export function repairMessage(issues: string[]): Message {
  const shown = issues.slice(0, MAX_ISSUES_IN_REPAIR);
  return {
    role: "user",
    content: [
      "The validator rejected these elements:",
      ...shown.map((issue) => `- ${issue}`),
      issues.length > shown.length ? `- … and ${issues.length - shown.length} more` : "",
      "",
      "Fix each one: use a quote that exists verbatim in the cited section and names the element, or remove the element.",
      "Return the complete corrected JSON object.",
    ].join("\n"),
  };
}
