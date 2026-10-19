import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RfcRelations } from "~/components/rfc-relations";
import type { RfcEntry } from "~/rfc/types";

const dns: RfcEntry = {
  num: 1035,
  title: "Domain names - implementation and specification",
  authors: [],
  date: "November 1987",
  status: "INTERNET STANDARD",
  stream: "Legacy",
  formats: ["TXT"],
  obsoletes: [973, 882, 883],
  obsoletedBy: [],
  updates: [],
  updatedBy: Array.from({ length: 29 }, (_, i) => 1101 + i),
  errata: { verified: 0, held: 0, reported: 0 },
};

describe("RfcRelations", () => {
  it("lists every relation, including those the graph folds into +K more", () => {
    render(
      <RfcRelations
        entry={dns}
        titles={{ 1101: "DNS encoding of network names and other types" }}
      />,
    );
    const updatedBy = screen.getByRole("group", { name: "Updated by (29)" });
    const links = within(updatedBy).getAllByRole("link");
    expect(links).toHaveLength(29);
    expect(links[0]).toHaveAttribute("href", "/rfc/rfc1129/");
    expect(
      within(updatedBy).getByRole("link", { name: /RFC 1101.*DNS encoding/ }),
    ).toHaveAttribute("href", "/rfc/rfc1101/");
    expect(screen.getByRole("group", { name: "Obsoletes (3)" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: /Obsoleted by/ })).not.toBeInTheDocument();
  });
});
