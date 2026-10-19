import { describe, expect, it } from "vitest";

import {
  enforceSafeMermaidLinks,
  sanitizeMermaidSourceForRender,
} from "~/features/diagram/mermaid-security";

describe("sanitizeMermaidSourceForRender", () => {
  it("removes config directives and unsafe callbacks while preserving rfc-visual and rfc-editor links", () => {
    const source = [
      "%%{init:",
      "  {'securityLevel': 'loose'}",
      "}%%",
      "flowchart TD",
      'click node_safe "https://rfc.vexpertai.com/rfc/rfc9293/"',
      'click CORE "https://www.rfc-editor.org/rfc/rfc9293.html"',
      'click node_gh "https://github.com/acme/demo"',
      "click node_bad call alert()",
      'click node_bad "javascript:alert(1)"',
    ].join("\n");

    expect(sanitizeMermaidSourceForRender(source)).toBe(
      [
        "flowchart TD",
        'click node_safe "https://rfc.vexpertai.com/rfc/rfc9293/"',
        'click CORE "https://www.rfc-editor.org/rfc/rfc9293.html"',
      ].join("\n"),
    );
  });

  it("removes click directives that use non-space whitespace after the keyword", () => {
    const source = [
      "flowchart TD",
      'click\tnode_a "https://evil.example.com/x"',
    ].join("\n");

    expect(sanitizeMermaidSourceForRender(source)).toBe("flowchart TD");
  });

  it("removes a bare click line that continues onto the next line", () => {
    // Mermaid's lexer treats the newline after "click" as whitespace, so the
    // directive spans two lines; dropping the bare "click" line breaks it.
    const source = [
      "flowchart TD",
      "click",
      'node_a "https://evil.example.com/x"',
    ].join("\n");

    expect(sanitizeMermaidSourceForRender(source)).toBe(
      ["flowchart TD", 'node_a "https://evil.example.com/x"'].join("\n"),
    );
  });

  it("preserves canonical compiler click output unchanged", () => {
    const source = [
      "flowchart TD",
      'click node_safe "https://rfc.vexpertai.com/rfc/rfc9293/"',
    ].join("\n");

    expect(sanitizeMermaidSourceForRender(source)).toBe(source);
  });
});

describe("enforceSafeMermaidLinks", () => {
  it("keeps only HTTPS rfc-visual and rfc-editor links", () => {
    const root = document.createElement("div");
    root.innerHTML = [
      '<a id="safe" href="https://rfc.vexpertai.com/rfc/rfc9293/">safe</a>',
      '<a id="editor" href="https://www.rfc-editor.org/rfc/rfc9293">editor</a>',
      '<a id="unsafe" href="https://example.com/phish">unsafe</a>',
      '<a id="github" href="https://github.com/acme/demo">github</a>',
    ].join("");

    enforceSafeMermaidLinks(root);

    expect(root.querySelector("#safe")?.getAttribute("href")).toBe(
      "https://rfc.vexpertai.com/rfc/rfc9293/",
    );
    expect(root.querySelector("#editor")?.getAttribute("href")).toBe(
      "https://www.rfc-editor.org/rfc/rfc9293",
    );
    expect(root.querySelector("#github")?.hasAttribute("href")).toBe(false);
    expect(root.querySelector("#safe")?.getAttribute("rel")).toBe(
      "noopener noreferrer",
    );
    expect(root.querySelector("#unsafe")?.hasAttribute("href")).toBe(false);
  });
});
