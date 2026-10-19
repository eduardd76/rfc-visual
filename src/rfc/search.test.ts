import { describe, expect, it } from "vitest";

import { searchRfcs, type SearchEntry } from "~/rfc/search";

// [num, title, status, obsoleted, hasVisual]
const index: SearchEntry[] = [
  [793, "Transmission Control Protocol", "INTERNET STANDARD", 1, 0],
  [9293, "Transmission Control Protocol (TCP)", "INTERNET STANDARD", 0, 1],
  [1771, "A Border Gateway Protocol 4 (BGP-4)", "DRAFT STANDARD", 1, 0],
  [4271, "A Border Gateway Protocol 4 (BGP-4)", "DRAFT STANDARD", 0, 1],
  [7606, "Revised Error Handling for BGP UPDATE Messages", "PROPOSED STANDARD", 0, 0],
  [792, "Internet Control Message Protocol", "INTERNET STANDARD", 0, 1],
  [2131, "Dynamic Host Configuration Protocol", "DRAFT STANDARD", 0, 1],
  [8415, "Dynamic Host Configuration Protocol for IPv6 (DHCPv6)", "PROPOSED STANDARD", 0, 0],
  [1, "Host Software", "UNKNOWN", 0, 0],
  [1576, "TN3270 Current Practices", "INFORMATIONAL", 0, 0],
  [9846, "The Transport Layer Security (TLS) Protocol Version 1.3", "PROPOSED STANDARD", 0, 0],
  [10024, "Post-Quantum Traditional (PQ/T) Hybrid Key Exchange in TLS 1.3 for Constrained Devices", "PROPOSED STANDARD", 0, 0],
  [5905, "Network Time Protocol Version 4: Protocol and Algorithms Specification", "PROPOSED STANDARD", 0, 0],
];
const nums = (query: string) => searchRfcs(index, query).map((e) => e[0]);

describe("searchRfcs", () => {
  it("puts the current standard with a visual first", () => {
    expect(nums("bgp")[0]).toBe(4271);
    expect(nums("tcp")[0]).toBe(9293);
  });

  it("ranks obsoleted RFCs below current ones", () => {
    const bgp = nums("bgp");
    expect(bgp.indexOf(1771)).toBeGreaterThan(bgp.indexOf(7606));
  });

  it("finds protocols whose title does not contain the acronym", () => {
    expect(nums("icmp")[0]).toBe(792);
  });

  it("matches title words, case-insensitively, across several terms", () => {
    expect(nums("host configuration")).toEqual([2131, 8415]);
  });

  it("prefers the RFC that defines a protocol over long titles that mention it", () => {
    expect(nums("tls")[0]).toBe(9846);
  });

  it("does not let a coincidental acronym outrank a real match", () => {
    expect(nums("tcp").indexOf(1576)).toBeGreaterThan(nums("tcp").indexOf(9293));
  });

  it("knows common names that are not in the title", () => {
    expect(nums("ntp")[0]).toBe(5905);
  });

  it("matches an RFC number directly", () => {
    expect(nums("2131")[0]).toBe(2131);
    expect(nums("rfc 9293")[0]).toBe(9293);
  });

  it("returns nothing for an empty or unknown query", () => {
    expect(nums("")).toEqual([]);
    expect(nums("zzzz")).toEqual([]);
  });

  it("limits the number of results", () => {
    expect(searchRfcs(index, "protocol", 2)).toHaveLength(2);
  });
});
