import { canonicalRfcPath } from "~/rfc/canonical";
import type { RfcEntry } from "~/rfc/types";

const GROUPS = [
  { key: "obsoletedBy", label: "Obsoleted by" },
  { key: "updatedBy", label: "Updated by" },
  { key: "obsoletes", label: "Obsoletes" },
  { key: "updates", label: "Updates" },
] as const;

/**
 * Every relation as a text link, newest first. The graph folds long lists
 * into "+K more"; this list never does.
 */
export function RfcRelations({
  entry,
  titles,
}: {
  entry: RfcEntry;
  titles: Record<number, string>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {GROUPS.map(({ key, label }) => {
        const nums = [...entry[key]].sort((a, b) => b - a);
        if (nums.length === 0) return null;
        const name = `${label} (${nums.length})`;
        return (
          <div key={key} role="group" aria-label={name}>
            <h3 className="mb-1 text-sm font-semibold">{name}</h3>
            <ul className="space-y-0.5 text-sm">
              {nums.map((num) => (
                <li key={num}>
                  <a href={canonicalRfcPath(num)} className="neo-link hover:underline">
                    RFC {num}
                    {titles[num] ? ` — ${titles[num]}` : ""}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
