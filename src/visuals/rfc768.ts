import type { RfcVisualModel } from "~/visuals/types";

// Hand-built from RFC 768. Every quote is verbatim RFC text (whitespace
// collapsed). RFC 768 has no numbered sections, so every cite uses "-".
export const rfc768: RfcVisualModel = {
  rfc: 768,
  reviewed: false,
  states: [],
  transitions: [],
  sequences: [],
  headers: [
    {
      id: "udp-header",
      title: "User Datagram Header Format",
      intro: {
        section: "-",
        quote: "This protocol provides a procedure for application programs to send messages to other programs with a minimum of protocol mechanism.",
      },
      fields: [
        {
          name: "Source Port",
          bits: 16,
          explain: "Optional. When used, it is the sending process's port, and a reply can be sent back to it. If not used, it is set to zero.",
          cite: {
            section: "-",
            quote: "Source Port is an optional field, when meaningful, it indicates the port of the sending process, and may be assumed to be the port to which a reply should be addressed in the absence of any other information. If not used, a value of zero is inserted.",
          },
        },
        {
          name: "Destination Port",
          bits: 16,
          explain: "The port of the receiving process. It only has meaning together with the destination internet address.",
          cite: {
            section: "-",
            quote: "Destination Port has a meaning within the context of a particular internet destination address.",
          },
        },
        {
          name: "Length",
          bits: 16,
          explain: "The size in octets of the whole datagram, header plus data, so it can never be less than eight.",
          cite: {
            section: "-",
            quote: "Length is the length in octets of this user datagram including this header and the data. (This means the minimum value of the length is eight.)",
          },
        },
        {
          name: "Checksum",
          bits: 16,
          explain: "A one's complement checksum over a pseudo header (taken from the IP header), the UDP header and the data. An all-zero value means the sender did not compute a checksum.",
          cite: {
            section: "-",
            quote: "Checksum is the 16-bit one's complement of the one's complement sum of a pseudo header of information from the IP header, the UDP header, and the data, padded with zero octets at the end (if necessary) to make a multiple of two octets.",
          },
        },
        {
          name: "data",
          bits: "var",
          explain: "The application's message. Its size is whatever the Length field says, minus the header.",
          cite: {
            section: "-",
            quote: "Length is the length in octets of this user datagram including this header and the data.",
          },
        },
      ],
    },
  ],
  notShown: [
    "The pseudo header layout (source address, destination address, zero, protocol, UDP length) used for the checksum",
    "Sending a computed checksum of zero as all ones",
    "The user interface and IP interface descriptions",
    "Protocol number 17 in the IP Protocol field",
  ],
};
