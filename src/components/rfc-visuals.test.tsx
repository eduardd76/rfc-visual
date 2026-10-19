import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RfcVisuals } from "~/components/rfc-visuals";
import { rfc9293 } from "~/visuals/rfc9293";

// jsdom cannot lay out SVG; the compiled Mermaid source is what we check.
vi.mock("~/components/mermaid-diagram", () => ({
  default: ({ chart }: { chart: string }) => <pre data-testid="chart">{chart}</pre>,
}));

const happy = rfc9293.transitions.filter((t) => t.layer === "happy").length;
const rst = rfc9293.transitions.filter((t) => t.layer === "rst").length;

describe("RfcVisuals", () => {
  it("opens on the handshake with every step cited", () => {
    render(<RfcVisuals model={rfc9293} />);
    expect(screen.getByTestId("chart").textContent).toContain("A->>B: SYN seq=100");
    const steps = screen.getByRole("list", { name: "Three-way handshake steps" });
    const items = within(steps).getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(within(items[0]!).getByRole("link", { name: "RFC 9293 §3.5" })).toHaveAttribute(
      "href",
      "https://www.rfc-editor.org/rfc/rfc9293.html#section-3.5",
    );
  });

  it("shows the state machine with one cited row per transition", () => {
    render(<RfcVisuals model={rfc9293} />);
    fireEvent.click(screen.getByRole("tab", { name: "State machine" }));
    const table = screen.getByRole("table", { name: "Transitions" });
    expect(within(table).getAllByRole("row")).toHaveLength(happy + 1);
    expect(screen.getByTestId("chart").textContent).not.toContain("rcv RST");
  });

  it("adds reset transitions when that layer is switched on", () => {
    render(<RfcVisuals model={rfc9293} />);
    fireEvent.click(screen.getByRole("tab", { name: "State machine" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Reset/ }));
    const table = screen.getByRole("table", { name: "Transitions" });
    expect(within(table).getAllByRole("row")).toHaveLength(happy + rst + 1);
    expect(screen.getByTestId("chart").textContent).toContain("rcv RST");
  });

  it("says it is hand-built and not yet reviewed", () => {
    render(<RfcVisuals model={rfc9293} />);
    expect(screen.getByText(/not yet reviewed by a second engineer/)).toBeInTheDocument();
  });
});

describe("RfcVisuals with a header layout", () => {
  const udp = {
    rfc: 768, reviewed: false, states: [], transitions: [], sequences: [], notShown: [],
    headers: [{
      id: "udp", title: "UDP header",
      intro: { section: "-", quote: "User Datagram Header Format" },
      fields: [
        { name: "Source Port", bits: 16, explain: "Sender's port.", cite: { section: "-", quote: "Source Port is an optional field" } },
        { name: "Destination Port", bits: 16, explain: "Receiver's port.", cite: { section: "-", quote: "Destination Port has a meaning" } },
        { name: "Data", bits: "var" as const, explain: "Payload.", cite: { section: "-", quote: "data octets" } },
      ],
    }],
  };

  it("shows only the tabs the model has", () => {
    render(<RfcVisuals model={udp} />);
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["UDP header"]);
  });

  it("draws fields with their widths and explains the selected one", () => {
    render(<RfcVisuals model={udp} />);
    const field = screen.getByRole("button", { name: /Destination Port, 16 bits/ });
    fireEvent.click(field);
    expect(screen.getByText("Receiver's port.")).toBeInTheDocument();
    for (const link of screen.getAllByRole("link", { name: "RFC 768" })) {
      expect(link).toHaveAttribute("href", "https://www.rfc-editor.org/rfc/rfc768.html");
    }
  });
});
