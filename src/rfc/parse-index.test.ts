import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { buildRfcIndex, countErrata, parseRfcIndex } from "~/rfc/parse-index";

const xml = readFileSync("test/fixtures/rfc-index-sample.xml", "utf8");
const errata = JSON.parse(
  readFileSync("test/fixtures/errata-sample.json", "utf8"),
) as { "doc-id": string; errata_status_code: string }[];

const byNum = (n: number) => parseRfcIndex(xml).find((e) => e.num === n);

describe("parseRfcIndex", () => {
  it("parses RFC 9293 from its own entry, not from 793's obsoleted-by list", () => {
    const tcp = byNum(9293);
    expect(tcp?.title).toBe("Transmission Control Protocol (TCP)");
    expect(tcp?.date).toBe("August 2022");
    expect(tcp?.obsoletes).toContain(793);
  });

  it("parses RFC 793 relations", () => {
    const tcp = byNum(793);
    expect(tcp?.obsoletes).toEqual([761]);
    expect(tcp?.obsoletedBy).toEqual([9293]);
    expect(tcp?.updatedBy).toEqual([1122, 3168, 6093, 6528]);
    expect(tcp?.status).toBe("INTERNET STANDARD");
  });

  it("drops non-RFC ids from relation lists", () => {
    const anchor = "<draft>draft-bradner-key-words-02</draft>";
    const withStd = xml.replace(
      anchor,
      `${anchor}\n    <updates>\n      <doc-id>STD7</doc-id>\n      <doc-id>RFC1234</doc-id>\n    </updates>`,
    );
    const keywords = parseRfcIndex(withStd).find((e) => e.num === 2119);
    expect(keywords?.updates).toEqual([1234]);
    expect(keywords?.updatedBy).toEqual([8174]);
  });

  it("single author and single format still become arrays", () => {
    const keywords = byNum(2119);
    expect(keywords?.authors).toEqual(["S. Bradner"]);
    const pdfOnly = xml.replace(
      "<file-format>TXT</file-format>\n      <file-format>HTML</file-format>",
      "<file-format>PDF</file-format>",
    );
    expect(parseRfcIndex(pdfOnly).find((e) => e.num === 761)?.formats).toEqual([
      "PDF",
    ]);
  });
});

describe("countErrata", () => {
  it("counts errata by status and ignores Rejected", () => {
    expect(countErrata(errata).get(9293)).toEqual({
      verified: 4,
      held: 2,
      reported: 0,
    });
    expect(countErrata(errata).get(793)).toEqual({
      verified: 11,
      held: 24,
      reported: 0,
    });
  });
});

describe("buildRfcIndex", () => {
  it("keys entries by number and attaches errata counts", () => {
    const index = buildRfcIndex(xml, errata, "2026-10-19T03:17:00.000Z");
    expect(index.fetchedAt).toBe("2026-10-19T03:17:00.000Z");
    expect(Object.keys(index.entries)).toHaveLength(5);
    expect(index.entries[9293]?.errata.verified).toBe(4);
    expect(index.entries[2119]?.errata).toEqual({ verified: 0, held: 0, reported: 0 });
  });
});
