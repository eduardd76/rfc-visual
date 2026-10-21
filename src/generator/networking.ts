/**
 * Networking RFCs the generator drafts before anything else, in this order.
 * Only current RFCs belong here: the queue skips obsoleted ones, so list the
 * successor (9915, not 8415). Edit freely — order is priority.
 */
export const NETWORKING_FIRST: number[] = [
  // Everyday DC and enterprise: EVPN-VXLAN, FHRP, EIGRP
  8365, 9136, 9135, 7868, 9568, 2281,
  // BGP core: MP-BGP, RR, L3VPN, capabilities, refresh, GR, error handling
  4760, 4456, 4364, 5492, 2918, 7313, 4724, 7606, 8538, 6793, 7911, 5065,
  // IGP: OSPF, IS-IS, RIP
  3101, 5250, 7684, 3623, 6987, 4577, 1195, 5303, 5308, 5120, 2453, 2080, 5838,
  // Multicast
  7761, 9776, 2236, 9777, 4607, 5059, 4610, 3618, 4541,
  // Campus NAC and AAA: EAP, 802.1X over RADIUS, CoA, TACACS+
  3748, 3579, 3580, 5176, 8907, 5216, 9190, 9930, 4675, 9887,
  // IPsec VPN and overlay control planes (DMVPN, LISP)
  4303, 4301, 3948, 3947, 7383, 9329, 4302, 2332, 2784, 2890, 9300, 9301, 9838,
  // MPLS, L3VPN extensions and MPLS OAM
  3031, 5036, 4659, 8277, 4090, 8029, 3443, 4950, 5462, 3270,
  // BFD and fast reroute
  5881, 5883, 5884, 7130, 7880, 5286, 7490, 9855, 8971,
  // Segment routing and SRv6
  8402, 8660, 8667, 8665, 9350, 9256, 9830, 8754, 8986, 9800, 9252, 9352, 9513, 9259, 8287,
  // EVPN and DC fabric, continued
  8584, 7623, 8214, 9251, 9161, 9572, 9014, 7938,
  // Controller plane: BGP-LS and PCEP
  9552, 9085, 9514, 5440, 8664, 8281, 9603,
  // Routing security: RPKI, route leaks, FlowSpec, RTBH, GTSM, TCP-AO, uRPF
  6811, 8210, 9234, 8955, 8956, 7999, 5082, 5925, 2827, 3704, 8704, 8326,
  // First-hop and DHCP security
  3046, 7513, 6105, 7610, 6221,
  // QoS
  2474, 2475, 3246, 2597, 2697, 2698, 4594, 3168,
  // PPP and broadband access
  2516, 1994, 1661,
  // IPv6 operations and transition
  4862, 9915, 8106, 4191, 8981, 7217, 6164, 6146, 6147, 6877, 6333, 7597,
  // Transport and MTU
  5681, 6298, 7323, 2018, 1191, 8201, 9438, 8899, 9260,
  // Management and telemetry
  6241, 6242, 8040, 7950, 8639, 8641, 3954, 7011, 9069, 3416, 3414, 3411, 5424, 5426, 5425, 4656, 8915,
  // L2VPN, pseudowires and other tunnels
  4448, 4385, 8077, 4761, 4762, 7676, 8086, 8926, 7637,
  // NAT, PKI, SSH and DNS services
  4787, 5382, 6888, 6598, 3022, 5227, 6960, 7030, 4252, 4254, 9147, 2866, 7858, 8484, 8489, 8656, 2136,
  // Low priority: attribute-only, design guidance or app layer
  1997, 8092, 8212, 6790, 4684, 6513, 7454, 8205, 9003, 4486, 9849, 5415, 5416, 4193, 6724, 6455, 9113, 9114, 7413, 6762, 6763, 5321,
];

/** Titles that name a networking protocol or concept; ranked ahead of the rest. */
export const NETWORKING_TITLE =
  /\b(routing|router|route|bgp|ospf|is-is|rip|mpls|ldp|rsvp|segment|ipv4|ipv6|ip|tcp|udp|sctp|quic|icmp|arp|ethernet|vpn|evpn|vxlan|tunnel|multicast|pim|igmp|mld|packet|link|network|dhcp|dns|nat|ppp|bfd|congestion|transport|label|forwarding|traffic|qos|snmp|netconf|yang)\b/i;
