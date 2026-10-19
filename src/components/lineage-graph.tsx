"use client";

import MermaidChart from "~/components/mermaid-diagram";

export function LineageGraph({ chart }: { chart: string }) {
  return (
    <MermaidChart
      chart={chart}
      zoomingEnabled={false}
      fitToContainer
      containerClassName="h-[320px] sm:h-[380px]"
    />
  );
}
