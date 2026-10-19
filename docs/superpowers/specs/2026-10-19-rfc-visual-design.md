# rfc-visual.org — Design

Date: 2026-10-19
Status: Approved by owner 2026-10-19. Hosting changed to Netlify (owner)

## 1. Intent

Engineers struggle to understand RFCs from prose and ASCII art — especially packet
flows and state machines (the TCP handshake is the reference example). rfc-visual.org
gives every RFC a visual explanation.

The interaction is borrowed from gitdiagram.com: take any rfc-editor.org URL and
replace the domain.

```
https://www.rfc-editor.org/rfc/rfc9293   →   https://rfc.vexpertai.com/rfc/rfc9293
```

**Success (owner's words):** an engineer can read *any* RFC "our new way" just by
changing the domain.

## 2. Users and their pain points

Five simulated network-engineer personas were used to surface pain points: protocol
implementer, ISP/NOC operator, protocol security tester, junior engineer, and IETF
standards architect. They are role-plays, not user research; treat the findings as
hypotheses. Some section numbers were quoted from memory and must be checked
before use.

The one point all five made independently: **a single invented state, transition or
field, without a citation back to the RFC text, destroys trust in the whole tool.**

### Engineering challenges

| # | Challenge | Source |
|---|---|---|
| C1 | **Element-level provenance.** Every state, transition, field and timer links to an exact span of text in a specific RFC version. Anything unsupported is visibly flagged, never silently shown. | all 5 |
| C2 | **State machines come from prose, not figures.** e.g. RFC 9293 Figure 5 explicitly omits error and RST transitions; the real rules are in §3.10. The BGP FSM (RFC 4271 §8) forks on optional attributes. The TLS 1.3 Appendix A machines show only the happy path, while the MUST-abort rules are scattered through §4. | all 5 |
| C3 | **The effective spec spans several documents.** It is the base RFC plus Obsoletes/Updates, verified errata, and companion RFCs. The rfc-editor JSON gives only document-level relationships. TCP's 5681, 6298 and 7323 are not formally linked to 9293 at all. | all 5 |
| C4 | **Header-layout notations.** ASCII bit rulers, QUIC's `(i)` varint notation, the TLS presentation language, ASN.1 and ABNF. The output must be precise enough to decode a pasted hex dump (later phase). | 4 of 5 |
| C5 | **Uneven sources.** Only RFC 8650 and later are native XML v3, with anchors and `<artwork>`. The roughly 8,600 older RFCs are paginated TXT whose page headers and footers break up figures. | architect, implementer, junior |
| C6 | **Normative strength and ambiguity.** MUST, SHOULD and MAY are shown differently, and underspecified behaviour is flagged. | ops, security, implementer, junior |
| C7 | **Detail levels without lying.** Happy path → + RST → + errors. Simplified views omit; they never misstate. | junior, implementer, security |
| C8 | **Timing and two-peer behaviour.** Timers, retransmission and races, e.g. the BFD detection time, IKEv2 rekey collisions, and TLS HRR/0-RTT branches. | ops, security, junior |
| C9 | **Coverage report.** Show which normative statements the visual did *not* render, so that "omitted" is distinguishable from "doesn't exist". | security, implementer |
| C10 | **Version pinning.** Show the RFC number, source format, errata set, generation date and model, and make results deterministic. | architect, security |

## 3. Goals, non-goals, anti-goals

**Goals**
- Every RFC on rfc-editor.org is reachable at the same path on rfc.vexpertai.com.
- Every RFC gets at least one visual. Protocol RFCs get state machines and packet-flow sequence diagrams.
- Every rendered element is clickable back to its source text (C1).
- **$0 running cost** (owner decision). The domain is the only expense, about $10/yr.

**Non-goals (v1)**
- Live, on-demand generation for visitors.
- Accounts, quotas, billing, private documents, videos.
- Internet-Drafts (RFCs only).
- Pasted-hex packet decoding (C4 interactive) and timer calculators (C8 interactive). Planned for later; the data model should not preclude them.

**Anti-goals** (failure even if it "works")
- An uncited or invented transition or field shown with no warning.
- Obsoleted behaviour (e.g. RFC 793) silently mixed into a newer RFC's view.
- MUST, SHOULD and MAY flattened into identical arrows.
- A diagram as dense and unreadable as the ASCII original.
- Reported errata presented as Verified.

## 4. Decisions made by the owner

1. **Fork GitDiagram** (github.com/ahmedkhaleel2004/gitdiagram, MIT, commit `310e2e6`, 2026-10-13) and adapt it.
2. **Public, hosted** like gitdiagram.com.
3. **URL-swap UX:** replace the host `www.rfc-editor.org` with `rfc.vexpertai.com`, keep the path.
4. **Every RFC gets a visual**, including ones with no protocol behaviour.
5. **$0 to run:** free-tier "frontier" models, everything pre-generated offline.

## 5. Architecture (designer's calls — owner may override)

### 5.1 Shape: static site + batch generator

Generation is never live, so there is no runtime backend.

```
 ┌─────────────────────── nightly batch (GitHub Actions, free on public repo) ──────────────────────┐
 │ 1. sync    rfc-editor.org: rfc-index JSON, per-RFC .json, .xml (≥8650) or .txt, errata          │
 │ 2. pick    next N RFCs from priority queue (new/changed first, then curated list, then backlog) │
 │ 3. extract normalize source → sections with stable span IDs                                      │
 │ 4. generate free-tier LLM → strict JSON visual model, every element carries {section, quote}     │
 │ 5. validate deterministic: quote exists verbatim in the span; IDs/graph well-formed;            │
 │            failures retried with feedback, then dropped and listed as "unrendered" (C9)          │
 │ 6. compile  deterministic → Mermaid (and SVG header layouts)                                     │
 │ 7. commit  artifacts/rfcNNNN.json to the repo; git history = version pinning (C10)              │
 └──────────────────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
                   static build (Next.js export) → Netlify (free; prebuilt in GitHub Actions, deployed via CLI to save build minutes)
```

### 5.2 What is kept from GitDiagram vs dropped

| Keep / adapt | Drop |
|---|---|
| Strict-graph LLM output → server validator with retry-on-feedback → deterministic Mermaid compiler (`docs/architecture.md`, steps 3–6) | Live `/api/generate/*` streaming routes |
| Mermaid rendering + DOMPurify sanitisation, and the link allowlist (now rfc-editor.org only) | R2, Upstash Redis, quotas, cancellation |
| OpenRouter provider support (`AI_PROVIDER`) | Stripe, sponsors, admin dashboard, presence worker |
| Next.js + Tailwind UI, landing page, browse catalog | Explainer videos, MP4 containers, puppeteer, ffmpeg |
| `experiments/diagram-evidence/` as the starting point for the accuracy eval | GitHub ingestion, private repos, MCP plugin (later, maybe) |

GitDiagram's validator checks "the linked file path exists in the repo". Ours checks
"the quoted text exists in the cited RFC section". That substitution is the heart of the fork.

### 5.3 Visual types per RFC

The LLM first classifies the RFC, then produces the visuals that fit its type.

| RFC kind | Primary visual | Example |
|---|---|---|
| Protocol behaviour | State machine (with detail toggles, C7) + packet-flow sequence diagram | 9293 TCP, 4271 BGP, 8446 TLS 1.3 |
| Wire format | Header/bit layout with per-field citations | 791 IPv4, 1035 DNS, 9000 §17 QUIC |
| Architecture / framework | Concept map (components and relationships) | 4291 IPv6 addressing |
| Process / BCP / informational | Definitions card or decision flow | 2119 / 8174 keywords |
| **All RFCs (no LLM)** | **Lineage graph**: obsoletes, updates, updated-by, errata count/status, from JSON metadata | every RFC |

The lineage graph is the guaranteed baseline. Any RFC not yet generated still shows
the lineage graph, plus the original text, plus a "visual coming" banner.

### 5.4 Visual model contract (sketch)

Each artifact is JSON. Every element carries provenance:

```json
{
  "rfc": 9293, "source": "xml", "fetched": "2026-10-19", "errata_set": ["…"],
  "model": "<provider/model@date>", "kind": "protocol",
  "visuals": [{
    "type": "state_machine",
    "states": [{"id": "SYN_SENT", "cite": {"section": "3.3.2", "quote": "SYN-SENT - represents waiting for…"}}],
    "transitions": [{"from": "SYN_SENT", "to": "ESTABLISHED", "event": "rcv SYN,ACK", "action": "snd ACK",
                     "strength": "MUST", "layer": "happy", "cite": {"section": "3.10.7.3", "quote": "…"}}]
  }],
  "unrendered": [{"section": "3.10.7.4", "quote": "…", "reason": "validator rejected"}]
}
```

`layer` is one of `happy`, `rst` or `error` (C7). `strength` is a BCP 14 keyword or
`none` (C6). The validator rejects any element without a `cite` whose `quote` matches
the source verbatim. Whitespace and line breaks are normalised; nothing else is.

**Quote must support the claim (designer's call).** A real quote attached to an
invented transition would pass the existence check, so a second, deterministic
*relevance* check also applies. Every state, event and field name in an element must
appear in its quote, compared case- and hyphen-insensitively (SYN-SENT matches SYN_SENT).
The quoted `strength` keyword must also appear in the quote. No LLM judge is used, so
the pipeline stays at one generation call plus retries.

**Partial visuals (designer's call).** A visual is published only if it passes
structural rules:
- every state is reachable from the initial state;
- every non-terminal state has at least one exit;
- no layer is empty that the RFC clearly has (e.g. RST handling in 9293).

If more than 20% of proposed elements are rejected, the visual is withheld. The page
then shows the lineage graph plus a "visual withheld — failed validation" note. Every
partial visual that is published carries an "incomplete: N statements not rendered"
badge, which links to the drawer.

**Publishing unreviewed visuals (designer's call).** They are published, labelled
"Machine-generated, unreviewed". "Any RFC" can't wait for human review.

### 5.5 Page (designer's default; refine during planning)

- A visual pane alongside the RFC text pane. Clicking a diagram element scrolls to and highlights the cited span.
- A header strip showing the RFC status (Standards Track, Obsoleted, Historic…), "Obsoleted by" warnings, an errata badge, and version info (C10).
- A "Not rendered" drawer listing the coverage gaps (C9).
- A "Reviewed" vs "Machine-generated, unreviewed" badge per visual.

### 5.6 URL coverage

Mirror these rfc-editor.org path shapes: `/rfc/rfcN`, `/rfc/rfcN.html`, `/rfc/rfcN.txt`
and `/info/rfcN`. All of them resolve to the same rfc-visual page. Unknown paths
redirect to the rfc-editor.org equivalent.

### 5.7 Models and the $0 constraint

- Free tiers (e.g. OpenRouter `:free` models, the Gemini free tier) are rate-limited and change often. The model list is configuration, verified at build time. **No specific free model has been verified yet.**
- The batch job runs at whatever pace the free tiers allow. When quota runs out it stops, and the next night continues. Losing a free tier pauses new diagrams but never breaks published ones.
- Free tiers may train on prompts. This is acceptable because RFC text is public.
- **Strict $0 (owner decision, 2026-10-19).** No credit purchases, even one-time ones. The long tail fills in at free-tier pace, which may take years for all ~9,700 RFCs. That is accepted, because un-generated pages still show the lineage graph and the text. The generator must spend each call carefully: one call per RFC where possible, retries capped, and the priority order of §5.8 strictly respected.

### 5.8 Generation order

1. Curated starter set (about 50): TCP 9293, UDP 768, IPv4 791, IPv6 8200, ICMP 792, ARP 826, ND 4861, DHCP 2131, DNS 1035, BGP 4271, OSPF 2328, BFD 5880, TLS 1.3 8446, QUIC 9000, HTTP 9110/9113/9114, IKEv2 7296.
2. Any RFC newly published or with new errata.
3. The backlog, newest to oldest.

Starter-set visuals are human-reviewed before the badge reads "Reviewed".

**Review lifecycle (designer's call).**
- Review is done by pull request against `artifacts/rfcNNNN.json`. Reviewers may hand-edit the JSON; the validator still runs on edits.
- Sign-off is recorded in the artifact as `review: {by, date, source_commit}`.
- Reviewed artifacts are **frozen**: nightly runs never overwrite them.
- If the source or errata change after review, the badge changes to "Reviewed — may be stale" and a new candidate is opened as a PR.

**Errata in v1 (designer's call): badge-only.** Verified errata are listed in the header strip. Any visual element whose cited section is named in a Verified erratum gets a ⚠ marker linking to that erratum. Errata text is not merged into generation until the effective-spec work (Later). Reported or Held errata are shown separately and never marked as verified.

## 6. Accuracy and evaluation

- **Hard gate (automatic):** citation validation (§5.4). Nothing uncited ships.
- **Golden set:** hand-built reference models for 5 RFCs: TCP 9293 FSM, the TLS 1.3 handshake, the BGP FSM, the DHCP DORA flow and the IPv4 header. Each generator change is scored against them for precision and recall of states, transitions and fields. Adapt GitDiagram's `experiments/diagram-evidence/`.
- **Coverage:** the share of BCP 14 sentences in the RFC that are rendered or listed as unrendered. The target is 100% accounted for.
- **Who builds the golden set (owner: "don't know" → designer's call):** the builder drafts the five reference models by hand from the RFC text. Every element carries a citation and passes the same validator. They are marked `provisional` until a network engineer reviews them through a PR, recruited via a pinned "help verify" GitHub issue. P1 does not wait for that review; scores against a provisional golden set are labelled as such.
- **Gate (designer's call):** golden-set scores are only reported during P1. Once baselines exist, a generator change that lowers precision on any golden RFC fails CI. Precision is gated before recall, because an invented element is worse than a missing one.

## 7. Phasing

| Phase | Delivers |
|---|---|
| P0 | Fork, strip, static export. URL mirroring. Lineage graph and text for **all** RFCs (no LLM). Deploy at $0. |
| P1 | Generator + validator for XML v3 RFCs. State-machine and sequence visuals. Starter-set RFCs ≥ 8650 (9293, 9000, 8446, 9110…). Golden-set eval. |
| P2 | TXT ingestion (paginated cleanup, ASCII figure extraction). The rest of the starter set (793-era: 826, 2131, 4271, 2328…). Header-layout visuals. |
| P3 | Concept-map and definitions visuals for non-protocol RFCs. Backlog crawl. |
| Later | Effective-spec merge across Updates and errata (C3, section-level). Hex decoding (C4). Timer calculators (C8). Draft support. |

P0 alone already satisfies the "swap the domain for any RFC" promise at a basic level.

## 8. Left to the builder

- The exact JSON schema, prompt design, and retry and backoff policy.
- Choice of free models, and the fallback order between them.
- The TXT cleanup approach (page header and footer stripping, figure detection).
- Mermaid vs. a custom SVG renderer for header layouts.
- Repository layout after stripping, and the test strategy (GitDiagram uses vitest).

## 9. Risks / open items

- **Domain (owner decision, 2026-10-19):** host on a subdomain of `vexpertai.com`, proposed `rfc.vexpertai.com`. DNS is at GoDaddy (`domaincontrol.com`). A wildcard `*.vexpertai.com` currently points to an existing CloudFront distribution; an explicit CNAME for the chosen subdomain to `<site>.netlify.app` overrides it (owner adds it in GoDaddy after the first deploy). `rfc-visual.org` was found unregistered and can be added later as an alias.
- **Free-tier volatility:** throughput is unknown until models are chosen. A reviewer cited OpenRouter `:free` at about 50 requests/day without credits; this is unverified. A slow backlog is accepted (§5.7).
- **Static size:** about 9,700 pages plus JSON artifacts must fit Netlify free-plan limits (file count and size). This needs checking.
- **Effective-spec (C3)** is deliberately deferred. Until then, views show "Updated by RFC X" badges, not merged behaviour.
- **Upstream drift:** the fork diverges heavily from GitDiagram, so upstream fixes won't merge cleanly. Accepted.
