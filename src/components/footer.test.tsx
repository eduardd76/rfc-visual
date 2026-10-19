import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Footer } from "~/components/footer";

describe("Footer", () => {
  it("says the site is not affiliated with the IETF and the RFC is authoritative", () => {
    render(<Footer showLegal />);
    expect(screen.getByText(/Not affiliated with the IETF, the IETF Trust or the RFC Editor/)).toBeInTheDocument();
    expect(screen.getByText(/The RFC text is authoritative/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy/");
    expect(screen.getByRole("link", { name: "Impressum" })).toHaveAttribute("href", "/impressum/");
  });

  it("does not link legal pages before the operator details exist", () => {
    render(<Footer showLegal={false} />);
    expect(screen.queryByRole("link", { name: "Privacy" })).not.toBeInTheDocument();
  });
});
