// Phase 1 generator: drafts visuals for RFCs without one, using free
// OpenRouter models, and keeps only what passes the citation validator.
//
//   OPENROUTER_API_KEY=... bun scripts/generate-visuals.ts
//
// Env: OPENROUTER_MODELS (comma-separated, in order of preference),
//      MAX_REQUESTS (default 45; the free tier allows 50/day without credits),
//      MAX_RFCS (default 25), ONLY (comma-separated RFC numbers, for testing).
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";

import { BudgetExhausted, createClient, type Message } from "../src/generator/openrouter";
import { parseModelReply } from "../src/generator/parse";
import { buildMessages, repairMessage } from "../src/generator/prompt";
import { pruneModel } from "../src/generator/prune";
import { pickQueue } from "../src/generator/queue";
import type { RfcIndex } from "../src/rfc/types";
import { rfc792 } from "../src/visuals/rfc792";
import type { RfcVisualModel } from "../src/visuals/types";
import { validateModel } from "../src/visuals/validate";

const GENERATED_DIR = "src/visuals/generated";

/** Rewrites generated/index.ts from the rfcN.json files actually on disk. */
function writeGeneratedIndex() {
  const nums = readdirSync(GENERATED_DIR)
    .map((f) => /^rfc(\d+)\.json$/.exec(f)?.[1])
    .filter((n): n is string => Boolean(n))
    .map(Number)
    .sort((a, b) => a - b);
  const lines = [
    "// Written by scripts/generate-visuals.ts — do not edit by hand.",
    ...nums.map((n) => `import rfc${n} from "./rfc${n}.json";`),
    'import type { RfcVisualModel } from "~/visuals/types";',
    "",
    `export const GENERATED: RfcVisualModel[] = [${nums.map((n) => `rfc${n}`).join(", ")}] as RfcVisualModel[];`,
    "",
  ];
  writeFileSync(`${GENERATED_DIR}/index.ts`, lines.join("\n"));
}

// Before loading the registry: a deleted draft must not break its import.
writeGeneratedIndex();
const { allVisuals } = await import("../src/visuals/registry");
const FAILED_FILE = `${GENERATED_DIR}/failed.json`;
const TEXT_DIR = "data/rfc-text";
const RETRY_FAILED_AFTER_DAYS = 30;
const DEFAULT_MODELS = [
  "google/gemma-4-31b-it:free",
  "minimax/minimax-m3.1-flash:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "nvidia/nemotron-3.5-super-vl:free",
];

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.error("OPENROUTER_API_KEY is not set");
  process.exit(2);
}
const models = (process.env.OPENROUTER_MODELS?.split(",").map((m) => m.trim()).filter(Boolean)) ?? DEFAULT_MODELS;
const maxRequests = Number(process.env.MAX_REQUESTS ?? 45);
const maxRfcs = Number(process.env.MAX_RFCS ?? 25);

type Failed = Record<string, { at: string; reason: string }>;
const failed: Failed = existsSync(FAILED_FILE) ? (JSON.parse(readFileSync(FAILED_FILE, "utf8")) as Failed) : {};
const recentlyFailed = new Set(
  Object.entries(failed)
    .filter(([, f]) => Date.now() - Date.parse(f.at) < RETRY_FAILED_AFTER_DAYS * 86_400_000)
    .map(([num]) => Number(num)),
);

const index = JSON.parse(readFileSync("data/rfc-index.json", "utf8")) as RfcIndex;
const existing = new Set([...allVisuals().map((m) => m.rfc), ...recentlyFailed]);
const queue = process.env.ONLY
  ? process.env.ONLY.split(",").map(Number)
  : pickQueue(index.entries, existing, maxRfcs);

const guide = readFileSync("docs/visual-authoring.md", "utf8");
const schema = readFileSync("src/visuals/types.ts", "utf8");
const example = JSON.stringify({ ...rfc792, rfc: undefined, reviewed: undefined });
const client = createClient({ apiKey, models, budget: maxRequests });

async function rfcText(num: number): Promise<string> {
  const path = `${TEXT_DIR}/rfc${num}.txt`;
  if (existsSync(path)) return readFileSync(path, "utf8");
  const response = await fetch(`https://www.rfc-editor.org/rfc/rfc${num}.txt`);
  if (!response.ok) throw new Error(`rfc${num}.txt: HTTP ${response.status}`);
  const text = await response.text();
  mkdirSync(TEXT_DIR, { recursive: true });
  writeFileSync(path, text);
  return text;
}

/** One draft plus at most one repair round, then prune. */
async function generate(num: number): Promise<{ model?: RfcVisualModel; reason: string }> {
  const entry = index.entries[num];
  const text = await rfcText(num);
  const messages: Message[] = buildMessages({ num, title: entry?.title ?? "", text, guide, schema, example });
  let reply = await client.chat(messages);
  let parsed = parseModelReply(reply.content, num);

  const issues = parsed.ok ? validateModel(parsed.model, text) : [parsed.error];
  if (issues.length > 0) {
    messages.push({ role: "assistant", content: reply.content }, repairMessage(issues));
    reply = await client.chat(messages);
    const repaired = parseModelReply(reply.content, num);
    if (repaired.ok) parsed = repaired;
  }
  if (!parsed.ok) return { reason: parsed.error };

  const pruned = pruneModel(parsed.model, text, { proseOnlyTransitions: true });
  if (pruned.withheld) return { reason: `withheld: ${pruned.dropped.length} issue(s), e.g. ${pruned.dropped[0] ?? "nothing usable"}` };
  return {
    model: {
      ...pruned.model,
      provenance: { kind: "generated", model: reply.model, generatedAt: new Date().toISOString(), dropped: pruned.dropped.length },
    },
    reason: `ok (${pruned.dropped.length} element(s) dropped)`,
  };
}


const results: string[] = [];
for (const num of queue) {
  try {
    const { model, reason } = await generate(num);
    if (model) {
      writeFileSync(`${GENERATED_DIR}/rfc${num}.json`, `${JSON.stringify(model, null, 2)}\n`);
      delete failed[num];
    } else {
      failed[num] = { at: new Date().toISOString(), reason };
    }
    results.push(`RFC ${num}: ${reason}`);
    console.log(results.at(-1));
  } catch (error) {
    if (error instanceof BudgetExhausted) {
      results.push(`stopped: ${error.message}`);
      console.log(results.at(-1));
      break;
    }
    failed[num] = { at: new Date().toISOString(), reason: (error as Error).message.slice(0, 200) };
    results.push(`RFC ${num}: error ${(error as Error).message.slice(0, 120)}`);
    console.log(results.at(-1));
  }
}

writeFileSync(FAILED_FILE, `${JSON.stringify(failed, null, 2)}\n`);
writeGeneratedIndex();
const summary = `Generator: ${client.used()} request(s), ${results.length} result(s)\n\n${results.map((r) => `- ${r}`).join("\n")}\n`;
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
