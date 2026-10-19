import { describe, expect, it } from "vitest";

import { buildMessages, repairMessage } from "~/generator/prompt";

describe("buildMessages", () => {
  const base = { num: 5905, title: "Network Time Protocol Version 4", guide: "GUIDE", schema: "SCHEMA", example: "{}" };

  it("gives the rules, schema and example, then the RFC text", () => {
    const [system, user] = buildMessages({ ...base, text: "RFC TEXT" });
    expect(system!.role).toBe("system");
    expect(system!.content).toContain("GUIDE");
    expect(system!.content).toContain("SCHEMA");
    expect(user!.content).toContain("RFC 5905: Network Time Protocol Version 4");
    expect(user!.content).toContain("RFC TEXT");
  });

  it("truncates very long RFCs and says so", () => {
    const [, user] = buildMessages({ ...base, text: "x".repeat(50), maxChars: 20 });
    expect(user!.content).toContain("x".repeat(20));
    expect(user!.content).not.toContain("x".repeat(21));
    expect(user!.content).toMatch(/truncated/i);
  });
});

describe("repairMessage", () => {
  it("lists the validator's issues and asks for the whole corrected JSON", () => {
    const message = repairMessage(["transitions.3: quote not found", "headers.0.fields.1: quote does not mention Flags"]);
    expect(message.role).toBe("user");
    expect(message.content).toContain("quote not found");
    expect(message.content).toMatch(/complete corrected JSON/i);
  });
});
