import { RFC_EDITOR_ORIGIN } from "~/lib/site";
import { canonicalRfcPath } from "~/rfc/canonical";
import type { RfcEntry } from "~/rfc/types";

function plural(n: number, word: string): string {
  return `${n} ${word}`;
}

export function RfcHeader({ entry, fetchedAt }: { entry: RfcEntry; fetchedAt: string }) {
  const { errata } = entry;
  const errataUrl = `${RFC_EDITOR_ORIGIN}/errata/rfc${entry.num}`;
  return (
    <header className="neo-panel rounded-lg p-5 sm:p-6">
      <p className="text-sm font-semibold tracking-wide text-[hsl(var(--neo-soft-text))] uppercase dark:text-neutral-300">
        RFC {entry.num}
        {entry.date ? ` · ${entry.date}` : ""}
        {entry.authors.length > 0 ? ` · ${entry.authors.join(", ")}` : ""}
      </p>
      <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{entry.title}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded border-2 border-black px-2 py-0.5 font-semibold">
          {entry.status}
        </span>
        {entry.stream ? <span>{entry.stream} stream</span> : null}
      </div>

      {entry.obsoletedBy.length > 0 ? (
        <p className="mt-3 rounded border-2 border-red-600 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-200">
          Obsoleted by{" "}
          {entry.obsoletedBy.map((num, i) => (
            <span key={num}>
              {i > 0 ? ", " : ""}
              <a href={canonicalRfcPath(num)} className="underline">
                RFC {num}
              </a>
            </span>
          ))}
          . Read the newer document for current behaviour.
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {errata.verified > 0 ? (
          <a href={errataUrl} className="neo-link font-semibold hover:underline">
            {plural(errata.verified, "verified errata")}
          </a>
        ) : null}
        {errata.held > 0 ? <span>{plural(errata.held, "held for document update")}</span> : null}
        {errata.reported > 0 ? <span>{plural(errata.reported, "reported (unverified)")}</span> : null}
      </div>

      <p className="mt-3 text-xs text-[hsl(var(--neo-soft-text))] dark:text-neutral-400">
        Index fetched {fetchedAt.slice(0, 10)} from rfc-editor.org
      </p>
    </header>
  );
}
