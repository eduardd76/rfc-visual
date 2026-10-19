import type { RfcVisualModel } from "~/visuals/types";

// Hand-built from RFC 8200 (IPv6). Every quote is verbatim RFC text
// (whitespace collapsed) and is checked against the RFC by the validator.
export const rfc8200: RfcVisualModel = {
  rfc: 8200,
  reviewed: false,
  states: [],
  transitions: [],
  sequences: [],
  headers: [
    {
      id: "ipv6",
      title: "IPv6 header",
      intro: { section: "3", quote: "IPv6 Header Format" },
      fields: [
        { name: "Version", bits: 4,
          explain: "The Internet Protocol version number. For IPv6 it is 6.",
          cite: { section: "3", quote: "Version 4-bit Internet Protocol version number = 6." } },
        { name: "Traffic Class", bits: 8,
          explain: "Used by the network for traffic management. Its value may be changed along the path, so the receiver can see a different value than the source sent.",
          cite: { section: "7", quote: "The 8-bit Traffic Class field in the IPv6 header is used by the network for traffic management." } },
        { name: "Flow Label", bits: 20,
          explain: "Lets the source label a sequence of packets that the network should treat as a single flow.",
          cite: { section: "6", quote: "The 20-bit Flow Label field in the IPv6 header is used by a source to label sequences of packets to be treated in the network as a single flow." } },
        { name: "Payload Length", bits: 16,
          explain: "How many octets follow the IPv6 header. Any extension headers count as part of the payload.",
          cite: { section: "3", quote: "Payload Length 16-bit unsigned integer. Length of the IPv6 payload, i.e., the rest of the packet following this IPv6 header, in octets." } },
        { name: "Next Header", bits: 8,
          explain: "Says what kind of header comes right after the IPv6 header, using the same numbers as the IPv4 Protocol field.",
          cite: { section: "3", quote: "Next Header 8-bit selector. Identifies the type of header immediately following the IPv6 header." } },
        { name: "Hop Limit", bits: 8,
          explain: "Each forwarding node subtracts 1. A router discards the packet if Hop Limit was zero when received or reaches zero.",
          cite: { section: "3", quote: "Hop Limit 8-bit unsigned integer. Decremented by 1 by each node that forwards the packet." } },
        { name: "Source Address", bits: 128,
          explain: "The address of the node that originated the packet.",
          cite: { section: "3", quote: "Source Address 128-bit address of the originator of the packet." } },
        { name: "Destination Address", bits: 128,
          explain: "The address of the intended recipient. With a Routing header present, this may not be the final recipient.",
          cite: { section: "3", quote: "Destination Address 128-bit address of the intended recipient of the packet (possibly not the ultimate recipient, if a Routing header is present)." } },
      ],
    },
  ],
  notShown: [
    "Extension headers and their order (§4, §4.1): Hop-by-Hop Options, Routing, Fragment, Destination Options",
    "Option encoding inside Hop-by-Hop and Destination Options headers (§4.2)",
    "Fragmentation and reassembly (§4.5)",
    "Packet size and the 1280-octet minimum MTU (§5)",
    "Upper-layer checksums and the pseudo-header (§8.1)",
    "Detailed Flow Label and Traffic Class semantics, defined in RFC 6437, RFC 2474 and RFC 3168",
  ],
};
