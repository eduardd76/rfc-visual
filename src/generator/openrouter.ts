export type Message = { role: "system" | "user" | "assistant"; content: string };

/** No more requests today: the run budget is spent or every model is rate-limited. */
export class BudgetExhausted extends Error {}

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export function createClient({
  apiKey,
  models,
  budget,
  fetch = globalThis.fetch,
}: {
  apiKey: string;
  /** Free models in order of preference, e.g. "google/gemma-4-31b-it:free". */
  models: string[];
  /** Maximum requests this run (free tier without credits: 50 per day). */
  budget: number;
  fetch?: typeof globalThis.fetch;
}) {
  let used = 0;
  const limited = new Set<string>();

  async function chat(messages: Message[]): Promise<{ content: string; model: string }> {
    for (const model of models) {
      if (limited.has(model)) continue;
      if (used >= budget) throw new BudgetExhausted(`request budget of ${budget} spent`);
      used += 1;
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://rfc.vexpertai.com",
          "X-Title": "rfc-visual",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      });
      if (response.status === 429) {
        limited.add(model);
        continue;
      }
      if (!response.ok) {
        throw new Error(`${model}: HTTP ${response.status} ${(await response.text()).slice(0, 200)}`);
      }
      const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
      return { content: data.choices?.[0]?.message?.content ?? "", model };
    }
    throw new BudgetExhausted("every model is rate-limited");
  }

  return { chat, used: () => used };
}
