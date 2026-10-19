# rfc-visual Phase 0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every rfc-editor.org RFC URL works at `rfc.vexpertai.com`, with the same path, showing a status header, a lineage graph (obsoletes / updates / errata) and the RFC text. No LLM is used, and running cost is $0.

**Architecture:** A fork of GitDiagram, stripped to a static Next.js export. A sync script turns `rfc-index.xml` and the errata API into `data/rfc-index.json`. One prerendered page is built per RFC. URL variants are handled client-side by the export's `404.html`, which redirects to the canonical path. RFC text is fetched by the browser straight from rfc-editor.org, which sends `access-control-allow-origin: *`. A nightly GitHub Actions run rebuilds and deploys to Netlify.

**Tech Stack:** Next.js 16 (`output: "export"`), React 19, TypeScript, Tailwind 4, Mermaid 12 + DOMPurify (GitDiagram's renderer), vitest + Testing Library, bun, `fast-xml-parser`, Netlify CLI, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-19-rfc-visual-design.md` (§5.3 lineage baseline, §5.5 page, §5.6 URL coverage, §7 P0)

**Repo:** a fork of `ahmedkhaleel2004/gitdiagram` (MIT, upstream commit `310e2e6`), named `eduardd76/rfc-visual` and cloned to `/Users/eddulharu/REA/rfc-visual`. All paths below are relative to that clone.

## Global Constraints

- Running cost is $0: Netlify free plan, GitHub Actions on a public repo, no paid APIs, no LLM calls in P0.
- Site origin: `https://rfc.vexpertai.com`, held in `SITE_ORIGIN` in `src/lib/site.ts`.
- Upstream data, fetched only at build time:
  - `https://www.rfc-editor.org/rfc-index.xml`
  - `https://www.rfc-editor.org/api/v1/errata.json`
- RFC text is fetched at view time from `https://www.rfc-editor.org/rfc/rfc{N}.txt`.
- Errata status labels are copied verbatim: `Verified`, `Held for Document Update`, `Reported`. `Rejected` is never counted or shown. Reported errata are never presented as Verified (spec anti-goal).
- Diagram links may point only to `SITE_ORIGIN` or `https://www.rfc-editor.org`.
- Keep the GitDiagram MIT `LICENSE` and add an attribution line to the README.
- `trailingSlash: true` in `next.config.js`. Otherwise Next's RSC payload `out/rfc/rfc9293.txt` would shadow the real `/rfc/rfc9293.txt` URL.

## Review Focus

1. **URL variants.** `/rfc/RFC9293`, `/rfc/rfc0793`, `/rfc/rfc9293/`, `/rfc/rfc9293.txt|.html|.pdf|.xml|.json`, `/info/rfc9293`, `/errata/rfc793` and `/rfc/inline-errata/rfc793.html` must all land on `/rfc/rfc{N}/`. Pinned in Task 3.
2. **RFC numbers not in the index** (e.g. `/rfc/rfc99999`) must show a "not found" message and a link to rfc-editor.org. There must be no redirect loop: 404 → redirect → 404 again. Pinned in Task 3.
3. **Huge or dangling lineage.** RFC 1035 has 29 updated-by entries, and relation lists contain `BCP`/`STD`/`FYI` ids and RFC numbers missing from the index. The graph must cap each group with a "+K more" node and must never crash. Pinned in Tasks 2 and 4.
4. **RFC text unavailable.** PDF-only RFCs (8, 9, 51, 418, 500, 530, 598) and fetch failures or offline use must show a link out, never a permanent spinner. Pinned in Task 5.
5. **Titles that break Mermaid.** 97 titles contain `"` (e.g. `"Very Distant" Host interface`), and many contain `(`, `)`, `#` or `;`. The lineage source must stay valid. Pinned in Task 4.

---

### Task 1: Fork and strip GitDiagram to a static shell

**Files:**
- Fork: `gh repo fork ahmedkhaleel2004/gitdiagram --fork-name rfc-visual --clone` (run in `/Users/eddulharu/REA`)
- Delete (whole paths): `cloudflare/`, `workers/`, `experiments/`, `scripts/`, `plugins/`, `patches/`, `public/video-engine/`, `.cursor-plugin/`, `.claude-plugin/`, `.githooks/`, `.github/FUNDING.yml`, `gemini-extension.json`, `server.json`, `Dockerfile`, `.dockerignore`, `railway.json`, `wrangler*.jsonc`, `open-next.config.ts`, `src/server/`, `src/mcp-app/`, `src/proxy.ts`, `src/proxy.test.ts`, `src/instrumentation.ts`
- Delete everything under `src/app/` except `layout.tsx`, `page.tsx` and `not-found.tsx`
- Delete everything under `src/features/` except `diagram/mermaid-config.ts`, `diagram/mermaid-security.ts` and `diagram/mermaid-security.test.ts`
- Keep in `src/components/`: `mermaid-diagram.tsx`, `mermaid-diagram-helpers.ts`, `mermaid-diagram-toolbar.tsx`, `footer.tsx`, `ui/button.tsx`, `ui/input.tsx`. Keep in `src/hooks/`: `use-mermaid-viewport.ts` and the gesture hooks it imports. Keep `src/lib/utils.ts` and `src/lib/site.ts`. Delete the rest of `src/components/`, `src/hooks/` and `src/lib/`.
- Rewrite: `next.config.js`, `src/app/layout.tsx`, `src/app/page.tsx` (stub), `src/lib/site.ts`, `package.json`, `README.md`, `CLAUDE.md`, `.env.example` (delete if empty)
- Create: `src/components/header.tsx` (static, no GitHub star fetch)

**Interfaces:**
- Produces:
  - `export const SITE_ORIGIN = "https://rfc.vexpertai.com"` in `src/lib/site.ts`.
  - `MermaidChart` (default export, `{ chart: string; zoomingEnabled?: boolean; containerClassName?: string }`) still renders.
  - The `bun run check`, `bun run test` and `bun run build` scripts.

- [ ] **Step 1:** Fork and clone, then create branch `p0`.
- [ ] **Step 2:** Delete the paths listed above.
- [ ] **Step 3:** Replace `next.config.js` with a minimal config: `output: "export"`, `trailingSlash: true`, `images: { unoptimized: true }`. No headers or rewrites, because CSP moves to `netlify.toml` in Task 6.
- [ ] **Step 4:** Rewrite `layout.tsx`. It keeps Geist, `globals.css`, `next-themes`, `Header` and `Footer`. Remove PostHog, sponsors, live presence and chunk-reload. Metadata: title `rfc-visual`, description `Every RFC, explained visually. Swap rfc-editor.org for rfc.vexpertai.com.` `page.tsx` is a stub `<h1>rfc-visual</h1>`.
- [ ] **Step 5:** Prune `package.json`.
  - Scripts: keep `dev`, `build` (`next build`), `lint`, `typecheck`, `check`, `test`, `test:watch`, `format:*`; add `sync:data` (Task 2).
  - Remove deps: `@anthropic-ai/sdk`, `@aws-sdk/*`, `@modelcontextprotocol/*`, `ffmpeg-static`, `openai`, `posthog-js`, `puppeteer-core`, `resend`, `stripe`, `server-only`, `@cloudflare/*`, `@opennextjs/cloudflare`, `redis`, `wrangler`, `knip`.
  - Add `fast-xml-parser`.
  - Remove the `knip` block. Run `bun install`.
- [ ] **Step 6:** Delete tests that import deleted modules. Run `bun run check && bun run test && bun run build`. Expected: all pass, and `out/index.html` exists.
- [ ] **Step 7:** Commit `chore: strip gitdiagram to static rfc-visual shell`.

### Task 2: RFC index data sync

**Files:**
- Create: `src/rfc/types.ts`, `src/rfc/parse-index.ts`, `src/rfc/load.ts`, `scripts/sync-rfc-data.ts`
- Create: `test/fixtures/rfc-index-sample.xml`: real entries copied from `rfc-index.xml` for RFC 761, 793, 1035 and 9293, plus the root `<rfc-index>` element with its namespace
- Create: `test/fixtures/errata-sample.json`: real errata objects for RFC793 and RFC9293, at least one of each status
- Test: `src/rfc/parse-index.test.ts`
- Modify: `.gitignore` (add `data/`), `package.json` (`"sync:data": "bun scripts/sync-rfc-data.ts"`)

**Interfaces:**
- Produces, in `src/rfc/types.ts`:
  ```ts
  export type ErrataCounts = { verified: number; held: number; reported: number };
  export type RfcEntry = {
    num: number; title: string; authors: string[]; date: string; // "August 2022"
    status: string; stream: string | null; formats: string[];     // e.g. ["TXT","HTML"]
    obsoletes: number[]; obsoletedBy: number[]; updates: number[]; updatedBy: number[];
    errata: ErrataCounts;
  };
  export type RfcIndex = { fetchedAt: string; entries: Record<number, RfcEntry> };
  ```
- Produces, in `parse-index.ts`:
  - `parseRfcIndex(xml: string): RfcEntry[]` (errata zeroed)
  - `countErrata(records: { "doc-id": string; errata_status_code: string }[]): Map<number, ErrataCounts>`
  - `buildRfcIndex(xml: string, errata: unknown[], fetchedAt: string): RfcIndex`
- Produces: `data/rfc-index.json` (an `RfcIndex`), read at build time by Task 5 via `loadRfcIndex(): RfcIndex` in `src/rfc/load.ts` (created here; reads `data/rfc-index.json` with `fs`).

- [ ] **Step 1: Write the failing tests** in `parse-index.test.ts`:
  - `parses RFC 9293 from its own entry, not from 793's obsoleted-by list`: the entry with `num === 9293` has title `Transmission Control Protocol (TCP)`, `date === "August 2022"`, and `obsoletes` containing `793`.
  - `parses RFC 793 relations`: `obsoletes` is `[761]`, `obsoletedBy` is `[9293]`, `updatedBy` is `[1122, 3168, 6093, 6528]`, and `status` is `"INTERNET STANDARD"`.
  - `drops non-RFC ids from relation lists`: a fixture entry whose `<is-also>`/`<updates>` lists contain `BCP14`/`STD7` yields only numeric RFC numbers.
  - `counts errata by status and ignores Rejected`: from the sample, `countErrata(...).get(9293)` deep-equals `{ verified: 4, held: 2, reported: 0 }`, matching live data on 2026-10-19 (4 Verified, 2 Held, 3 Rejected).
  - `single author and single format still become arrays`: guards against the XML parser collapsing one-element lists.
- [ ] **Step 2:** Run `bun run test src/rfc/parse-index.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement `parse-index.ts`.** Use `fast-xml-parser` with `isArray` set for `rfc-entry`, `author`, `file-format`, `doc-id`, `kw`. Take the entry's number from its *direct child* `doc-id`. Convert `"RFC0793"` to `793` by regex `/^RFC0*(\d+)$/`. Ignore other ids.
- [ ] **Step 4:** Run the test. Expected: PASS.
- [ ] **Step 5: Implement `scripts/sync-rfc-data.ts`.** It fetches both URLs, follows redirects, calls `buildRfcIndex` with `new Date().toISOString()`, and writes `data/rfc-index.json`. It exits non-zero if fewer than 9,000 entries were parsed; there were 9,848 on 2026-10-19.
- [ ] **Step 6:** Run `bun run sync:data`. Expected: it prints the entry count (≥ 9,848), and `data/rfc-index.json` exists.
- [ ] **Step 7:** Commit `feat: sync rfc-editor index and errata into data/rfc-index.json`.

### Task 3: URL canonicalisation and not-found redirect

**Files:**
- Create: `src/rfc/canonical.ts`, `src/components/not-found-redirect.tsx`
- Modify: `src/app/not-found.tsx` (renders `<NotFoundRedirect />`)
- Test: `src/rfc/canonical.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type PathTarget = { kind: "rfc"; num: number } | { kind: "external"; url: string };
  export function resolvePath(pathname: string, search?: string): PathTarget;
  export function canonicalRfcPath(num: number): string;            // "/rfc/rfc9293/"
  export type NotFoundAction = { type: "redirect"; to: string } | { type: "missing"; num: number } | { type: "external"; url: string };
  export function notFoundAction(pathname: string, search: string): NotFoundAction;
  export function parseUserInput(input: string): number | null;     // for the landing box
  ```

- [ ] **Step 1: Write the failing tests** (table-driven):
  - `resolvePath` maps each of these to `{ kind: "rfc", num: N }`: `/rfc/rfc9293`, `/rfc/rfc9293/`, `/rfc/RFC9293`, `/rfc/rfc0793` (793), `/rfc/rfc9293.txt`, `.html`, `.pdf`, `.xml`, `.json`, `/info/rfc9293`, `/errata/rfc793`, `/rfc/inline-errata/rfc793.html`.
  - `resolvePath("/search/rfc_search.php", "?title=tcp")` → `{ kind: "external", url: "https://www.rfc-editor.org/search/rfc_search.php?title=tcp" }`.
  - `canonicalRfcPath(793) === "/rfc/rfc793/"`.
  - `notFoundAction("/rfc/rfc9293.txt", "")` → `{ type: "redirect", to: "/rfc/rfc9293/" }`.
  - **Loop guard:** `notFoundAction("/rfc/rfc99999/", "")` → `{ type: "missing", num: 99999 }`. The pathname is already canonical, so it is missing, not redirected.
  - `parseUserInput` returns 9293 for `"9293"`, `"rfc 9293"`, `"RFC9293"` and `"https://www.rfc-editor.org/rfc/rfc9293.html"`. It returns `null` for `"tcp"` and `""`.
- [ ] **Step 2:** Run `bun run test src/rfc/canonical.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement `canonical.ts` as pure functions with no DOM access.
- [ ] **Step 4:** Run the test. Expected: PASS.
- [ ] **Step 5: Implement `NotFoundRedirect`**, a client component. On mount it computes `notFoundAction(location.pathname, location.search)`:
  - `redirect`: `location.replace(to)`.
  - `external`: `location.replace(url)`.
  - `missing`: renders "RFC {num} isn't in the rfc-editor.org index (yet)." plus a link to `https://www.rfc-editor.org/rfc/rfc{num}`.
  It shows "Redirecting…" before mount.
- [ ] **Step 6:** Commit `feat: canonicalise rfc-editor URL variants via 404 redirect`.

### Task 4: Lineage graph compiler

**Files:**
- Create: `src/rfc/lineage.ts`
- Modify: `src/features/diagram/mermaid-security.ts` (allowlist), `src/features/diagram/mermaid-security.test.ts`
- Test: `src/rfc/lineage.test.ts`

**Interfaces:**
- Consumes: `RfcEntry` and `RfcIndex` (Task 2), `canonicalRfcPath` (Task 3), `SITE_ORIGIN` (Task 1)
- Produces: `lineageToMermaid(entry: RfcEntry, index: RfcIndex["entries"], maxPerGroup?: number): string` (default `maxPerGroup = 8`), and `hasLineage(entry: RfcEntry): boolean`.

Layout: `flowchart LR`. The groups are:
- `obsoletes` and `updates` on the left, as "older" documents;
- the focal RFC in the centre (class `focal`);
- `obsoletedBy` and `updatedBy` on the right, as "newer" documents.

Edge labels are verbatim: `obsoletes`, `updates`, `obsoleted by`, `updated by`. Edges to `obsoletedBy` nodes use class `obsolete` (red). Each node label is `RFC {n}` plus a newline and the title truncated to 40 characters with `…`. A number missing from the index gets label `RFC {n}` only. Every RFC node gets `click r{n} "{SITE_ORIGIN}/rfc/rfc{n}/"`.

- [ ] **Step 1: Write the failing tests:**
  - `RFC 793 graph has 761 left, 9293 right as obsoleted by, four updated-by nodes`: assert the source contains `r9293`, `obsoleted by` and `click r9293 "https://rfc.vexpertai.com/rfc/rfc9293/"`.
  - `caps a group at maxPerGroup with a +K more node`: a synthetic entry with 29 `updatedBy` produces 8 updated-by nodes plus a node labelled `+21 more` that has **no** click line.
  - `escapes titles`: a title `"Very Distant" Host interface; (#1)` appears with `"` replaced by `#quot;`, and the output contains no raw `"` inside a label. The test renders the source through Mermaid's parser (`mermaid.parse`) in jsdom and expects no throw.
  - `dangling numbers render without title`: an `updatedBy` number absent from the index still produces node `r{n}` labelled `RFC {n}`.
  - `hasLineage` is false for an entry with all four lists empty.
- [ ] **Step 2:** Run `bun run test src/rfc/lineage.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement `lineage.ts`.
- [ ] **Step 4: Update `mermaid-security.ts`.** Change the click-line regex and `enforceSafeMermaidLinks` to accept `https:` URLs whose origin is `SITE_ORIGIN` or `https://www.rfc-editor.org`, and to reject everything else, **including** `https://github.com`. Update the existing tests to match, and add one that asserts a `github.com` link is stripped.
- [ ] **Step 5:** Run `bun run test`. Expected: PASS.
- [ ] **Step 6:** Commit `feat: deterministic RFC lineage graph and rfc-only link allowlist`.

### Task 5: RFC page and landing page

**Files:**
- Create: `src/app/rfc/[slug]/page.tsx`, `src/components/rfc-header.tsx`, `src/components/rfc-text.tsx`, `src/components/lineage-graph.tsx` (client wrapper around `MermaidChart`)
- Rewrite: `src/app/page.tsx` (landing page)
- Test: `src/components/rfc-header.test.tsx`, `src/components/rfc-text.test.tsx`

**Interfaces:**
- Consumes: `loadRfcIndex` (Task 2), `lineageToMermaid`, `hasLineage` (Task 4), `parseUserInput`, `canonicalRfcPath` (Task 3)
- Produces: a static route `/rfc/rfc{N}/` for every index entry (`generateStaticParams` returns `{ slug: "rfc{N}" }`, `dynamicParams = false`); `RfcHeader({ entry, fetchedAt })`; `RfcText({ num, formats })`.

The page layout follows spec §5.5:
1. `RfcHeader` strip.
2. "Visual coming" banner: "A visual explanation of this RFC hasn't been generated yet. Showing its lineage and text." It links to the spec's phase list in the README.
3. Lineage graph, if `hasLineage`. Otherwise the text "No other RFCs obsolete or update this one."
4. `RfcText`.

`generateMetadata` gives the title `RFC {N}: {title} — rfc-visual`.

- [ ] **Step 1: Write the failing tests**
  - `rfc-header.test.tsx`:
    - For RFC 793 it shows the status `INTERNET STANDARD`, a warning containing `Obsoleted by` with a link to `/rfc/rfc9293/`, and `11 verified errata` linking `https://www.rfc-editor.org/errata/rfc793`. Held errata appear separately as `24 held for document update`, not inside the verified count.
    - For an entry with `reported: 3, verified: 0` it renders `3 reported (unverified)` and no "verified" text.
    - It shows `Index fetched 2026-10-19` from `fetchedAt`.
  - `rfc-text.test.tsx`:
    - With `fetch` mocked to resolve `"...TCP text..."`, it renders the text in a `<pre>` with form-feed characters removed.
    - With `formats: ["PDF"]` it renders a link `https://www.rfc-editor.org/rfc/rfc8.pdf` and **does not call** `fetch`.
    - With `fetch` rejecting, it renders `Couldn't load the text` plus a link to `https://www.rfc-editor.org/rfc/rfc{N}.txt`. No spinner remains.
- [ ] **Step 2:** Run `bun run test src/components`. Expected: FAIL.
- [ ] **Step 3:** Implement `RfcHeader`, `RfcText` and `LineageGraph`. `RfcText` fetches `https://www.rfc-editor.org/rfc/rfc{num}.txt` only when `formats` includes `TXT`.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Implement the `[slug]` page and the landing page. The landing page shows a hero "Every RFC, explained visually", the swap example `www.rfc-editor.org/rfc/rfc9293 → rfc.vexpertai.com/rfc/rfc9293`, an input that navigates with `parseUserInput` (inline error "Enter an RFC number or rfc-editor.org URL" on `null`), and quick links to the spec §5.8 starter RFCs: 9293, 768, 791, 8200, 826, 2131, 1035, 4271, 2328, 5880, 8446, 9000, 9110.
- [ ] **Step 6:** Run `bun run dev`, open `/rfc/rfc793/` and `/rfc/rfc1035/`. Expected: the obsoleted warning shows, the graph renders with a `+21 more` node on 1035, and the text loads.
- [ ] **Step 7:** Commit `feat: RFC page with status header, lineage graph and text`.

### Task 6: Static export, Netlify config, build verification

**Files:**
- Create: `netlify.toml`, `scripts/verify-export.ts`
- Modify: `package.json` (`"verify:export": "bun scripts/verify-export.ts"`)

**Interfaces:**
- Consumes: the `out/` directory from `bun run build`.
- Produces: `netlify.toml` with `publish = "out"`, no build command (CI builds), and a `[[headers]]` block for `/*` with this CSP:
  - GitDiagram's policy, minus the presence and video entries;
  - `connect-src 'self' https://www.rfc-editor.org`;
  - `frame-ancestors 'none'`;
  - `upgrade-insecure-requests`.

- [ ] **Step 1: Write `verify-export.ts`.** It exits non-zero unless all of these hold:
  - `out/rfc/rfc9293/index.html` exists;
  - `out/rfc/rfc793/index.html` exists;
  - `out/404.html` exists;
  - `out/rfc/rfc9293.txt` does **not** exist;
  - the count of `out/rfc/*/index.html` equals the entry count in `data/rfc-index.json`.
  It prints the total file count and size of `out/`, because Netlify free-plan limits are an open risk (spec §9).
- [ ] **Step 2:** Run `bun run sync:data && bun run build && bun run verify:export`. Expected: PASS. Record the printed file count and size in the commit message.
- [ ] **Step 3:** Run `npx serve out` and request `/rfc/rfc9293.txt`. Expected: the browser lands on `/rfc/rfc9293/`.
- [ ] **Step 4:** Commit `build: static export verification and netlify config`.

### Task 7: Deploy to Netlify, custom domain, nightly CI

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `README.md` (how it works, attribution, the URL swap)

**Interfaces:**
- Consumes: `sync:data`, `check`, `test`, `build` and `verify:export` scripts; `netlify.toml`.
- Produces: the live site at `https://rfc.vexpertai.com`.

- [ ] **Step 1: Create the Netlify site.** `netlify sites:create --name rfc-visual` (fall back to `rfc-visual-vexpertai` if the name is taken), then `netlify link`. Record the site ID and the `*.netlify.app` hostname.
- [ ] **Step 2: First deploy from local.** `netlify deploy --prod --dir=out`. Expected: `https://<site>.netlify.app/rfc/rfc9293/` loads.
- [ ] **Step 3: Add the custom domain.** Add `rfc.vexpertai.com` in Netlify (`netlify api updateSite` with `custom_domain`, or the UI).
- [ ] **Step 4 (owner):** Add a CNAME record in GoDaddy: name `rfc`, value `<site>.netlify.app`. This overrides the `*.vexpertai.com` wildcard for `rfc` only. Verify with `dig +short rfc.vexpertai.com`, which should show the Netlify host, not `d3vbf2ijfss2y9.cloudfront.net`. Netlify then provisions HTTPS.
- [ ] **Step 5: Write `deploy.yml`.**
  - Triggers: `push` to `main`, `schedule: cron "17 3 * * *"`, `workflow_dispatch`.
  - Steps: checkout → `oven-sh/setup-bun` → `bun install --frozen-lockfile` → `bun run sync:data` → `bun run check` → `bun run test` → `bun run build` → `bun run verify:export` → `npx netlify-cli deploy --prod --dir=out`.
  - Env: `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` from repo secrets.
- [ ] **Step 6 (owner):** Create a Netlify personal access token named `rfc-visual-ci`. Then run `gh secret set NETLIFY_AUTH_TOKEN` and `gh secret set NETLIFY_SITE_ID` on `eduardd76/rfc-visual`. Don't reuse the local CLI login token.
- [ ] **Step 7:** Merge `p0` into `main` and push. Expected: the workflow passes and `https://rfc.vexpertai.com/rfc/rfc9293.txt` lands on the RFC 9293 page.
