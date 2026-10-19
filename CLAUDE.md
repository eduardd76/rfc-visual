# rfc-visual

A static Next.js export: one page per RFC, built from `data/rfc-index.json` (`bun run sync:data`).

- Commands: `bun run check` (lint + typecheck), `bun run test` (vitest, jsdom), `bun run build` (writes `out/`).
- `src/rfc/` holds the pure logic: index parsing, URL canonicalisation, the lineage compiler. Keep it DOM-free and tested.
- Diagram links may point only to `SITE_ORIGIN` or rfc-editor.org (`src/features/diagram/mermaid-security.ts`).
- Design: `docs/superpowers/specs/2026-10-19-rfc-visual-design.md`.
