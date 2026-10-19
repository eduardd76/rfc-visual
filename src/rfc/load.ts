import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { RfcIndex } from "~/rfc/types";

let cached: RfcIndex | null = null;

/** Build-time only: reads data/rfc-index.json written by `bun run sync:data`. */
export function loadRfcIndex(): RfcIndex {
  cached ??= JSON.parse(
    readFileSync(join(process.cwd(), "data", "rfc-index.json"), "utf8"),
  ) as RfcIndex;
  return cached;
}
