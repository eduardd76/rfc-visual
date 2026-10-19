// Writes public/search-index.json for the client-side search box.
// Run after `bun run sync:data`; part of `bun run build`.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

import type { SearchEntry } from "../src/rfc/search";
import type { RfcIndex } from "../src/rfc/types";
import { allVisuals } from "../src/visuals/registry";

const index = JSON.parse(readFileSync("data/rfc-index.json", "utf8")) as RfcIndex;
const withVisual = new Set(allVisuals().map((m) => m.rfc));
const entries: SearchEntry[] = Object.values(index.entries).map((e) => [
  e.num,
  e.title,
  e.status,
  e.obsoletedBy.length > 0 ? 1 : 0,
  withVisual.has(e.num) ? 1 : 0,
]);

mkdirSync("public", { recursive: true });
const json = JSON.stringify(entries);
writeFileSync("public/search-index.json", json);
console.log(`Wrote public/search-index.json: ${entries.length} RFCs, ${(json.length / 1024).toFixed(0)} KiB`);
