import mermaid from "mermaid";
import { describe, expect, it } from "vitest";

import { formatSegment, headerRows, sequenceToMermaid, stateMachineToMermaid } from "~/visuals/compile";
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

describe("sequenceToMermaid without states", () => {
  it("names participants and skips state notes", async () => {
    const source = sequenceToMermaid({
      id: "dora", title: "DORA", participants: { a: "Client", b: "Server" },
      intro: { section: "-", quote: "x" },
      steps: [{ from: "A", segment: "DHCPDISCOVER", explain: "", cite: { section: "-", quote: "x" } }],
    });
    expect(source).toContain("participant A as Client");
    expect(source).toContain("A->>B: DHCPDISCOVER");
    expect(source).not.toContain("Note over");
    await expect(mermaid.parse(source)).resolves.toBeTruthy();
  });
});

describe("headerRows", () => {
  const f = (name: string, bits: number | "var") => ({ name, bits, explain: "", cite: { section: "-", quote: "" } });

  it("packs fields into 32-bit rows", () => {
    const rows = headerRows([f("Source Port", 16), f("Destination Port", 16), f("Length", 16), f("Checksum", 16)]);
    expect(rows).toEqual([
      [{ name: "Source Port", bits: 16, continued: false }, { name: "Destination Port", bits: 16, continued: false }],
      [{ name: "Length", bits: 16, continued: false }, { name: "Checksum", bits: 16, continued: false }],
    ]);
  });

  it("splits a field that crosses a row boundary", () => {
    const rows = headerRows([f("Version", 4), f("Address", 48), f("Pad", 12)]);
    expect(rows[0]).toEqual([{ name: "Version", bits: 4, continued: false }, { name: "Address", bits: 28, continued: false }]);
    expect(rows[1]).toEqual([{ name: "Address", bits: 20, continued: true }, { name: "Pad", bits: 12, continued: false }]);
  });

  it("gives variable-length fields a full row", () => {
    const rows = headerRows([f("Type", 8), f("Code", 8), f("Checksum", 16), f("Data", "var")]);
    expect(rows[1]).toEqual([{ name: "Data", bits: "var", continued: false }]);
  });
});
