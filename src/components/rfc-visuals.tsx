"use client";

import { useState } from "react";

import MermaidChart from "~/components/mermaid-diagram";
import { RFC_EDITOR_ORIGIN } from "~/lib/site";
import { formatSegment, sequenceToMermaid, stateMachineToMermaid } from "~/visuals/compile";
import type { Cite, Layer, RfcVisualModel, Sequence } from "~/visuals/types";

const OPTIONAL_LAYERS: { layer: Layer; label: string }[] = [
  { layer: "rst", label: "Reset (RST) handling" },
  { layer: "error", label: "ABORT by the user" },
];

function Source({ rfc, cite }: { rfc: number; cite: Cite }) {
  return (
    <span className="block text-xs">
      <a
        href={`${RFC_EDITOR_ORIGIN}/rfc/rfc${rfc}.html#section-${cite.section}`}
        className="neo-link font-semibold hover:underline"
      >
        RFC {rfc} §{cite.section}
      </a>{" "}
      <q className="text-[hsl(var(--neo-soft-text))] dark:text-neutral-400">{cite.quote}</q>
    </span>
  );
}

function SequenceView({ rfc, sequence }: { rfc: number; sequence: Sequence }) {
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
                {i + 1}. {step.from === "A" ? "A → B" : "B → A"}: {formatSegment(step.segment)}
              </p>
              <p className="mt-1">{step.explain}</p>
              <p className="mt-1 text-xs">
                A: <strong>{step.stateA}</strong> · B: <strong>{step.stateB}</strong>
              </p>
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
          <input type="checkbox" checked disabled /> Normal open and close
        </label>
        {OPTIONAL_LAYERS.map(({ layer, label }) => (
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

export function RfcVisuals({ model }: { model: RfcVisualModel }) {
  const tabs = [
    ...model.sequences.map((s) => ({ id: s.id, label: s.title })),
    { id: "state-machine", label: "State machine" },
  ];
  // Handshake first, then the state machine, then the close.
  const ordered = [tabs[0]!, tabs[tabs.length - 1]!, ...tabs.slice(1, -1)];
  const [active, setActive] = useState(ordered[0]!.id);
  const sequence = model.sequences.find((s) => s.id === active);

  return (
    <section className="space-y-4">
      <p className="rounded-md border-2 border-dashed border-black px-4 py-3 text-sm dark:border-neutral-500">
        Built by hand from RFC {model.rfc}. Every arrow and step cites the RFC sentence it comes
        from, and an automated test checks each quote against the RFC text.{" "}
        {model.reviewed ? null : <strong>Provisional: not yet reviewed by a second engineer.</strong>}
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
        ) : (
          <StateMachineView model={model} />
        )}
      </div>

      <p className="text-xs text-[hsl(var(--neo-soft-text))] dark:text-neutral-400">
        Not shown: {model.notShown.join("; ")}.
      </p>
    </section>
  );
}
