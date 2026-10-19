# Contributing to rfc-visual

rfc-visual turns RFCs into visuals (packet flows, state machines and header layouts) at **rfc.vexpertai.com**. Accuracy is the whole product: every state, arrow, step and field must cite the RFC sentence it comes from.

There are two ways to help.

## 1. Verify a visual (no code, about 10 minutes)

This is the most valuable contribution. You need to know a protocol well; you don't need to code.

1. Open an RFC page that has a visual, e.g. https://rfc.vexpertai.com/rfc/rfc4271.
2. Check the visual against the RFC:
   - Does each quoted sentence support the arrow, step or field it's attached to?
   - Do the names, widths and order match the RFC?
   - Is anything important missing (see the "Not shown" line)?
   - Are the plain-English explanations right?
3. Click **Help verify this visual**, at the top of the "How it works" section. It opens a GitHub issue form with the RFC already filled in.

"Looks correct" is as useful as a bug report.

## 2. Author or fix a visual (code)

1. Read [`docs/visual-authoring.md`](docs/visual-authoring.md). It has the citation rules and what the validator checks.
2. Set up locally:
   ```bash
   bun install
   curl -sS https://www.rfc-editor.org/rfc/rfcN.txt -o test/fixtures/rfcN.txt
   ```
3. Create or edit `src/visuals/rfcN.ts` (`export const rfcN: RfcVisualModel`), and add it to `src/visuals/registry.ts`.
4. Validate until it passes, then run the suite:
   ```bash
   bun scripts/validate-visual.ts N
   bun run check && bun run test
   ```
5. Open a pull request. CI runs the same checks.

The rule that matters most: **leave a part out rather than guess.** If no sentence in the RFC supports an element, don't include it; list it under `notShown` instead.

Issues labelled [`good first visual`](https://github.com/eduardd76/rfc-visual/labels/good%20first%20visual) are important RFCs that don't have a visual yet.

## How a visual becomes "Reviewed"

- A new visual is shown as **Provisional** (hand-built) or **Machine-generated** (drafted by the nightly generator).
- **One sign-off from a maintainer** marks it **Reviewed**. Maintainers are listed in [`.github/CODEOWNERS`](.github/CODEOWNERS).
- **Verification reports from the community** are what maintainers review against. A visual with a well-argued "Found an error" report is fixed before it is signed off.
- **The sign-off is recorded in the model**, and the site shows "Reviewed by @maintainer on date (#issue)":
  ```ts
  reviewed: true,
  review: { by: "eduardd76", date: "2026-10-20", issue: 12 },
  ```
- **If the RFC or its verified errata change** after review, the visual goes back to Provisional.

## Ground rules

- Be kind and specific. Cite the RFC section when you disagree.
- Code is MIT-licensed (see `LICENSE`). RFC text is quoted from rfc-editor.org under the IETF Trust's terms.
