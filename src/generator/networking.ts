/**
 * Networking RFCs the generator drafts before anything else, in this order.
 * Only current RFCs belong here: the queue skips obsoleted ones, so list the
 * successor (9915, not 8415). Edit freely — order is priority.
 */
export const NETWORKING_FIRST: number[] = [
  // Routing: BGP, RIP, IS-IS, OSPF
  4760, 4456, 4364, 1997, 8092, 4724, 7911, 6793, 2453, 2080, 1195, 5308, 5305, 3630, 3101,
  // Multicast and first-hop redundancy
  7761, 3618, 4610, 9776, 9777, 9568,
  // MPLS and segment routing
  3031, 5036, 4090, 8402, 8660, 8754, 8986, 8665, 8667,
  // Overlays, tunnels and L2 VPN
  8365, 8926, 7637, 2784, 4448, 4761, 4762,
  // Transport
  5681, 6298, 9438, 3168, 8899, 8201, 1191, 9260, 6455, 9113, 9114,
  // IPv6
  4862, 9915, 4193, 8106, 4191,
  // Security and AAA
  4303, 4302, 4252, 4254, 9147, 2865, 2866, 8907,
  // Management and monitoring
  6241, 6242, 8040, 3411, 3414, 3416, 5424, 7011, 5881, 5883, 7130, 4656,
  // Services: file transfer, mail, DNS, NAT
  1350, 959, 5321, 8484, 7858, 6762, 6763, 2136, 3022, 4787, 8489, 8656,
  // PPP and access
  1661, 1994, 2516,
  // QoS, addressing and DHCP relay
  1112, 2474, 2475, 3246, 2597, 4632, 6890, 3046, 1918,
];

/** Titles that name a networking protocol or concept; ranked ahead of the rest. */
export const NETWORKING_TITLE =
  /\b(routing|router|route|bgp|ospf|is-is|rip|mpls|ldp|rsvp|segment|ipv4|ipv6|ip|tcp|udp|sctp|quic|icmp|arp|ethernet|vpn|evpn|vxlan|tunnel|multicast|pim|igmp|mld|packet|link|network|dhcp|dns|nat|ppp|bfd|congestion|transport|label|forwarding|traffic|qos|snmp|netconf|yang)\b/i;
