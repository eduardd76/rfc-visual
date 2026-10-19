import { RfcSearch } from "~/components/rfc-search";
import { canonicalRfcPath } from "~/rfc/canonical";
import { allVisuals } from "~/visuals/registry";

// Short protocol names for the RFCs that have a hand-built visual.
const SHORT_NAMES: Record<number, string> = {
  768: "UDP", 791: "IPv4", 792: "ICMP", 826: "ARP", 1034: "DNS concepts", 1035: "DNS",
  2131: "DHCP", 2328: "OSPFv2", 4271: "BGP-4", 4443: "ICMPv6", 4861: "Neighbor Discovery",
  5880: "BFD", 8200: "IPv6", 8446: "TLS 1.3 (2018)", 9000: "QUIC", 9112: "HTTP/1.1",
  9293: "TCP", 9846: "TLS 1.3",
};

export default function HomePage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10 sm:px-8 sm:py-16">
      <h1 className="text-4xl font-bold sm:text-5xl">Every RFC, explained visually</h1>
      <p className="mt-4 text-lg">Search for a protocol you want to understand:</p>
      <div className="mt-4">
        <RfcSearch />
      </div>
      <p className="mt-8 text-lg">Or swap the host in any RFC link:</p>
      <p className="mt-2 font-mono text-sm break-all sm:text-base">
        www.rfc-editor.org/rfc/rfc9293 → <strong>rfc.vexpertai.com</strong>/rfc/rfc9293
      </p>
      <h2 className="mt-10 text-lg font-semibold">Start with a visual</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {allVisuals()
          .map((model) => ({ num: model.rfc, name: SHORT_NAMES[model.rfc] ?? `RFC ${model.rfc}` }))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(({ num, name }) => (
          <li key={num}>
            <a
              href={canonicalRfcPath(num)}
              className="neo-panel inline-block rounded-md px-3 py-1.5 text-sm font-medium hover:underline"
            >
              {name} <span className="text-[hsl(var(--neo-soft-text))]">RFC {num}</span>
            </a>
          </li>
          ))}
      </ul>
    </main>
  );
}
