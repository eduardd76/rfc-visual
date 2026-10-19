import mermaid from "mermaid";
import { describe, expect, it } from "vitest";

import { formatSegment, sequenceToMermaid, stateMachineToMermaid } from "~/visuals/compile";
import { rfc9293 } from "~/visuals/rfc9293";

describe("stateMachineToMermaid", () => {
  it("draws the normal path only when only that layer is on", () => {
    const source = stateMachineToMermaid(rfc9293, ["happy"]);
    expect(source).toContain('state "SYN-SENT" as SYN_SENT');
    expect(source).toContain("SYN_SENT --> ESTABLISHED : rcv SYN,ACK / snd ACK");
    expect(source).toContain("[*] --> CLOSED");
    expect(source).not.toContain("rcv RST");
    expect(source).not.toContain("ABORT");
  });

  it("adds reset and abort transitions with their layers", () => {
    const source = stateMachineToMermaid(rfc9293, ["happy", "rst", "error"]);
    expect(source).toContain("SYN_RECEIVED --> LISTEN : rcv RST");
    expect(source).toContain("ESTABLISHED --> CLOSED : ABORT / snd RST");
  });

  it("produces valid Mermaid for every layer combination", async () => {
    for (const layers of [["happy"], ["happy", "rst"], ["happy", "rst", "error"]] as const) {
      await expect(mermaid.parse(stateMachineToMermaid(rfc9293, [...layers]))).resolves.toBeTruthy();
    }
  });
});

describe("formatSegment", () => {
  it("turns RFC segment notation into flags and numbers", () => {
    expect(formatSegment("<SEQ=300><ACK=101><CTL=SYN,ACK>")).toBe("SYN,ACK seq=300 ack=101");
    expect(formatSegment("<SEQ=101><ACK=301><CTL=ACK><DATA>")).toBe("ACK + data seq=101 ack=301");
  });
});

describe("sequenceToMermaid", () => {
  it("draws the handshake with both peers' states", async () => {
    const source = sequenceToMermaid(rfc9293.sequences[0]!);
    expect(source).toContain("A->>B: SYN seq=100");
    expect(source).toContain("B->>A: SYN,ACK seq=300 ack=101");
    expect(source).toContain("Note over A: SYN-SENT");
    await expect(mermaid.parse(source)).resolves.toBeTruthy();
  });

  it("draws the close sequence", async () => {
    await expect(mermaid.parse(sequenceToMermaid(rfc9293.sequences[1]!))).resolves.toBeTruthy();
  });
});
