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

## How it works

- `bun run sync:data` downloads `rfc-index.xml` and the errata API from rfc-editor.org into `data/rfc-index.json`.
- `bun run build` prerenders one static page per RFC (`output: "export"`).
- Other rfc-editor.org URL shapes (`.txt`, `/info/`, `/errata/`, …) are redirected client-side from `404.html`.
- A nightly GitHub Actions run rebuilds and deploys to Netlify. Running cost is $0.

## Development

```bash
bun install
bun run sync:data
bun run dev
bun run check && bun run test
```

## Attribution

Forked from [GitDiagram](https://github.com/ahmedkhaleel2004/gitdiagram) by Ahmed Khaleel (MIT). RFC data © IETF Trust, from [rfc-editor.org](https://www.rfc-editor.org).
