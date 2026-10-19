import type { RfcVisualModel } from "~/visuals/types";

// Hand-built from RFC 791. Every quote is verbatim RFC text (whitespace
// collapsed). Field quotes include the RFC's own "Name: N bits" heading so
// that the quote names the field as the RFC spells it.
export const rfc791: RfcVisualModel = {
  rfc: 791,
  reviewed: false,
  states: [],
  transitions: [],
  sequences: [],
  headers: [
    {
      id: "ipv4-header",
      title: "Internet Header Format",
      intro: { section: "3.1", quote: "A summary of the contents of the internet header follows:" },
      fields: [
        {
          name: "Version",
          bits: 4,
          explain: "Tells the receiver which header format follows. This RFC describes version 4.",
          cite: { section: "3.1", quote: "Version: 4 bits The Version field indicates the format of the internet header. This document describes version 4." },
        },
        {
          name: "IHL",
          bits: 4,
          explain: "Internet Header Length: how long the header is, counted in 32-bit words, so it also marks where the data starts. A correct header has a value of at least 5.",
          cite: { section: "3.1", quote: "IHL: 4 bits Internet Header Length is the length of the internet header in 32 bit words, and thus points to the beginning of the data. Note that the minimum value for a correct header is 5." },
        },
        {
          name: "Type of Service",
          bits: 8,
          explain: "Asks for a quality of service, such as precedence and a trade-off between low delay, high reliability and high throughput. Networks use it to pick how they carry the datagram.",
          cite: { section: "3.1", quote: "Type of Service: 8 bits The Type of Service provides an indication of the abstract parameters of the quality of service desired." },
        },
        {
          name: "Total Length",
          bits: 16,
          explain: "The size of the whole datagram in octets, header plus data.",
          cite: { section: "3.1", quote: "Total Length: 16 bits Total Length is the length of the datagram, measured in octets, including internet header and data." },
        },
        {
          name: "Identification",
          bits: 16,
          explain: "A value the sender picks so the fragments of one datagram can be put back together.",
          cite: { section: "3.1", quote: "Identification: 16 bits An identifying value assigned by the sender to aid in assembling the fragments of a datagram." },
        },
        {
          name: "Flags",
          bits: 3,
          explain: "Control flags. Bit 0 is reserved and zero, DF (Don't Fragment) forbids fragmenting, and MF (More Fragments) says this is not the last fragment.",
          cite: { section: "3.1", quote: "Flags: 3 bits Various Control Flags. Bit 0: reserved, must be zero Bit 1: (DF) 0 = May Fragment, 1 = Don't Fragment. Bit 2: (MF) 0 = Last Fragment, 1 = More Fragments." },
        },
        {
          name: "Fragment Offset",
          bits: 13,
          explain: "Where this fragment's data belongs in the original datagram, counted in units of 8 octets. The first fragment has offset zero.",
          cite: { section: "3.1", quote: "Fragment Offset: 13 bits This field indicates where in the datagram this fragment belongs." },
        },
        {
          name: "Time to Live",
          bits: 8,
          explain: "The longest the datagram may stay in the internet. Every module that processes it lowers the value by at least one, and a datagram whose value is zero must be destroyed.",
          cite: { section: "3.1", quote: "Time to Live: 8 bits This field indicates the maximum time the datagram is allowed to remain in the internet system. If this field contains the value zero, then the datagram must be destroyed." },
        },
        {
          name: "Protocol",
          bits: 8,
          explain: "Which next-level protocol is carried in the data part, using the numbers from Assigned Numbers.",
          cite: { section: "3.1", quote: "Protocol: 8 bits This field indicates the next level protocol used in the data portion of the internet datagram." },
        },
        {
          name: "Header Checksum",
          bits: 16,
          explain: "A checksum over the header only. Because fields such as time to live change on the way, it is recomputed and checked wherever the header is processed.",
          cite: { section: "3.1", quote: "Header Checksum: 16 bits A checksum on the header only. Since some header fields change (e.g., time to live), this is recomputed and verified at each point that the internet header is processed." },
        },
        {
          name: "Source Address",
          bits: 32,
          explain: "The address of the sender.",
          cite: { section: "3.1", quote: "Source Address: 32 bits The source address. See section 3.2." },
        },
        {
          name: "Destination Address",
          bits: 32,
          explain: "The address the datagram is going to.",
          cite: { section: "3.1", quote: "Destination Address: 32 bits The destination address. See section 3.2." },
        },
        {
          name: "Options",
          bits: "var",
          explain: "Zero or more options. Every IP module must implement them, but any given datagram may or may not carry them.",
          cite: { section: "3.1", quote: "The option field is variable in length. There may be zero or more options." },
        },
        {
          name: "Padding",
          bits: "var",
          explain: "Zero bits added so the header ends on a 32-bit boundary.",
          cite: { section: "3.1", quote: "Padding: variable The internet header padding is used to ensure that the internet header ends on a 32 bit boundary. The padding is zero." },
        },
      ],
    },
  ],
  notShown: [
    "Type of Service sub-fields (precedence, D, T, R bits) and precedence values",
    "Option formats and individual options (security, source routing, record route, stream ID, timestamp)",
    "Fragmentation and reassembly procedures (§3.2)",
    "Addressing and address classes (§3.2)",
    "Interfaces to higher-level protocols (§3.3)",
  ],
};
