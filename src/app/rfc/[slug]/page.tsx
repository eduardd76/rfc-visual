import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LineageGraph } from "~/components/lineage-graph";
import { RfcHeader } from "~/components/rfc-header";
import { RfcRelations } from "~/components/rfc-relations";
import { RfcText } from "~/components/rfc-text";
import { RfcVisuals } from "~/components/rfc-visuals";
import { GITHUB_REPO_URL } from "~/lib/site";
import { hasLineage, lineageRows, lineageToMermaid } from "~/rfc/lineage";
import { loadRfcIndex } from "~/rfc/load";
import { visualFor } from "~/visuals/registry";

export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams(): { slug: string }[] {
  return Object.keys(loadRfcIndex().entries).map((num) => ({ slug: `rfc${num}` }));
}

function entryFor(slug: string) {
  const num = /^rfc(\d+)$/.exec(slug)?.[1];
  return num ? loadRfcIndex().entries[Number(num)] : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const entry = entryFor((await params).slug);
  return entry ? { title: `RFC ${entry.num}: ${entry.title} — rfc-visual` } : {};
}

export default async function RfcPage({ params }: Props) {
  const index = loadRfcIndex();
  const entry = entryFor((await params).slug);
  if (!entry) notFound();
  const visual = visualFor(entry.num);
  const related = [...entry.obsoletes, ...entry.updates, ...entry.obsoletedBy, ...entry.updatedBy];
  const titles = Object.fromEntries(
    related.map((num) => [num, index.entries[num]?.title ?? ""]),
  );

  return (
    <main className="container mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-8 sm:py-10">
      <RfcHeader entry={entry} fetchedAt={index.fetchedAt} />

      {visual ? (
        <section>
          <h2 className="mb-2 text-lg font-semibold">How it works</h2>
          <RfcVisuals model={visual} />
        </section>
      ) : (
        <p className="rounded-md border-2 border-dashed border-black px-4 py-3 text-sm dark:border-neutral-500">
          A visual explanation of this RFC hasn&apos;t been generated yet. Showing its lineage
          and text.{" "}
          <a href={`${GITHUB_REPO_URL}#status`} className="neo-link hover:underline">
            What&apos;s coming
          </a>
        </p>
      )}

      <section>
        <h2 className="mb-2 text-lg font-semibold">Lineage</h2>
        {hasLineage(entry) ? (
          <div className="space-y-4">
            <div className="neo-panel rounded-lg p-2">
              <LineageGraph
                chart={lineageToMermaid(entry, index.entries)}
                rows={lineageRows(entry)}
              />
            </div>
            <RfcRelations entry={entry} titles={titles} />
          </div>
        ) : (
          <p className="text-sm">No other RFCs obsolete or update this one.</p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Text</h2>
        <div className="neo-panel rounded-lg p-4">
          <RfcText num={entry.num} formats={entry.formats} />
        </div>
      </section>
    </main>
  );
}
