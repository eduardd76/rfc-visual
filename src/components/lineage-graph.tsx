"use client";

import MermaidChart from "~/components/mermaid-diagram";

const ROW_HEIGHT = 56;
const PADDING = 48;
const MIN_HEIGHT = 240;

/** Container height for a graph with `rows` node rows on its taller side. */
export function lineageGraphHeight(rows: number): number {
  return Math.max(MIN_HEIGHT, PADDING + rows * ROW_HEIGHT);
}

export function LineageGraph({ chart, rows }: { chart: string; rows: number }) {
  return (
    <div style={{ height: lineageGraphHeight(rows) }}>
      <MermaidChart chart={chart} zoomingEnabled containerClassName="h-full" />
    </div>
  );
}
