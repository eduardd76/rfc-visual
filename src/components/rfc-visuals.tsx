"use client";

import { useState } from "react";

import MermaidChart from "~/components/mermaid-diagram";
import { GITHUB_REPO_URL, RFC_EDITOR_ORIGIN } from "~/lib/site";
import {
  formatSegment,
  headerRows,
  sequenceToMermaid,
  stateMachineToMermaid,
} from "~/visuals/compile";
import type { Cite, Header, Layer, RfcVisualModel, Sequence } from "~/visuals/types";

/** The "Verify an RFC visual" issue form, prefilled for this RFC. */
function verifyUrl(rfc: number): string {
  const params = new URLSearchParams({
    template: "verify-visual.yml",
    rfc: String(rfc),
    title: `[Verify] RFC ${rfc}`,
  });
  return `${GITHUB_REPO_URL}/issues/new?${params.toString()}`;
}

const OPTIONAL_LAYERS: { layer: Layer; label: string }[] = [
  { layer: "rst", label: "Resets and refusals" },
  { layer: "error", label: "Errors, aborts and timeouts" },
];

function Source({ rfc, cite }: { rfc: number; cite: Cite }) {
  const whole = cite.section === "-";
  return (
    <span className="block text-xs">
      <a
        href={`${RFC_EDITOR_ORIGIN}/rfc/rfc${rfc}.html${whole ? "" : `#section-${cite.section}`}`}
        className="neo-link font-semibold hover:underline"
      >
        {whole ? `RFC ${rfc}` : `RFC ${rfc} §${cite.section}`}
      </a>{" "}
      <q className="text-[hsl(var(--neo-soft-text))] dark:text-neutral-400">{cite.quote}</q>
    </span>
  );
}

function SequenceView({ rfc, sequence }: { rfc: number; sequence: Sequence }) {
  const names = sequence.participants ?? { a: "A", b: "B" };
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="neo-panel h-[760px] rounded-lg p-2">
        <MermaidChart chart={sequenceToMermaid(sequence)} zoomingEnabled containerClassName="h-full" />
      </div>
      <div>
        <p className="mb-3 text-sm">
          <Source rfc={rfc} cite={sequence.intro} />
        </p>
        <ol aria-label={`${sequence.title} steps`} className="space-y-3">
          {sequence.steps.map((step, i) => (
            <li key={i} className="rounded-md border-2 border-black p-3 text-sm dark:border-neutral-600">
              <p className="font-mono text-xs font-semibold">
                {i + 1}. {step.from === "A" ? `${names.a} → ${names.b}` : `${names.b} → ${names.a}`}:{" "}
                {formatSegment(step.segment)}
              </p>
              <p className="mt-1">{step.explain}</p>
              {step.stateA || step.stateB ? (
                <p className="mt-1 text-xs">
                  {names.a}: <strong>{step.stateA ?? "—"}</strong> · {names.b}:{" "}
                  <strong>{step.stateB ?? "—"}</strong>
                </p>
              ) : null}
              <div className="mt-2">
                <Source rfc={rfc} cite={step.cite} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function StateMachineView({ model }: { model: RfcVisualModel }) {
  const [layers, setLayers] = useState<Layer[]>(["happy"]);
  const shown = model.transitions.filter((t) => layers.includes(t.layer));

  return (
    <div className="space-y-4">
      <fieldset className="flex flex-wrap gap-4 text-sm">
        <legend className="sr-only">Show transitions</legend>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked disabled /> Normal path
        </label>
        {OPTIONAL_LAYERS.filter(({ layer }) =>
          model.transitions.some((t) => t.layer === layer),
        ).map(({ layer, label }) => (
          <label key={layer} className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={layers.includes(layer)}
              onChange={(event) =>
                setLayers((current) =>
                  event.target.checked ? [...current, layer] : current.filter((l) => l !== layer),
                )
              }
            />
            {label}
          </label>
        ))}
      </fieldset>

      <div className="neo-panel h-[900px] rounded-lg p-2">
        <MermaidChart chart={stateMachineToMermaid(model, layers)} zoomingEnabled containerClassName="h-full" />
      </div>

      <div className="overflow-x-auto">
        <table aria-label="Transitions" className="w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-black dark:border-neutral-600">
              <th className="py-2 pr-3">From → To</th>
              <th className="py-2 pr-3">Event / action</th>
              <th className="py-2">Source</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((t, i) => (
              <tr key={i} className="border-b border-black/20 align-top dark:border-neutral-700">
                <td className="py-2 pr-3 font-mono text-xs whitespace-nowrap">
                  {t.from} → {t.to}
                </td>
                <td className="py-2 pr-3">
                  {t.event}
                  {t.action ? ` / ${t.action}` : ""}
                  {t.note ? <span className="block text-xs italic">{t.note}</span> : null}
                </td>
                <td className="py-2">
                  <Source rfc={model.rfc} cite={t.cite} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer font-semibold">What each state means</summary>
        <dl className="mt-2 space-y-2">
          {model.states.map((state) => (
            <div key={state.id}>
              <dt className="font-mono text-xs font-semibold">{state.id}</dt>
              <dd>
                <Source rfc={model.rfc} cite={state.cite} />
              </dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}

function HeaderView({ rfc, header }: { rfc: number; header: Header }) {
  const [selected, setSelected] = useState(header.fields[0]?.name);
  const field = header.fields.find((f) => f.name === selected);
  const rows = headerRows(header.fields);

  return (
    <div className="space-y-4">
      <p className="text-sm">
        <Source rfc={rfc} cite={header.intro} />
      </p>
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-32 font-mono text-[10px] text-[hsl(var(--neo-soft-text))]">
            {Array.from({ length: 32 }, (_, bit) => (
              <span key={bit} className="text-center">
                {bit}
              </span>
            ))}
          </div>
          {rows.map((row, r) => (
            <div key={r} className="grid grid-cols-32">
              {row.map((segment, s) => (
                <button
                  key={s}
                  type="button"
                  aria-label={`${segment.name}, ${segment.bits === "var" ? "variable length" : `${segment.bits} bits`}${segment.continued ? " (continued)" : ""}`}
                  aria-pressed={selected === segment.name}
                  onClick={() => setSelected(segment.name)}
                  style={{ gridColumn: `span ${segment.bits === "var" ? 32 : segment.bits}` }}
                  className={`-mt-[2px] -ml-[2px] min-h-[44px] border-2 border-black px-1 text-xs font-medium transition-colors duration-150 ease-out dark:border-neutral-500 ${
                    selected === segment.name ? "neo-button" : "bg-[hsl(var(--neo-subtle))] dark:bg-transparent"
                  }`}
                >
                  {segment.name}
                  {segment.continued ? " …" : ""}
                  {segment.bits === "var" ? " (variable)" : ""}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      {field ? (
        <div className="rounded-md border-2 border-black p-3 text-sm dark:border-neutral-600">
          <p className="font-semibold">
            {field.name} · {field.bits === "var" ? "variable length" : `${field.bits} bits`}
          </p>
          <p className="mt-1">{field.explain}</p>
          <div className="mt-2">
            <Source rfc={rfc} cite={field.cite} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function RfcVisuals({ model }: { model: RfcVisualModel }) {
  const sequenceTabs = model.sequences.map((s) => ({ id: s.id, label: s.title }));
  const stateTab =
    model.states.length > 0
      ? [{ id: "state-machine", label: model.stateMachineTitle ?? "State machine" }]
      : [];
  const headerTabs = model.headers.map((h) => ({ id: `header-${h.id}`, label: h.title }));
  // First flow, then the state machine, then the remaining flows and the headers.
  const ordered = [...sequenceTabs.slice(0, 1), ...stateTab, ...sequenceTabs.slice(1), ...headerTabs];
  const [active, setActive] = useState(ordered[0]?.id);
  const sequence = model.sequences.find((s) => s.id === active);
  const header = model.headers.find((h) => `header-${h.id}` === active);

  return (
    <section className="space-y-4">
      <p className="rounded-md border-2 border-dashed border-black px-4 py-3 text-sm dark:border-neutral-500">
        {model.review ? (
          <>
            <strong>
              Reviewed by{" "}
              <a href={`https://github.com/${model.review.by}`} className="neo-link hover:underline">
                @{model.review.by}
              </a>{" "}
              on {model.review.date}
              {model.review.issue ? (
                <>
                  {" "}
                  (
                  <a href={`${GITHUB_REPO_URL}/issues/${model.review.issue}`} className="neo-link hover:underline">
                    #{model.review.issue}
                  </a>
                  )
                </>
              ) : null}
              .
            </strong>{" "}
            {model.provenance
              ? `Drafted by ${model.provenance.model} and checked by a maintainer against RFC ${model.rfc}. `
              : `Built by hand from RFC ${model.rfc}. `}
            Every arrow, step and field cites the RFC sentence it comes from.{" "}
          </>
        ) : model.provenance ? (
          <>
            <strong>
              Machine-generated by {model.provenance.model} on{" "}
              {model.provenance.generatedAt.slice(0, 10)}, not reviewed by anyone.
            </strong>{" "}
            Every arrow, step and field cites an RFC {model.rfc} sentence that an automated check
            confirmed exists.{" "}
            {model.provenance.dropped > 0
              ? `${model.provenance.dropped} elements failed the citation check and were removed. `
              : ""}
            Treat it as a draft.{" "}
          </>
        ) : (
          <>
            Built by hand from RFC {model.rfc}. Every arrow, step and field cites the RFC sentence
            it comes from, and an automated test checks each quote against the RFC text.{" "}
            <strong>Provisional: not yet reviewed by a maintainer.</strong>{" "}
          </>
        )}
        <a href={verifyUrl(model.rfc)} className="neo-link font-semibold hover:underline">
          Help verify this visual
        </a>
      </p>

      <div role="tablist" aria-label="Visuals" className="flex flex-wrap gap-2">
        {ordered.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={`min-h-[40px] rounded-md border-2 border-black px-4 text-sm font-semibold transition-transform duration-150 ease-out active:scale-[0.97] ${
              active === tab.id ? "neo-button" : "bg-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {sequence ? (
          <SequenceView rfc={model.rfc} sequence={sequence} />
        ) : header ? (
          <HeaderView rfc={model.rfc} header={header} />
        ) : (
          <StateMachineView model={model} />
        )}
      </div>

      <p className="text-xs text-[hsl(var(--neo-soft-text))] dark:text-neutral-400">
        Quoted text consists of unmodified excerpts from RFC {model.rfc}, published by the IETF
        (line breaks reflowed). Copyright in the RFC text belongs to the IETF Trust and the
        persons identified as the document authors, as stated in the RFC. The diagrams and
        plain-English explanations are rfc-visual&apos;s own and do not replace the RFC.
      </p>

      {model.notShown.length > 0 ? (
        <p className="text-xs text-[hsl(var(--neo-soft-text))] dark:text-neutral-400">
          Not shown: {model.notShown.join("; ")}.
        </p>
      ) : null}
    </section>
  );
}
