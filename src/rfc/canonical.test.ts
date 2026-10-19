import { describe, expect, it } from "vitest";

import {
  canonicalRfcPath,
  notFoundAction,
  parseUserInput,
  resolvePath,
} from "~/rfc/canonical";

describe("resolvePath", () => {
  it.each([
    ["/rfc/rfc9293", 9293],
    ["/rfc/rfc9293/", 9293],
    ["/rfc/RFC9293", 9293],
    ["/rfc/rfc0793", 793],
    ["/rfc/rfc9293.txt", 9293],
    ["/rfc/rfc9293.html", 9293],
    ["/rfc/rfc9293.pdf", 9293],
    ["/rfc/rfc9293.xml", 9293],
    ["/rfc/rfc9293.json", 9293],
    ["/info/rfc9293", 9293],
    ["/errata/rfc793", 793],
    ["/rfc/inline-errata/rfc793.html", 793],
  ])("maps %s to RFC %i", (pathname, num) => {
    expect(resolvePath(pathname)).toEqual({ kind: "rfc", num });
  });

  it("sends other rfc-editor.org paths to rfc-editor.org", () => {
    expect(resolvePath("/search/rfc_search.php", "?title=tcp")).toEqual({
      kind: "external",
      url: "https://www.rfc-editor.org/search/rfc_search.php?title=tcp",
    });
  });
});

describe("canonicalRfcPath", () => {
  it("uses the trailing-slash form", () => {
    expect(canonicalRfcPath(793)).toBe("/rfc/rfc793/");
  });
});

describe("notFoundAction", () => {
  it("redirects a variant to the canonical page", () => {
    expect(notFoundAction("/rfc/rfc9293.txt", "")).toEqual({
      type: "redirect",
      to: "/rfc/rfc9293/",
    });
  });

  it("reports a missing RFC instead of redirecting to itself", () => {
    expect(notFoundAction("/rfc/rfc99999/", "")).toEqual({
      type: "missing",
      num: 99999,
    });
  });

  it("adds the trailing slash once before declaring an RFC missing", () => {
    expect(notFoundAction("/rfc/rfc99999", "")).toEqual({
      type: "redirect",
      to: "/rfc/rfc99999/",
    });
  });

  it("sends unknown paths to rfc-editor.org", () => {
    expect(notFoundAction("/about/", "")).toEqual({
      type: "external",
      url: "https://www.rfc-editor.org/about/",
    });
  });
});

describe("parseUserInput", () => {
  it.each([
    ["9293", 9293],
    ["rfc 9293", 9293],
    ["RFC9293", 9293],
    ["https://www.rfc-editor.org/rfc/rfc9293.html", 9293],
    ["tcp", null],
    ["", null],
  ])("parses %j as %j", (input, expected) => {
    expect(parseUserInput(input)).toBe(expected);
  });
});
