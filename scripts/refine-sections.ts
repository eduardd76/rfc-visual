// Narrows each cite in src/visuals/rfcN.ts to the deepest subsection that
// contains its quote (e.g. "10" → "10.3"). Never moves a cite sideways.
//   bun scripts/refine-sections.ts 2328
import { readFileSync, writeFileSync } from "node:fs";

import { deepestSection } from "../src/visuals/validate";

const num = process.argv[2];
const file = `src/visuals/rfc${num}.ts`;
const rfc = readFileSync(`test/fixtures/rfc${num}.txt`, "utf8");
let changed = 0;
const source = readFileSync(file, "utf8").replace(
  /section: "([^"]+)", quote: ("(?:[^"\\]|\\.)*")/g,
  (whole, section: string, rawQuote: string) => {
    const deeper = deepestSection(rfc, JSON.parse(rawQuote) as string);
    if (!deeper || deeper === section || !deeper.startsWith(`${section}.`)) return whole;
    changed += 1;
    return `section: "${deeper}", quote: ${rawQuote}`;
  },
);
writeFileSync(file, source);
console.log(`RFC ${num}: ${changed} cite(s) narrowed`);
