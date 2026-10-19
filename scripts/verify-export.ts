// Checks the static export before deploy: canonical RFC pages exist, the
// 404 redirector exists, and no file shadows an rfc-editor.org URL variant.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import type { RfcIndex } from "../src/rfc/types";

const OUT = "out";
const failures: string[] = [];

for (const path of ["rfc/rfc9293/index.html", "rfc/rfc793/index.html", "404.html", "search-index.json"]) {
  if (!existsSync(join(OUT, path))) failures.push(`missing ${path}`);
}
if (existsSync(join(OUT, "rfc/rfc9293.txt"))) {
  failures.push("out/rfc/rfc9293.txt exists and would shadow /rfc/rfc9293.txt");
}

// RFC links are plain <a> (full page loads), so Next's client-navigation
// payloads are pruned after the build to keep the deploy small.
const payloads = readdirSync(join(OUT, "rfc/rfc9293")).filter((name) => name.endsWith(".txt"));
if (payloads.length > 0) failures.push(`unpruned RSC payloads: ${payloads.join(", ")}`);

const index = JSON.parse(readFileSync("data/rfc-index.json", "utf8")) as RfcIndex;
const expected = Object.keys(index.entries).length;
const pages = readdirSync(join(OUT, "rfc")).filter((name) =>
  existsSync(join(OUT, "rfc", name, "index.html")),
).length;
if (pages !== expected) failures.push(`${pages} RFC pages, expected ${expected}`);

let files = 0;
let bytes = 0;
const walk = (dir: string) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path);
    else {
      files += 1;
      bytes += stat.size;
    }
  }
};
walk(OUT);
console.log(`out/: ${files} files, ${(bytes / 1024 / 1024).toFixed(1)} MiB, ${pages} RFC pages`);

if (failures.length > 0) {
  console.error(failures.map((f) => `✗ ${f}`).join("\n"));
  process.exit(1);
}
console.log("✓ export verified");
