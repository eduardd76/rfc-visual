"use client";

import { useEffect, useState } from "react";

import { RFC_EDITOR_ORIGIN } from "~/lib/site";

type State = { kind: "loading" } | { kind: "loaded"; text: string } | { kind: "failed" };

export function RfcText({ num, formats }: { num: number; formats: string[] }) {
  const hasText = formats.includes("TXT");
  const textUrl = `${RFC_EDITOR_ORIGIN}/rfc/rfc${num}.txt`;
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!hasText) return;
    let cancelled = false;
    fetch(textUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then((text) => {
        // Form feeds mark the old paginated layout's page breaks.
        if (!cancelled) setState({ kind: "loaded", text: text.replace(/\f/g, "") });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "failed" });
      });
    return () => {
      cancelled = true;
    };
  }, [hasText, textUrl]);

  if (!hasText) {
    const format = formats[0]?.toLowerCase() ?? "html";
    return (
      <p className="text-sm">
        This RFC has no plain-text version.{" "}
        <a href={`${RFC_EDITOR_ORIGIN}/rfc/rfc${num}.${format}`} className="neo-link hover:underline">
          Read it on rfc-editor.org
        </a>
      </p>
    );
  }
  if (state.kind === "failed") {
    return (
      <p className="text-sm">
        Couldn&apos;t load the text.{" "}
        <a href={textUrl} className="neo-link hover:underline">
          Read it on rfc-editor.org
        </a>
      </p>
    );
  }
  if (state.kind === "loading") return <p className="text-sm">Loading the RFC text…</p>;
  return (
    <pre className="overflow-x-auto text-[13px] leading-snug whitespace-pre">{state.text}</pre>
  );
}
