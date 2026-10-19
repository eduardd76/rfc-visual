/** [number, title, status, obsoleted (0/1), has a visual (0/1)] — compact for the wire. */
export type SearchEntry = [number, string, string, 0 | 1, 0 | 1];

// Protocols whose usual name is not in their RFC title.
const ALIASES: Record<string, number[]> = {
  ip: [791],
  ipv4: [791],
  arp: [826],
  dns: [1034, 1035],
  nd: [4861],
  ndp: [4861],
  http: [9110, 9112],
  ntp: [5905],
  ospfv3: [5340],
};

const STATUS_WEIGHT: Record<string, number> = {
  "INTERNET STANDARD": 40,
  "DRAFT STANDARD": 30,
  "PROPOSED STANDARD": 30,
  "BEST CURRENT PRACTICE": 20,
  INFORMATIONAL: 10,
  EXPERIMENTAL: 5,
  HISTORIC: -50,
};

const MINOR_WORDS = new Set(["a", "an", "the", "for", "of", "and", "in", "on", "to", "with"]);

const words = (text: string) => text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

/** "Internet Control Message Protocol" → "icmp". */
function acronym(title: string): string {
  return title
    .split(/[^A-Za-z0-9]+/)
    .filter((w) => w && !MINOR_WORDS.has(w.toLowerCase()) && /^[A-Z]/.test(w))
    .map((w) => w[0]!.toLowerCase())
    .join("");
}

/** How well one query token matches an entry, or null if it does not. */
function tokenScore(token: string, entry: SearchEntry, titleWords: string[], titleAcronym: string) {
  if (ALIASES[token]?.includes(entry[0])) return 100;
  if (titleWords.includes(token)) return 60;
  // Initials can match by coincidence ("TN3270 Current Practices" → tcp).
  if (titleAcronym === token) return 40;
  if (titleWords.some((w) => w.startsWith(token))) return 20;
  return null;
}

export function searchRfcs(index: SearchEntry[], query: string, limit = 20): SearchEntry[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const number = /^(?:rfc\s*)?0*(\d+)$/i.exec(trimmed)?.[1];
  if (number) {
    const exact = index.find((entry) => entry[0] === Number(number));
    return exact ? [exact] : [];
  }

  const tokens = words(trimmed);
  const scored: { entry: SearchEntry; score: number }[] = [];
  for (const entry of index) {
    const titleWords = words(entry[1]);
    const titleAcronym = acronym(entry[1]);
    let score = 0;
    let matchedAll = true;
    for (const token of tokens) {
      const s = tokenScore(token, entry, titleWords, titleAcronym);
      if (s === null) {
        matchedAll = false;
        break;
      }
      score += s;
    }
    if (!matchedAll) continue;
    // The RFC that defines a protocol names it as "(TLS)" and has a short title.
    if (tokens.some((t) => entry[1].toLowerCase().includes(`(${t})`))) score += 20;
    score -= entry[1].length / 8;
    score += entry[4] ? 300 : 0;
    score -= entry[3] ? 500 : 0;
    score += STATUS_WEIGHT[entry[2]] ?? 0;
    score += entry[0] / 100_000; // newer first on ties
    scored.push({ entry, score });
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.entry);
}
