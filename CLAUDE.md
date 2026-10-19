# rfc-visual

A static Next.js export: one page per RFC, built from `data/rfc-index.json` (`bun run sync:data`).

- Commands: `bun run check` (lint + typecheck), `bun run test` (vitest, jsdom), `bun run build` (writes `out/`).
- `src/rfc/` holds the pure logic: index parsing, URL canonicalisation, the lineage compiler. Keep it DOM-free and tested.
- Diagram links may point only to `SITE_ORIGIN` or rfc-editor.org (`src/features/diagram/mermaid-security.ts`).
- Design: `docs/superpowers/specs/2026-10-19-rfc-visual-design.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
