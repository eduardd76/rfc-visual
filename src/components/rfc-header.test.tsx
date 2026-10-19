import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RfcHeader } from "~/components/rfc-header";
import type { RfcEntry } from "~/rfc/types";

const tcp793: RfcEntry = {
  num: 793,
  title: "Transmission Control Protocol",
  authors: ["J. Postel"],
  date: "September 1981",
  status: "INTERNET STANDARD",
  stream: "Legacy",
  formats: ["TXT", "HTML"],
  obsoletes: [761],
  obsoletedBy: [9293],
  updates: [],
  updatedBy: [1122, 3168, 6093, 6528],
  errata: { verified: 11, held: 24, reported: 0 },
};

describe("RfcHeader", () => {
  it("shows status, the obsoleted-by warning and verified errata", () => {
    render(<RfcHeader entry={tcp793} fetchedAt="2026-10-19T03:17:00.000Z" />);
    expect(screen.getByText("INTERNET STANDARD")).toBeInTheDocument();
    const warning = screen.getByText(/Obsoleted by/);
    expect(warning).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "RFC 9293" })).toHaveAttribute(
      "href",
      "/rfc/rfc9293/",
    );
    expect(screen.getByRole("link", { name: "11 verified errata" })).toHaveAttribute(
      "href",
      "https://www.rfc-editor.org/errata/rfc793",
    );
    expect(screen.getByText("24 held for document update")).toBeInTheDocument();
  });

  it("keeps reported errata apart from verified", () => {
    render(
      <RfcHeader
        entry={{ ...tcp793, errata: { verified: 0, held: 0, reported: 3 } }}
        fetchedAt="2026-10-19T03:17:00.000Z"
      />,
    );
    expect(screen.getByText("3 reported (unverified)")).toBeInTheDocument();
    expect(screen.queryByText(/verified errata/)).not.toBeInTheDocument();
  });

  it("shows when the index was fetched", () => {
    render(<RfcHeader entry={tcp793} fetchedAt="2026-10-19T03:17:00.000Z" />);
    expect(screen.getByText(/Index fetched 2026-10-19/)).toBeInTheDocument();
  });
});
