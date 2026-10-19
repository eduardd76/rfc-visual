import type { RfcVisualModel } from "~/visuals/types";

// Hand-built from RFC 826 (ARP). Every quote is verbatim RFC text (whitespace
// collapsed). RFC 826 has no numbered sections, so every cite uses "-".
export const rfc826: RfcVisualModel = {
  rfc: 826,
  reviewed: false,
  states: [],
  transitions: [],
  sequences: [
    {
      id: "resolve",
      title: "Resolving an address (request and reply)",
      participants: { a: "Machine X", b: "Machine Y" },
      intro: { section: "-", quote: "Let there exist machines X and Y that are on the same 10Mbit Ethernet cable." },
      steps: [
        {
          from: "A",
          segment: "ares_op$REQUEST",
          explain:
            "X has no table entry for Y's protocol address, so it builds a REQUEST carrying its own hardware and protocol addresses plus Y's protocol address, leaves the target hardware address unset, and broadcasts it.",
          cite: {
            section: "-",
            quote:
              "(ar$op) = ares_op$REQUEST (ar$sha) = EA(X) (ar$spa) = IPA(X) (ar$tha) = don't care (ar$tpa) = IPA(Y) and broadcasts this packet to everybody on the cable.",
          },
        },
        {
          from: "B",
          segment: "ares_op$REPLY",
          explain:
            "Y sees it is the target, records X's mapping, then turns the same packet into a REPLY: it swaps the sender and target fields, puts its own addresses in the sender fields and sends it straight back to X, not broadcast.",
          cite: {
            section: "-",
            quote:
              "Swap hardware and protocol fields, putting the local hardware and protocol addresses in the sender fields. Set the ar$op field to ares_op$REPLY Send the packet to the (new) target hardware address on the same hardware on which the request was received.",
          },
        },
      ],
    },
  ],
  headers: [
    {
      id: "arp-packet",
      title: "ARP packet (Ethernet packet data)",
      intro: {
        section: "-",
        quote:
          "To communicate mappings from <protocol, address> pairs to 48.bit Ethernet addresses, a packet format that embodies the Address Resolution protocol is needed.",
      },
      fields: [
        {
          name: "ar$hrd",
          bits: 16,
          explain: "Which kind of hardware address space this is, e.g. Ethernet (ares_hrd$Ethernet = 1).",
          cite: { section: "-", quote: "16.bit: (ar$hrd) Hardware address space (e.g., Ethernet, Packet Radio Net.)" },
        },
        {
          name: "ar$pro",
          bits: 16,
          explain: "Which protocol's address is being resolved. On Ethernet it reuses the Ethernet type value for that protocol.",
          cite: {
            section: "-",
            quote: "16.bit: (ar$pro) Protocol address space. For Ethernet hardware, this is from the set of type fields ether_typ$<protocol>.",
          },
        },
        {
          name: "ar$hln",
          bits: 8,
          explain: "Length in bytes of each hardware address in this packet (6 for a 48-bit Ethernet address).",
          cite: { section: "-", quote: "8.bit: (ar$hln) byte length of each hardware address" },
        },
        {
          name: "ar$pln",
          bits: 8,
          explain: "Length in bytes of each protocol address in this packet.",
          cite: { section: "-", quote: "8.bit: (ar$pln) byte length of each protocol address" },
        },
        {
          name: "ar$op",
          bits: 16,
          explain: "Whether this packet is a REQUEST or a REPLY.",
          cite: { section: "-", quote: "16.bit: (ar$op) opcode (ares_op$REQUEST | ares_op$REPLY)" },
        },
        {
          name: "ar$sha",
          bits: "var",
          explain: "The sender's hardware address. Its length in bytes comes from ar$hln.",
          cite: { section: "-", quote: "nbytes: (ar$sha) Hardware address of sender of this packet, n from the ar$hln field." },
        },
        {
          name: "ar$spa",
          bits: "var",
          explain: "The sender's protocol address. Its length in bytes comes from ar$pln.",
          cite: { section: "-", quote: "mbytes: (ar$spa) Protocol address of sender of this packet, m from the ar$pln field." },
        },
        {
          name: "ar$tha",
          bits: "var",
          explain: "The target's hardware address, if known. In a request it has no meaning, because it is the value being asked for.",
          cite: { section: "-", quote: "nbytes: (ar$tha) Hardware address of target of this packet (if known)." },
        },
        {
          name: "ar$tpa",
          bits: "var",
          explain: "The target's protocol address: the address whose hardware address the requester wants.",
          cite: { section: "-", quote: "mbytes: (ar$tpa) Protocol address of target." },
        },
      ],
    },
  ],
  notShown: [
    "The Ethernet transmission-layer header in front of the ARP data (destination, sender, type = ether_type$ADDRESS_RESOLUTION)",
    "The full receive algorithm (hardware/protocol checks, Merge_flag and translation-table updates before the opcode is examined)",
    "Network monitoring and debugging use of ARP",
    "Table aging and timeouts, which the RFC places outside the protocol's scope",
  ],
};
