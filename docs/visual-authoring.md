# Authoring a hand-built RFC visual

Each visual explains one RFC with cited parts. Every part has to come from the RFC text:
- **state** — a protocol state;
- **transition** — a move from one state to another;
- **sequence step** — one message in an exchange between two parties;
- **header field** — one field in a packet or message format.

The reference example is `src/visuals/rfc9293.ts` (TCP). Read it first.

## Files

You create exactly two files per RFC:

- `test/fixtures/rfcN.txt`: the RFC text. Download it with
  `curl -sS https://www.rfc-editor.org/rfc/rfcN.txt -o test/fixtures/rfcN.txt`
  (it may already exist).
- `src/visuals/rfcN.ts`: `export const rfcN: RfcVisualModel = { ... }`. Use `import type` from `~/visuals/types`.

Do not edit any other file. In particular, leave `registry.ts`, shared code and tests alone; the integrator registers your model. Do not commit, build, or start a dev server.

## Validate until it passes

```bash
bun scripts/validate-visual.ts N
```

It checks each part against `test/fixtures/rfcN.txt`. For each check below, whitespace is ignored and words hyphenated across a line break are joined.

| What | Check |
|---|---|
| Every `cite.quote` | Exists verbatim in the RFC, inside section `cite.section`. Use `"-"` only for RFCs with no numbered sections (768, 792, 826). |
| State | Its quote names the state. |
| Transition | The quote names the **target** state. The **source** state is named in the quote, in the section title, or within about 1,500 characters before the quote, e.g. as the sub-heading the rule sits under. |
| Sequence step | `segment` appears verbatim in the quote (e.g. `DHCPDISCOVER`, or a figure line such as `<SEQ=100><CTL=SYN>`). `stateA`/`stateB` are optional; if given, the quote must name them. |
| Header field | The quote names the field, matched case-insensitively, so use the RFC's own field name. `bits` is exact; `"var"` is for options and payload. The fixed-size fields before the first `"var"` add up to whole octets. |
| State machine | Every state is reachable from `initial` through `"happy"` transitions, and every state except `initial` has an exit. |

A quote that crosses a page break (form feed, page header or footer) will not be found. If that happens, choose a shorter quote.

## Accuracy rules: these matter more than coverage

1. **Leave a part out rather than guess.** If you can't find a sentence that supports a transition, field or step, don't include it. Add the topic to `notShown` instead.
2. **Prefer normative prose** (e.g. event-processing sections) over summary figures for state machines. Figure lines are fine as sequence-step quotes.
3. **`explain` fields are one or two plain-English sentences** that a junior network engineer understands. They may only restate what the cited text and its section say. No numbers, timers or behaviour that the RFC doesn't state.
4. **Use the RFC's own names** for states, messages and fields.
5. **Layers.** `"happy"` is the normal path, `"rst"` is resets and refusals, and `"error"` is aborts, timeouts and errors. Put a transition in a non-happy layer if it only fires on failure.
6. **Diagram text.** Keep `event`/`action` short (e.g. `rcv SYN`, `snd SYN,ACK`). Avoid `:` `;` `#` `{` `}` and double quotes in them.
7. **`notShown` is honest.** List the important parts of the RFC that the visual leaves out.
8. **Set `stateMachineTitle`** when the model has a state machine, e.g. `"BGP FSM"`. Set `participants` on sequences, e.g. `{ a: "Client", b: "Server" }`.

## Which visuals to build

Build the visuals that explain the protocol best, typically 1–4 per RFC:
- **Protocol with connection or session state** (BGP, OSPF neighbour, BFD, ND neighbour cache, DHCP client): a state machine, plus one or two key exchanges.
- **Packet or message format** (IPv4, IPv6, UDP, ICMP, DNS, ARP): a header layout, plus the main exchange if the RFC describes one (e.g. echo request and reply).
- **Handshake protocol** (TLS 1.3, QUIC): the handshake sequence, plus the most important header or state machine.
