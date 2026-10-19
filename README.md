# rfc-visual

Every RFC, explained visually.

Take any RFC URL on rfc-editor.org and swap the host:

```
https://www.rfc-editor.org/rfc/rfc9293   →   https://rfc.vexpertai.com/rfc/rfc9293
```

## Status

Phase 0 (this release) shows, for every RFC:
- its status;
- an "Obsoleted by" warning, where one applies;
- errata counts (Verified, Held and Reported are kept separate);
- a lineage graph of what it obsoletes and updates, and what obsoletes and updates it;
- the RFC text.

No LLM is involved. State machines and packet-flow diagrams, with every element cited back to the RFC text, come next. See [the design](docs/superpowers/specs/2026-10-19-rfc-visual-design.md).

## Generated visuals (Phase 1)

RFCs without a hand-built visual get a **machine-generated draft**. The draft is made by free OpenRouter models, and the site labels it with the model's name and the date.

- **What runs, and when:** `.github/workflows/generate.yml` runs nightly (01:30 UTC). It uses the free tier, which allows 50 requests a day without credits, so it budgets 45 requests, about 20 RFCs per night.
- **Which RFCs go first:** current standards-track RFCs, most-updated first. BCP, informational and experimental RFCs follow.
- **How a draft is built:**
  1. The model gets the same rules hand-authors follow (`docs/visual-authoring.md`), the schema, and an example.
  2. The validator checks every quote against the RFC text. Rejected elements are sent back once for repair.
  3. Whatever still fails is removed.
  4. If more than 20% fails, the draft is withheld; it is retried after 30 days (`src/visuals/generated/failed.json`).
- **What gets committed:** only drafts that pass the full test suite are committed. The site then redeploys.
- **Hand-built visuals always win:** a generated draft never replaces a hand-built visual.
- **Running it locally:** `OPENROUTER_API_KEY=... bun scripts/generate-visuals.ts` (set `ONLY=5905` to generate one RFC).

## Help verify

Each visual is marked **Provisional** until it is reviewed by engineers who know the protocol. Every visual has a **Help verify this visual** link. You can also [open a verification report](https://github.com/eduardd76/rfc-visual/issues/new?template=verify-visual.yml) directly.

What to check:
- Does each quoted sentence support the arrow, field or step it is attached to?
- Is anything important missing?
- Are the plain-English explanations right?

"Looks correct" reports count too. One maintainer sign-off marks a visual **Reviewed**; see [CONTRIBUTING.md](CONTRIBUTING.md), which also explains how to author a visual.

## How it works

- `bun run sync:data` downloads `rfc-index.xml` and the errata API from rfc-editor.org into `data/rfc-index.json`.
- `bun run build` prerenders one static page per RFC (`output: "export"`).
- Other rfc-editor.org URL shapes (`.txt`, `/info/`, `/errata/`, …) are redirected client-side from `404.html`.
- A nightly GitHub Actions run rebuilds and deploys to Netlify. Running cost is $0.

## Deploy

- Netlify project `rfc-visual` serves `out/`, with custom domain `rfc.vexpertai.com`.
- `.github/workflows/deploy.yml` runs on push to `main`, nightly at 03:17 UTC, and on demand. It needs the repo secrets `NETLIFY_AUTH_TOKEN` (a personal access token) and `NETLIFY_SITE_ID`.

## Development

```bash
bun install
bun run sync:data
bun run dev
bun run check && bun run test
```

## Attribution

Forked from [GitDiagram](https://github.com/ahmedkhaleel2004/gitdiagram) by Ahmed Khaleel (MIT). RFC data © IETF Trust, from [rfc-editor.org](https://www.rfc-editor.org).
