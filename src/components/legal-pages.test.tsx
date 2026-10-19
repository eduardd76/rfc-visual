import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ImpressumContent, PrivacyContent } from "~/components/legal-pages";

const operator = {
  name: "Jane Example",
  street: "Musterstraße 1",
  city: "12345 Berlin",
  country: "Germany",
  email: "hello@example.com",
};

describe("ImpressumContent", () => {
  it("names the operator with postal address and email", () => {
    render(<ImpressumContent operator={operator} />);
    expect(screen.getByText("Jane Example")).toBeInTheDocument();
    expect(screen.getByText(/Musterstraße 1/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "hello@example.com" })).toHaveAttribute("href", "mailto:hello@example.com");
  });
});

describe("PrivacyContent", () => {
  it("names the controller and every place visitor data goes", () => {
    render(<PrivacyContent operator={operator} />);
    expect(screen.getAllByText(/Jane Example/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Netlify/, { selector: "h2" })).toBeInTheDocument();
    expect(screen.getByText(/rfc-editor\.org/, { selector: "h2" })).toBeInTheDocument();
    expect(screen.getByText(/no cookies/i)).toBeInTheDocument();
    expect(screen.getByText(/right to lodge a complaint/i)).toBeInTheDocument();
  });
});
