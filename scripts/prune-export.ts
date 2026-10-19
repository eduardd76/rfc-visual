// Removes Next's RSC navigation payloads (*.txt) from the per-RFC pages.
// Nothing navigates to an RFC page client-side, and keeping them would
// quadruple the deploy's file count (~49k files instead of ~10k).
import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const RFC_DIR = join("out", "rfc");
let removed = 0;
for (const page of readdirSync(RFC_DIR)) {
  for (const name of readdirSync(join(RFC_DIR, page))) {
    if (name.endsWith(".txt")) {
      rmSync(join(RFC_DIR, page, name));
      removed += 1;
    }
  }
}
console.log(`Pruned ${removed} RSC payload files from out/rfc.`);
