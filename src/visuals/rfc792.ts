import type { RfcVisualModel } from "~/visuals/types";

// Hand-built from RFC 792. Every quote is verbatim RFC text (whitespace
// collapsed, including the RFC's own "ones's" typo). RFC 792 has no numbered
// sections, so every cite uses "-".
export const rfc792: RfcVisualModel = {
  rfc: 792,
  reviewed: false,
  states: [],
  transitions: [],
  sequences: [
    {
      id: "echo",
      title: "Echo and Echo Reply",
      participants: { a: "Host A", b: "Host B" },
      intro: {
        section: "-",
        quote: "The data received in the echo message must be returned in the echo reply message.",
      },
      steps: [
        {
          from: "A",
          segment: "echo message",
          explain: "Host A sends an echo message (Type 8) to Host B. It may carry an identifier, a sequence number and some data.",
          cite: {
            section: "-",
            quote: "The address of the source in an echo message will be the destination of the echo reply message.",
          },
        },
        {
          from: "B",
          segment: "echo reply message",
          explain: "Host B answers with an echo reply: it swaps the source and destination addresses, changes the type to 0, recomputes the checksum, and returns the same data, identifier and sequence number.",
          cite: {
            section: "-",
            quote: "To form an echo reply message, the source and destination addresses are simply reversed, the type code changed to 0, and the checksum recomputed.",
          },
        },
      ],
    },
  ],
  headers: [
    {
      id: "echo",
      title: "Echo or Echo Reply Message",
      intro: {
        section: "-",
        quote: "The identifier and sequence number may be used by the echo sender to aid in matching the replies with the echo requests.",
      },
      fields: [
        {
          name: "Type",
          bits: 8,
          explain: "8 for an echo message, 0 for an echo reply message.",
          cite: { section: "-", quote: "Type 8 for echo message; 0 for echo reply message." },
        },
        {
          name: "Code",
          bits: 8,
          explain: "Always 0 for echo and echo reply.",
          cite: { section: "-", quote: "Code 0 may be received from a gateway or a host." },
        },
        {
          name: "Checksum",
          bits: 16,
          explain: "A one's complement checksum over the ICMP message, starting at the Type field. The checksum field is set to zero while computing it, and odd-length data is padded with one zero octet.",
          cite: {
            section: "-",
            quote: "The checksum is the 16-bit ones's complement of the one's complement sum of the ICMP message starting with the ICMP Type. For computing the checksum , the checksum field should be zero. If the total length is odd, the received data is padded with one octet of zeros for computing the checksum.",
          },
        },
        {
          name: "Identifier",
          bits: 16,
          explain: "Helps the sender match replies to its echo requests, for example like a port to identify a session. May be zero.",
          cite: { section: "-", quote: "If code = 0, an identifier to aid in matching echos and replies, may be zero." },
        },
        {
          name: "Sequence Number",
          bits: 16,
          explain: "Also helps match replies to requests; for example, it might be incremented for each echo request sent. May be zero.",
          cite: { section: "-", quote: "If code = 0, a sequence number to aid in matching echos and replies, may be zero." },
        },
        {
          name: "Data",
          bits: "var",
          explain: "Whatever data the echo message carries. The replying host must return it unchanged in the echo reply.",
          cite: { section: "-", quote: "The data received in the echo message must be returned in the echo reply message." },
        },
      ],
    },
    {
      id: "destination-unreachable",
      title: "Destination Unreachable Message",
      intro: {
        section: "-",
        quote: "the gateway may send a destination unreachable message to the internet source host of the datagram.",
      },
      fields: [
        {
          name: "Type",
          bits: 8,
          explain: "3 marks a destination unreachable message.",
          cite: { section: "-", quote: "ICMP Fields: Type 3 Code 0 = net unreachable;" },
        },
        {
          name: "Code",
          bits: 8,
          explain: "Why delivery failed: 0 net, 1 host, 2 protocol, 3 port unreachable, 4 fragmentation needed and DF set, 5 source route failed. Codes 0, 1, 4 and 5 may come from a gateway; 2 and 3 from a host.",
          cite: {
            section: "-",
            quote: "Code 0 = net unreachable; 1 = host unreachable; 2 = protocol unreachable; 3 = port unreachable; 4 = fragmentation needed and DF set; 5 = source route failed.",
          },
        },
        {
          name: "Checksum",
          bits: 16,
          explain: "A one's complement checksum over the ICMP message, starting at the Type field, computed with the checksum field set to zero.",
          cite: {
            section: "-",
            quote: "The checksum is the 16-bit ones's complement of the one's complement sum of the ICMP message starting with the ICMP Type. For computing the checksum , the checksum field should be zero. This checksum may be replaced in the future.",
          },
        },
        {
          name: "unused",
          bits: 32,
          explain: "Not used in this message.",
          cite: { section: "-", quote: "| unused |" },
        },
        {
          name: "Internet Header + 64 bits of Data Datagram",
          bits: "var",
          explain: "A copy of the failed datagram's internet header plus the first 64 bits of its data, so the source host can match the error to the right process.",
          cite: {
            section: "-",
            quote: "Internet Header + 64 bits of Data Datagram The internet header plus the first 64 bits of the original",
          },
        },
      ],
    },
  ],
  notShown: [
    "The IP header fields used to carry ICMP messages",
    "Time Exceeded, Parameter Problem, Source Quench, Redirect, Timestamp and Information Request/Reply messages",
    "A Destination Unreachable exchange (when gateways and hosts send it)",
  ],
};
