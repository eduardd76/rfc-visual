import type { RfcVisualModel } from "~/visuals/types";

// Hand-built from RFC 1034. Every quote is verbatim RFC text (whitespace
// collapsed) and is checked against the RFC by scripts/validate-visual.ts.
export const rfc1034: RfcVisualModel = {
  rfc: 1034,
  reviewed: false,
  states: [],
  transitions: [],
  sequences: [
    {
      id: "resolver-algorithm",
      title: "Resolver algorithm: following a referral",
      participants: { a: "Resolver", b: "Name servers" },
      intro: { section: "5.3.3", quote: "The top level algorithm has four steps:" },
      steps: [
        { from: "A", segment: "queries",
          explain: "The resolver has no answer in local information, so it finds the best servers to ask (its SLIST) and sends them queries until one responds.",
          cite: { section: "5.3.3", quote: "3. Send them queries until one returns a response." } },
        { from: "B", segment: "better delegation",
          explain: "A response may be a referral: a better delegation to other servers. The resolver caches it and goes back to choosing the best servers to ask.",
          cite: { section: "5.3.3", quote: "b. if the response contains a better delegation to other servers, cache the delegation information, and go to step 2." } },
        { from: "A", segment: "queries",
          explain: "The resolver now queries the servers from the delegation, which are closer to the answer.",
          cite: { section: "5.3.3", quote: "3. Send them queries until one returns a response." } },
        { from: "B", segment: "answers the question",
          explain: "When a response answers the question, or says the name does not exist, the resolver caches the data and returns it to the client.",
          cite: { section: "5.3.3", quote: "a. if the response answers the question or contains a name error, cache the data as well as returning it back to the client." } },
      ],
    },
    {
      id: "mx-isi-edu",
      title: "Example: resolve MX for ISI.EDU",
      participants: { a: "Resolver", b: "Name servers" },
      intro: { section: "6.3.1", quote: "The mailer might then ask for type MX RRs for the domain name ISI.EDU." },
      steps: [
        { from: "A", segment: "OPCODE=SQUERY",
          explain: "With an empty cache, the resolver copies its safety-belt servers (SBELT) into SLIST and sends a standard query for the MX records of ISI.EDU.",
          cite: { section: "6.3.1", quote: "Header | OPCODE=SQUERY |" } },
        { from: "B", segment: "OPCODE=SQUERY, RESPONSE",
          explain: "SRI-NIC.ARPA replies with no answer, but with NS records for ISI.EDU in the authority section and their addresses in the additional section: a closer delegation.",
          cite: { section: "6.3.1", quote: "Header | OPCODE=SQUERY, RESPONSE |" } },
        { from: "A", segment: "start transmitting",
          explain: "The resolver caches the delegation, builds a new SLIST from the ISI.EDU servers, and sends the query again.",
          cite: { section: "6.3.1", quote: "The resolver would again start transmitting and waiting for responses." } },
        { from: "B", segment: "OPCODE=SQUERY, RESPONSE, AA",
          explain: "An authoritative (AA) response carries the MX records. The resolver adds them to its cache and returns them to its client.",
          cite: { section: "6.3.1", quote: "Header | OPCODE=SQUERY, RESPONSE, AA |" } },
      ],
    },
  ],
  headers: [],
  notShown: [
    "Step 4c: following a CNAME by restarting the search at the canonical name (§5.3.3)",
    "Step 4d: deleting a failed or bizarre server from SLIST and retrying (§5.3.3)",
    "How SLIST is built, sorted and initialised from SBELT, and retransmission timeouts (§5.3.3)",
    "Name server side lookup algorithm, wildcards and negative caching (§4.3)",
    "Zone transfers and zone maintenance (§4.3.5)",
    "Other example resolutions, e.g. PTR lookup (§6.3.2, §6.3.3)",
  ],
};
