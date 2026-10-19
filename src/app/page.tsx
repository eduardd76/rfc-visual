import { RfcSearch } from "~/components/rfc-search";
import { canonicalRfcPath } from "~/rfc/canonical";

// Spec §5.8 starter set.
const STARTER_RFCS: { num: number; name: string }[] = [
  { num: 9293, name: "TCP" },
  { num: 768, name: "UDP" },
  { num: 791, name: "IPv4" },
  { num: 8200, name: "IPv6" },
  { num: 826, name: "ARP" },
  { num: 2131, name: "DHCP" },
  { num: 1035, name: "DNS" },
  { num: 4271, name: "BGP-4" },
  { num: 2328, name: "OSPFv2" },
  { num: 5880, name: "BFD" },
  { num: 8446, name: "TLS 1.3" },
  { num: 9000, name: "QUIC" },
  { num: 9110, name: "HTTP" },
];

export default function HomePage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10 sm:px-8 sm:py-16">
      <h1 className="text-4xl font-bold sm:text-5xl">Every RFC, explained visually</h1>
      <p className="mt-4 text-lg">Swap the host in any RFC link:</p>
      <p className="mt-2 font-mono text-sm break-all sm:text-base">
        www.rfc-editor.org/rfc/rfc9293 → <strong>rfc.vexpertai.com</strong>/rfc/rfc9293
      </p>
      <div className="mt-8">
        <RfcSearch />
      </div>
      <h2 className="mt-10 text-lg font-semibold">Start with</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {STARTER_RFCS.map(({ num, name }) => (
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
