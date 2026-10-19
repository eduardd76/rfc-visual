// Validates one hand-built visual model against its RFC text:
//   bun scripts/validate-visual.ts 768
// Reads src/visuals/rfc768.ts (export `rfc768`) and test/fixtures/rfc768.txt.
import { existsSync, readFileSync } from "node:fs";

import type { RfcVisualModel } from "../src/visuals/types";
import { validateModel } from "../src/visuals/validate";

const num = process.argv[2];
if (!num || !/^\d+$/.test(num)) {
  console.error("usage: bun scripts/validate-visual.ts <rfc-number>");
  process.exit(2);
}
const fixture = `test/fixtures/rfc${num}.txt`;
if (!existsSync(fixture)) {
  console.error(`missing ${fixture}: curl -sS https://www.rfc-editor.org/rfc/rfc${num}.txt -o ${fixture}`);
  process.exit(2);
}
const loaded = (await import(`../src/visuals/rfc${num}.ts`)) as Record<string, RfcVisualModel>;
const model = loaded[`rfc${num}`];
if (!model) {
  console.error(`src/visuals/rfc${num}.ts must export const rfc${num}`);
  process.exit(2);
}
const issues = validateModel(model, readFileSync(fixture, "utf8"));
const counts = `${model.states.length} states, ${model.transitions.length} transitions, ${model.sequences.length} sequences, ${model.headers.length} headers`;
if (issues.length > 0) {
  console.error(`✗ RFC ${num}: ${issues.length} issue(s) (${counts})\n${issues.map((i) => `  - ${i}`).join("\n")}`);
  process.exit(1);
}
console.log(`✓ RFC ${num} valid (${counts})`);
