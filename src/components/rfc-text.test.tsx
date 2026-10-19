import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RfcText } from "~/components/rfc-text";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RfcText", () => {
  it("renders the fetched text without form feeds", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("page one\fpage two TCP text", { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<RfcText num={9293} formats={["TXT", "HTML"]} />);
    const pre = await screen.findByText(/page two TCP text/);
    expect(pre.tagName).toBe("PRE");
    expect(pre.textContent).not.toContain("\f");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://www.rfc-editor.org/rfc/rfc9293.txt",
    );
  });

  it("links out for PDF-only RFCs without fetching", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<RfcText num={8} formats={["PDF"]} />);
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://www.rfc-editor.org/rfc/rfc8.pdf",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a fallback link when the fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<RfcText num={9293} formats={["TXT"]} />);
    expect(await screen.findByText(/Couldn't load the text/)).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://www.rfc-editor.org/rfc/rfc9293.txt",
    );
    expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
  });

  it("treats a non-200 response as a failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 404 })),
    );
    render(<RfcText num={9293} formats={["TXT"]} />);
    expect(await screen.findByText(/Couldn't load the text/)).toBeInTheDocument();
  });
});
