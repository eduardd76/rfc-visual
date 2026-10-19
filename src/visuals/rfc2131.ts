import type { RfcVisualModel } from "~/visuals/types";

// Hand-built from RFC 2131 (DHCP). Every quote is verbatim RFC text
// (whitespace collapsed). Where the prose does not name the states of a
// transition, the quote is taken from the ASCII art of Figure 5 (section 4.4).
const FIG5 = "From the ASCII art of Figure 5; the quote spans neighbouring parts of the drawing.";

export const rfc2131: RfcVisualModel = {
  rfc: 2131,
  initial: "INIT",
  stateMachineTitle: "DHCP client states",
  reviewed: false,
  states: [
    { id: "INIT", cite: { section: "4.4.1", quote: "The client begins in INIT state and forms a DHCPDISCOVER message." } },
    { id: "SELECTING", cite: { section: "4.3.2", quote: "DHCPREQUEST generated during SELECTING state:" } },
    { id: "REQUESTING", cite: { section: "4.4", quote: "| REQUESTING |" } },
    { id: "BOUND", cite: { section: "4.4.1", quote: "Once the DHCPACK message from the server arrives, the client is initialized and moves to BOUND state." } },
    {
      id: "RENEWING",
      cite: {
        section: "4.4.5",
        quote: "T1 is the time at which the client enters the RENEWING state and attempts to contact the server that originally issued the client's network address.",
      },
    },
    {
      id: "REBINDING",
      cite: { section: "4.4.5", quote: "T2 is the time at which the client enters the REBINDING state and attempts to contact any server." },
    },
  ],
  transitions: [
    {
      from: "INIT", to: "SELECTING", event: "start", action: "snd DHCPDISCOVER", layer: "happy",
      note: FIG5,
      cite: {
        section: "4.4",
        quote:
          "-/Send DHCPDISCOVER | -/Send DHCPREQUEST | | | | | | DHCPACK v | | ----------- | (not accept.)/ ----------- | | | | | Send DHCPDECLINE | | | | REBOOTING | | | | SELECTING |",
      },
    },
    {
      from: "SELECTING", to: "REQUESTING", event: "select offer", action: "snd DHCPREQUEST", layer: "happy",
      note: FIG5,
      cite: {
        section: "4.4",
        quote:
          "Select offer/ | timers T1, T2 ------------ send DHCPREQUEST | | | +----->| | DHCPNAK, Lease expired/ | | | | REQUESTING |",
      },
    },
    {
      from: "REQUESTING", to: "BOUND", event: "rcv DHCPACK", action: "record lease, set T1, T2", layer: "happy",
      note: FIG5 + " Section 4.4.1 says the same in prose: once the DHCPACK arrives the client moves to BOUND state.",
      cite: {
        section: "4.4",
        quote:
          "+--------+ DHCPACK/ | | | | Record lease, set -----| REBINDING | | | timers T1, T2 / | | | | | DHCPACK/ ----------- | | v Record lease, set ^ | +----------------> ------- /timers T1,T2 | | +----->| |<---+ | | | | BOUND |",
      },
    },
    {
      from: "BOUND", to: "RENEWING", event: "T1 expires", action: "snd DHCPREQUEST unicast", layer: "happy",
      note: FIG5,
      cite: {
        section: "4.4",
        quote:
          "T1 expires/ Record lease, set | | Send DHCPREQUEST timers T1, T2 | | to leasing server | | | | ---------- | | | | |------------+ | +->| RENEWING |",
      },
    },
    {
      from: "RENEWING", to: "BOUND", event: "rcv DHCPACK", action: "record lease", layer: "happy",
      cite: {
        section: "4.4.5",
        quote: "The client has successfully reacquired its network address, returns to BOUND state and may continue network processing.",
      },
    },
    {
      from: "RENEWING", to: "REBINDING", event: "T2 expires", action: "bcast DHCPREQUEST", layer: "happy",
      cite: {
        section: "4.4.5",
        quote:
          "If no DHCPACK arrives before time T2, the client moves to REBINDING state and sends (via broadcast) a DHCPREQUEST message to extend its lease.",
      },
    },
    {
      from: "REBINDING", to: "BOUND", event: "rcv DHCPACK", action: "record lease, set T1, T2", layer: "happy",
      note: FIG5,
      cite: {
        section: "4.4",
        quote: "DHCPACK/ ----------- | | v Record lease, set ^ | +----------------> ------- /timers T1,T2 | | +----->| |<---+ | | | | BOUND |",
      },
    },
    {
      from: "REBINDING", to: "INIT", event: "lease expired", action: "halt network", layer: "error",
      cite: {
        section: "4.4.5",
        quote:
          "If the lease expires before the client receives a DHCPACK, the client moves to INIT state, MUST immediately stop any other network processing and requests network initialization parameters as if the client were uninitialized.",
      },
    },
  ],
  sequences: [
    {
      id: "dora",
      title: "Allocating a new address (DISCOVER, OFFER, REQUEST, ACK)",
      participants: { a: "Client", b: "Server" },
      intro: {
        section: "3.1",
        quote: "The timeline diagram in figure 3 shows the timing relationships in a typical client-server interaction.",
      },
      steps: [
        {
          from: "A",
          segment: "DHCPDISCOVER",
          explain: "The client broadcasts a DHCPDISCOVER on its local subnet to locate available servers. Relay agents may pass it on to servers on other subnets.",
          cite: { section: "3.1", quote: "The client broadcasts a DHCPDISCOVER message on its local physical subnet." },
        },
        {
          from: "B",
          segment: "DHCPOFFER",
          explain: "A server may answer with a DHCPOFFER that carries an available address in 'yiaddr' plus other configuration in options.",
          cite: {
            section: "3.1",
            quote:
              "Each server may respond with a DHCPOFFER message that includes an available network address in the 'yiaddr' field (and other configuration parameters in DHCP options).",
          },
        },
        {
          from: "A",
          segment: "DHCPREQUEST",
          explain: "The client picks one offer and broadcasts a DHCPREQUEST naming the chosen server in the 'server identifier' option. Servers not chosen take it as a decline.",
          cite: {
            section: "3.1",
            quote:
              "The client broadcasts a DHCPREQUEST message that MUST include the 'server identifier' option to indicate which server it has selected, and that MAY include other options specifying desired configuration values.",
          },
        },
        {
          from: "B",
          segment: "DHCPACK",
          explain: "The chosen server commits the lease binding to persistent storage and replies with a DHCPACK holding the configuration. The client is then configured.",
          cite: {
            section: "3.1",
            quote:
              "The server selected in the DHCPREQUEST message commits the binding for the client to persistent storage and responds with a DHCPACK message containing the configuration parameters for the requesting client.",
          },
        },
      ],
    },
  ],
  headers: [
    {
      id: "dhcp-message",
      title: "DHCP message",
      intro: {
        section: "2",
        quote: "Figure 1 gives the format of a DHCP message and table 1 describes each of the fields in the DHCP message.",
      },
      fields: [
        { name: "op", bits: 8, explain: "Message op code: 1 means BOOTREQUEST, 2 means BOOTREPLY.",
          cite: { section: "2", quote: "op 1 Message op code / message type. 1 = BOOTREQUEST, 2 = BOOTREPLY" } },
        { name: "htype", bits: 8, explain: "Hardware address type, using the ARP values from Assigned Numbers, e.g. 1 for 10 Mb Ethernet.",
          cite: { section: "2", quote: "htype 1 Hardware address type, see ARP section in \"Assigned Numbers\" RFC; e.g., '1' = 10mb ethernet." } },
        { name: "hlen", bits: 8, explain: "Hardware address length, e.g. 6 for 10 Mb Ethernet.",
          cite: { section: "2", quote: "hlen 1 Hardware address length (e.g. '6' for 10mb ethernet)." } },
        { name: "hops", bits: 8, explain: "The client sets it to zero. Relay agents may use it when the client boots through a relay.",
          cite: { section: "2", quote: "hops 1 Client sets to zero, optionally used by relay agents when booting via a relay agent." } },
        { name: "xid", bits: 32, explain: "Transaction ID: a random number the client picks so client and server can match replies to requests.",
          cite: { section: "2", quote: "xid 4 Transaction ID, a random number chosen by the client, used by the client and server to associate messages and responses between a client and a server." } },
        { name: "secs", bits: 16, explain: "Filled in by the client: seconds since it began acquiring or renewing an address.",
          cite: { section: "2", quote: "secs 2 Filled in by client, seconds elapsed since client began address acquisition or renewal process." } },
        { name: "flags", bits: 16, explain: "Flags. The leftmost bit is the BROADCAST (B) flag; the other bits must be zero.",
          cite: { section: "2", quote: "flags 2 Flags (see figure 2)." } },
        { name: "ciaddr", bits: 32, explain: "Client IP address, filled in only when the client is in BOUND, RENEW or REBINDING state and can answer ARP requests.",
          cite: { section: "2", quote: "ciaddr 4 Client IP address; only filled in if client is in BOUND, RENEW or REBINDING state and can respond to ARP requests." } },
        { name: "yiaddr", bits: 32, explain: "'Your' IP address: the address the server is giving the client.",
          cite: { section: "2", quote: "yiaddr 4 'your' (client) IP address." } },
        { name: "siaddr", bits: 32, explain: "IP address of the next server to use in bootstrap, returned by the server in DHCPOFFER and DHCPACK.",
          cite: { section: "2", quote: "siaddr 4 IP address of next server to use in bootstrap; returned in DHCPOFFER, DHCPACK by server." } },
        { name: "giaddr", bits: 32, explain: "IP address of the relay agent, used when booting through a relay agent.",
          cite: { section: "2", quote: "giaddr 4 Relay agent IP address, used in booting via a relay agent." } },
        { name: "chaddr", bits: 128, explain: "The client's hardware address.",
          cite: { section: "2", quote: "chaddr 16 Client hardware address." } },
        { name: "sname", bits: 512, explain: "Optional server host name, as a null-terminated string.",
          cite: { section: "2", quote: "sname 64 Optional server host name, null terminated string." } },
        { name: "file", bits: 1024, explain: "Boot file name, as a null-terminated string.",
          cite: { section: "2", quote: "file 128 Boot file name, null terminated string;" } },
        { name: "options", bits: "var", explain: "Variable-length field of optional parameters (what BOOTP called vendor extensions).",
          cite: { section: "2", quote: "options var Optional parameters field. See the options documents for a list of defined options." } },
      ],
    },
  ],
  notShown: [
    "INIT-REBOOT and REBOOTING (reusing a known address, sections 3.2 and 4.4.2): Figure 5 has no transition into INIT-REBOOT from the states shown, so they cannot be placed on the path from INIT",
    "Failure paths back to INIT from REQUESTING (DHCPNAK, DHCPACK not acceptable / send DHCPDECLINE) and from RENEWING and REBINDING on DHCPNAK, which appear only in Figure 5 and are not tied to their source state in the prose",
    "Messages that Figure 5 shows being collected or discarded without a state change",
    "DHCPNAK, DHCPDECLINE, DHCPRELEASE and DHCPINFORM exchanges",
    "Server behaviour (address selection, lease commitment, section 4.3) and relay agents",
    "Retransmission timing, the T1 and T2 default values, and the BROADCAST flag rules (section 4.1)",
    "Contents of individual options",
  ],
};
