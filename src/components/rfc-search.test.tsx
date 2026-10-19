import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RfcSearch } from "~/components/rfc-search";
import type { SearchEntry } from "~/rfc/search";

const index: SearchEntry[] = [
  [4271, "A Border Gateway Protocol 4 (BGP-4)", "DRAFT STANDARD", 0, 1],
  [1771, "A Border Gateway Protocol 4 (BGP-4)", "DRAFT STANDARD", 1, 0],
  [7606, "Revised Error Handling for BGP UPDATE Messages", "PROPOSED STANDARD", 0, 0],
];

function setup() {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(index))));
  const navigate = vi.fn();
  render(<RfcSearch navigate={navigate} />);
  const box = screen.getByRole("combobox", { name: /Search RFCs/ });
  return { box, navigate };
}

afterEach(() => vi.unstubAllGlobals());

describe("RfcSearch", () => {
  it("loads the index on focus and lists ranked matches with badges", async () => {
    const { box } = setup();
    fireEvent.focus(box);
    fireEvent.change(box, { target: { value: "bgp" } });
    const options = await screen.findAllByRole("option");
    expect(options.map((o) => within(o).getByText(/^RFC \d+$/).textContent)).toEqual([
      "RFC 4271", "RFC 7606", "RFC 1771",
    ]);
    expect(within(options[0]!).getByText("Visual")).toBeInTheDocument();
    expect(within(options[2]!).getByText("Obsoleted")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/search-index.json");
  });

  it("opens the highlighted result on Enter, moving with the arrow keys", async () => {
    const { box, navigate } = setup();
    fireEvent.focus(box);
    fireEvent.change(box, { target: { value: "bgp" } });
    await screen.findAllByRole("option");
    fireEvent.keyDown(box, { key: "ArrowDown" });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(navigate).toHaveBeenCalledWith("/rfc/rfc7606/");
  });

  it("goes straight to an RFC typed as a number or URL", () => {
    const { box, navigate } = setup();
    fireEvent.change(box, { target: { value: "https://www.rfc-editor.org/rfc/rfc9293.html" } });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(navigate).toHaveBeenCalledWith("/rfc/rfc9293/");
  });

  it("says so when nothing matches", async () => {
    const { box } = setup();
    fireEvent.focus(box);
    fireEvent.change(box, { target: { value: "zzzz" } });
    expect(await screen.findByText(/No RFCs match/)).toBeInTheDocument();
  });
});
