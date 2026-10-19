// Downloads the rfc-editor.org index and errata into data/rfc-index.json.
import { mkdirSync, writeFileSync } from "node:fs";

import { buildRfcIndex } from "../src/rfc/parse-index";

const INDEX_URL = "https://www.rfc-editor.org/rfc-index.xml";
const ERRATA_URL = "https://www.rfc-editor.org/api/v1/errata.json";
// 9,848 entries on 2026-10-19; far fewer means a truncated or changed feed.
const MIN_ENTRIES = 9000;

async function fetchOk(url: string): Promise<Response> {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`${url} → HTTP ${response.status}`);
  return response;
}

const [xml, errata] = await Promise.all([
  fetchOk(INDEX_URL).then((r) => r.text()),
  fetchOk(ERRATA_URL).then((r) => r.json() as Promise<unknown[]>),
]);

const index = buildRfcIndex(xml, errata, new Date().toISOString());
const count = Object.keys(index.entries).length;
if (count < MIN_ENTRIES) {
  console.error(`Only ${count} RFC entries parsed (expected ≥ ${MIN_ENTRIES}).`);
  process.exit(1);
}

mkdirSync("data", { recursive: true });
writeFileSync("data/rfc-index.json", JSON.stringify(index));
console.log(`Wrote data/rfc-index.json: ${count} RFCs, ${errata.length} errata.`);
