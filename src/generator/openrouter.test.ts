import { describe, expect, it, vi } from "vitest";

import { BudgetExhausted, createClient } from "~/generator/openrouter";

const ok = (content: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
const limited = () => new Response("{}", { status: 429 });

describe("OpenRouter client", () => {
  it("sends the request with the key and returns the reply and model used", async () => {
    const fetch = vi.fn().mockResolvedValue(ok('{"states":[]}'));
    const client = createClient({ apiKey: "k", models: ["m1:free"], budget: 5, fetch });
    const reply = await client.chat([{ role: "user", content: "hi" }]);
    expect(reply).toEqual({ content: '{"states":[]}', model: "m1:free" });
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect((init as RequestInit).headers).toMatchObject({ Authorization: "Bearer k" });
    expect(JSON.parse((init as RequestInit).body as string)).toMatchObject({ model: "m1:free" });
  });

  it("falls back to the next model when one is rate-limited", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(limited()).mockResolvedValueOnce(ok("{}"));
    const client = createClient({ apiKey: "k", models: ["a:free", "b:free"], budget: 5, fetch });
    expect((await client.chat([{ role: "user", content: "x" }])).model).toBe("b:free");
    expect(client.used()).toBe(2);
  });

  it("stops when the daily budget is spent", async () => {
    const fetch = vi.fn().mockResolvedValue(ok("{}"));
    const client = createClient({ apiKey: "k", models: ["a:free"], budget: 1, fetch });
    await client.chat([{ role: "user", content: "x" }]);
    await expect(client.chat([{ role: "user", content: "y" }])).rejects.toBeInstanceOf(BudgetExhausted);
  });

  it("stops when every model is rate-limited", async () => {
    const fetch = vi.fn().mockResolvedValue(limited());
    const client = createClient({ apiKey: "k", models: ["a:free", "b:free"], budget: 10, fetch });
    await expect(client.chat([{ role: "user", content: "x" }])).rejects.toBeInstanceOf(BudgetExhausted);
  });
});
